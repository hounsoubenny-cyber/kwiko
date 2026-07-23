#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jul 22 00:02:04 2026

@author: hounsousamuel
"""

"""
Suite de tests pour le backend Kwiko.

Lancer avec :  pytest test_backend.py -v

Ce qui est mocké et pourquoi :
- LLMManager.generate  -> évite de vraiment appeler l'API Groq à chaque test (coût, réseau,
  lenteur, non-déterminisme des réponses générées).
- whatsapp_client.send_message -> évite de vraiment envoyer des messages WhatsApp pendant
  les tests (impossible sans token Meta réel + numéro de test, et on ne veut pas spammer).

Ce qui N'est PAS mocké :
- Le RAG (FAISS + ton modèle d'embedding local) -> tourne réellement, en local, sans réseau,
  donc pas besoin de le simuler : ça valide que la recherche sémantique fonctionne vraiment.
- La base de données -> SQLite en mémoire (":memory:"), recréée à zéro à chaque test.
"""

import os
import os
import sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", ".."))))
# Variables d'environnement nécessaires AVANT d'importer quoi que ce soit du package kwiko
# (config.py les lit au chargement du module).
os.environ.setdefault("KWIKO_JWT_SECRET", "test-secret-key")
os.environ.setdefault("KWIKO_WHATSAPP_VERIFY_TOKEN", "test-verify-token")
os.environ.setdefault("KWIKO_DB_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("GROQ_API_KEY_1", "clé-factice-jamais-vraiment-appelée")

import pytest
from fastapi.testclient import TestClient

from kwiko.backend.api.main_api import app
import kwiko.backend.api.router as router_mod
import kwiko.backend.api.whatsapp_client as wac_mod

@pytest.fixture
def sent_whatsapp_messages(monkeypatch):
    """Remplace l'envoi WhatsApp réel par un enregistrement en mémoire qu'on peut inspecter."""
    sent = []
 
    async def fake_send_message(phone_number_id, token, to, texte):
        sent.append({"phone_number_id": phone_number_id, "token": token, "to": to, "texte": texte})
        return {"messages": [{"id": "wamid.FAKE_OUT"}]}
 
    monkeypatch.setattr(wac_mod, "send_message", fake_send_message)
    monkeypatch.setattr(router_mod, "send_message", fake_send_message)
    return sent
 
 
@pytest.fixture
def client(monkeypatch, sent_whatsapp_messages):
    """TestClient avec le lifespan FastAPI déclenché (nécessaire pour app.state.*).
 
    IMPORTANT : router.py garde DB_MANAGER / RAG_ENGINE / LLM_MANAGER en singletons
    globaux (créés une seule fois par processus, cf. get_db()/get_rag()/get_llm()) —
    un bon choix en production, mais qui fait que pytest (un seul processus) reculait
    au premier objet créé dans tous les tests suivants, sans vraiment repartir d'une
    base vide malgré ":memory:". On force ici la réinitialisation avant chaque test
    pour une isolation réelle, indépendante de l'ordre d'exécution.
    """
    monkeypatch.setattr(router_mod, "DB_MANAGER", None)
    monkeypatch.setattr(router_mod, "RAG_ENGINE", None)
    monkeypatch.setattr(router_mod, "LLM_MANAGER", None)
 
    with TestClient(app) as c:
        # Le LLMManager est déjà instancié à ce stade (lifespan exécuté) -> on remplace
        # sa méthode generate() par une version prévisible, sans appel réseau réel.
        def fake_generate(system_prompt, prompt, max_tokens=1024):
            return "Réponse générée simulée pour les tests."
 
        monkeypatch.setattr(c.app.state.llm_manager, "generate", fake_generate)
        yield c
 
 
@pytest.fixture
def signup_payload():
    return {
        "entreprise_name": "Pharmacie Test",
        "email": "pharmacie@test.com",
        "password": "motdepasse123",
        "whatsapp_phone_number_id": "PNID_TEST",
        "whatsapp_token": "TOKEN_TEST",
        "faqs": (
            "Q: Quels sont vos horaires ?\n"
            "R: Nous sommes ouverts de 8h à 18h.\n\n"
            "Q: Livrez-vous à Cotonou ?\n"
            "R: Oui, sous 24h."
        ),
    }
 
 
# --- AUTH -------------------------------------------------------------------
 
def test_signup_creates_client_and_returns_token(client, signup_payload):
    r = client.post("/api/auth/signup", json=signup_payload)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == signup_payload["email"]
    assert "access_token" in body
 
 
def test_signup_duplicate_email_rejected(client, signup_payload):
    client.post("/api/auth/signup", json=signup_payload)
    r = client.post("/api/auth/signup", json=signup_payload)
    assert r.status_code == 406
 
 
def test_login_with_correct_password(client, signup_payload):
    client.post("/api/auth/signup", json=signup_payload)
    r = client.post("/api/auth/login", json={
        "email": signup_payload["email"],
        "password": signup_payload["password"],
    })
    assert r.status_code == 200
    assert "access_token" in r.json()
 
 
def test_login_with_wrong_password_rejected(client, signup_payload):
    client.post("/api/auth/signup", json=signup_payload)
    r = client.post("/api/auth/login", json={
        "email": signup_payload["email"],
        "password": "mauvais_mot_de_passe",
    })
    assert r.status_code == 401
 
 
def test_login_with_unknown_email_rejected(client):
    r = client.post("/api/auth/login", json={
        "email": "inconnu@test.com",
        "password": "peu_importe",
    })
    assert r.status_code == 401
 
 
# --- FAQ ---------------------------------------------------------------------
 
def test_faqs_created_at_signup_are_listable_with_correct_question_response(client, signup_payload):
    r = client.post("/api/auth/signup", json=signup_payload)
    token = r.json()["access_token"]
 
    r = client.post("/api/faqs/list", json={
        "email": signup_payload["email"],
        "password": signup_payload["password"],
        "token": token,
    })
    assert r.status_code == 200
    faqs = r.json()
    assert len(faqs) == 2
    # Vérifie que question et réponse ne sont jamais identiques (régression du bug
    # Q:/R: qu'on a corrigé)
    for faq in faqs:
        assert faq["question"] != faq["response"]
    assert any("horaires" in f["question"].lower() for f in faqs)
 
 
def test_add_faq_after_signup(client, signup_payload):
    r = client.post("/api/auth/signup", json=signup_payload)
    token = r.json()["access_token"]
 
    r = client.post("/api/faqs", json={
        "email": signup_payload["email"],
        "password": signup_payload["password"],
        "faqs": "Q: Acceptez-vous les paiements mobile money ?\nR: Oui, Moov et MTN.",
    })
    assert r.status_code == 201
 
    r = client.post("/api/faqs/list", json={
        "email": signup_payload["email"],
        "password": signup_payload["password"],
        "token": token,
    })
    assert len(r.json()) == 3  # 2 de la signup + 1 ajoutée
 
 
# --- WEBHOOK : vérification (GET) --------------------------------------------
 
def test_webhook_verification_success(client):
    r = client.get("/api/webhook", params={
        "hub.mode": "subscribe",
        "hub.verify_token": "test-verify-token",
        "hub.challenge": "123456",
    })
    assert r.status_code == 200
    assert r.json() == 123456
 
 
def test_webhook_verification_wrong_token_rejected(client):
    r = client.get("/api/webhook", params={
        "hub.mode": "subscribe",
        "hub.verify_token": "mauvais-token",
        "hub.challenge": "123456",
    })
    assert r.status_code == 403
 
 
def test_webhook_verification_missing_param_returns_422(client):
    r = client.get("/api/webhook", params={"hub.mode": "subscribe"})
    assert r.status_code == 422
 
 
# --- WEBHOOK : réception de messages (POST) ----------------------------------
 
def _payload_message(phone_number_id, wa_id, wamid, texte, nom="Client Test"):
    return {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": phone_number_id},
                    "contacts": [{"profile": {"name": nom}, "wa_id": wa_id}],
                    "messages": [{"id": wamid, "type": "text", "text": {"body": texte}}],
                }
            }]
        }]
    }
 
 
def test_webhook_message_triggers_rag_and_sends_reply(client, signup_payload, sent_whatsapp_messages):
    client.post("/api/auth/signup", json=signup_payload)
 
    payload = _payload_message(
        phone_number_id=signup_payload["whatsapp_phone_number_id"],
        wa_id="22987000000",
        wamid="wamid.TEST1",
        texte="vous ouvrez à quelle heure ?",
    )
    r = client.post("/api/webhook", json=payload)
    assert r.status_code == 200
    assert len(sent_whatsapp_messages) == 1
    assert sent_whatsapp_messages[0]["to"] == "22987000000"
    assert sent_whatsapp_messages[0]["phone_number_id"] == signup_payload["whatsapp_phone_number_id"]
 
 
def test_webhook_duplicate_wamid_is_ignored(client, signup_payload, sent_whatsapp_messages):
    client.post("/api/auth/signup", json=signup_payload)
 
    payload = _payload_message(
        phone_number_id=signup_payload["whatsapp_phone_number_id"],
        wa_id="22987000000",
        wamid="wamid.DUPLICATE",
        texte="Test anti-doublon",
    )
    client.post("/api/webhook", json=payload)
    client.post("/api/webhook", json=payload)  # rejoué, simulateur de retry Meta
 
    assert len(sent_whatsapp_messages) == 1  # pas 2
 
 
def test_webhook_unknown_phone_number_id_ignored_gracefully(client, sent_whatsapp_messages):
    payload = _payload_message(
        phone_number_id="PNID_JAMAIS_ENREGISTRE",
        wa_id="22900000000",
        wamid="wamid.UNKNOWN",
        texte="Test",
    )
    r = client.post("/api/webhook", json=payload)
    assert r.status_code == 200  # ne doit jamais planter, même pour un client inconnu
    assert len(sent_whatsapp_messages) == 0
 
 
def test_webhook_status_event_is_ignored(client):
    """Un accusé de réception (statuses) ne doit jamais faire planter le endpoint."""
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": "PNID_TEST"},
                    "statuses": [{"id": "wamid.OUT", "status": "delivered"}],
                }
            }]
        }]
    }
    r = client.post("/api/webhook", json=payload)
    assert r.status_code == 200
 
 
def test_webhook_non_text_message_is_ignored(client, signup_payload, sent_whatsapp_messages):
    client.post("/api/auth/signup", json=signup_payload)
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "metadata": {"phone_number_id": signup_payload["whatsapp_phone_number_id"]},
                    "contacts": [{"profile": {"name": "X"}, "wa_id": "22900000001"}],
                    "messages": [{"id": "wamid.IMG1", "type": "image", "image": {"id": "IMG_ID"}}],
                }
            }]
        }]
    }
    r = client.post("/api/webhook", json=payload)
    assert r.status_code == 200
    assert len(sent_whatsapp_messages) == 0  # MVP : le texte uniquement est géré
 

if __name__ == "__main__":
    sys.exit(
        pytest.main([
            __file__,
            "-v",
            "-p no:logfire",
            "--tb=short",
        ])
    )