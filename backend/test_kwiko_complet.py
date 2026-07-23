#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Jul 23 10:11:50 2026

@author: hounsousamuel
"""

"""
================================================================================
 TEST KWIKO COMPLET
================================================================================

Ce script teste TOUTE l'API Kwiko de bout en bout, en conditions réelles :
  - Vraie base de données (celle configurée dans ton .env / KWIKO_DB_URL)
  - Vrai moteur RAG (recherche FAISS + embeddings réels)
  - Vrai LLM (vrai appel Groq, vraie réponse générée)
  - Vrai envoi WhatsApp (optionnel, voir plus bas) 

La SEULE chose "simulée" est le passage par Meta : au lieu d'attendre qu'un
vrai message WhatsApp traverse Internet -> Meta -> ngrok -> ton backend
(le maillon qui plantait), ce script envoie DIRECTEMENT à ton backend local
un payload identique à celui que Meta t'aurait envoyé. Tout le reste
(base de données, FAQ, RAG, LLM, et même l'envoi réel de la réponse sur
WhatsApp si tu le configures) est 100% réel.

--------------------------------------------------------------------------------
PRÉREQUIS
--------------------------------------------------------------------------------
1. Ton backend Kwiko doit tourner (uvicorn / run_api.py), en local suffit :
   uvicorn kwiko.backend.api.main_api:app --port 8000

2. Installe httpx si ce n'est pas déjà fait :
   pip install httpx --break-system-packages

--------------------------------------------------------------------------------
DEUX MODES D'UTILISATION
--------------------------------------------------------------------------------

MODE A - Régression automatique (par défaut, aucune config Meta requise) :
    python test_kwiko_complet.py

    Un compte de test jetable est créé avec un faux whatsapp_phone_number_id
    et un faux token. Toute la logique (DB, RAG, LLM) est testée pour de vrai.
    Seul l'ENVOI final vers WhatsApp échouera (token invalide) -- et c'est
    normal et attendu dans ce mode : le script vérifie juste que ton backend
    gère bien cet échec proprement (sans planter), et que le message ET la
    réponse générée par l'IA sont bien enregistrés en base malgré tout.

MODE B - Test réel de bout en bout, avec un vrai message WhatsApp reçu sur
ton téléphone :
    export KWIKO_TEST_PHONE_NUMBER_ID="1145511591989918"
    export KWIKO_TEST_WHATSAPP_TOKEN="EAAKxxxx...ton_vrai_token..."
    export KWIKO_TEST_RECIPIENT_WA_ID="2290145111786"   # ton numéro test verifié
    python test_kwiko_complet.py

    Le compte de test est créé avec TES vrais identifiants Meta. La réponse
    générée par l'IA sera véritablement envoyée sur WhatsApp, et tu devrais
    la recevoir sur ton téléphone comme un vrai message.

--------------------------------------------------------------------------------
AUTRES VARIABLES D'ENVIRONNEMENT UTILES
--------------------------------------------------------------------------------
KWIKO_TEST_API_BASE_URL     URL de ton backend (défaut: http://localhost:8000)
KWIKO_WHATSAPP_VERIFY_TOKEN Ton verify token webhook (pour tester la vérification GET)
KWIKO_TEST_SKIP_INTERACTIVE Si "1", saute le mode interactif à la fin

--------------------------------------------------------------------------------
À LA FIN DES TESTS AUTOMATIQUES
--------------------------------------------------------------------------------
Un mode interactif s'ouvre : tu peux taper des messages comme si tu étais
un client WhatsApp, et voir en direct la réponse que l'IA aurait générée
(et l'envoie réellement si le MODE B est actif).
================================================================================
"""

import os
import sys
import json
import time
import uuid
import random
from datetime import datetime, timezone
from dotenv import load_dotenv
try:
    import httpx
except ImportError:
    print("❌ Le paquet 'httpx' est requis. Installe-le avec :")
    print("   pip install httpx --break-system-packages")
    sys.exit(1)


# ==============================================================================
# CONFIGURATION
# ==============================================================================

load_dotenv()
API_BASE_URL = os.environ.get("KWIKO_TEST_API_BASE_URL", "http://localhost:8000").rstrip("/")
VERIFY_TOKEN = os.environ.get("KWIKO_WHATSAPP_VERIFY_TOKEN", "")
SKIP_INTERACTIVE = os.environ.get("KWIKO_TEST_SKIP_INTERACTIVE", "0").strip() == "1"

REAL_PHONE_NUMBER_ID = os.environ.get("KWIKO_TEST_PHONE_NUMBER_ID", "").strip()
REAL_WHATSAPP_TOKEN = os.environ.get("KWIKO_TEST_WHATSAPP_TOKEN", "").strip()
REAL_RECIPIENT_WA_ID = os.environ.get("KWIKO_TEST_RECIPIENT_WA_ID", "").strip()

REAL_MODE = bool(REAL_PHONE_NUMBER_ID and REAL_WHATSAPP_TOKEN and REAL_RECIPIENT_WA_ID)

RUN_ID = uuid.uuid4().hex[:8]
TEST_EMAIL = f"kwiko.test.{RUN_ID}@example.com"
TEST_PASSWORD = "MotDePasseTest!2026"
TEST_ENTREPRISE = f"Boutique Test {RUN_ID}"

if REAL_MODE:
    TEST_PHONE_NUMBER_ID = REAL_PHONE_NUMBER_ID
    TEST_WHATSAPP_TOKEN = REAL_WHATSAPP_TOKEN
    TEST_RECIPIENT_WA_ID = REAL_RECIPIENT_WA_ID
else:
    TEST_PHONE_NUMBER_ID = f"TEST-PNID-{RUN_ID}"
    TEST_WHATSAPP_TOKEN = f"FAKE-TOKEN-{RUN_ID}"
    TEST_RECIPIENT_WA_ID = f"22900000{random.randint(1000, 9999)}"

TEST_FAQS_TEXT = (
    "Q: Quels sont vos horaires ?\n"
    "R: Nous sommes ouverts de 8h à 18h, du lundi au samedi.\n"
    "\n"
    "Q: Livrez-vous à Cotonou ?\n"
    "R: Oui, nous livrons à Cotonou sous 24h, avec des frais de 1500 FCFA.\n"
    "\n"
    "Q: Acceptez-vous le paiement mobile money ?\n"
    "R: Oui, nous acceptons MTN Mobile Money et Moov Money.\n"
)

INCOMING_TEST_MESSAGE = "Bonjour, est-ce que vous livrez à Cotonou ?"


# ==============================================================================
# AFFICHAGE
# ==============================================================================

class C:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    END = "\033[0m"


def title(txt):
    print(f"\n{C.BOLD}{C.BLUE}{'=' * 70}\n {txt}\n{'=' * 70}{C.END}")


def ok(txt):
    print(f"  {C.GREEN}✅ {txt}{C.END}")


def fail(txt):
    print(f"  {C.RED}❌ {txt}{C.END}")


def info(txt):
    print(f"  {C.YELLOW}ℹ️  {txt}{C.END}")


def dim(txt):
    print(f"     {txt}")


# ==============================================================================
# ÉTAT PARTAGÉ DES TESTS
# ==============================================================================

class State:
    access_token = None
    client_id = None
    faq_ids = []
    contact_id = None
    message_id = None

results = {"passed": 0, "failed": 0, "failures": []}


def record(name, success, detail=""):
    if success:
        results["passed"] += 1
        ok(name)
    else:
        results["failed"] += 1
        results["failures"].append((name, detail))
        fail(f"{name}  {('- ' + detail) if detail else ''}")


# ==============================================================================
# CLIENT HTTP
# ==============================================================================

client = httpx.Client(base_url=API_BASE_URL, timeout=30.0)


def api_post(path, json_body):
    try:
        res = client.post(path, json=json_body)
        return res
    except httpx.ConnectError:
        print(f"\n{C.RED}❌ Impossible de se connecter à {API_BASE_URL}")
        print(f"   Vérifie que ton backend tourne bien (uvicorn / run_api.py).{C.END}\n")
        sys.exit(1)


def api_get(path, params=None):
    try:
        res = client.get(path, params=params or {})
        return res
    except httpx.ConnectError:
        print(f"\n{C.RED}❌ Impossible de se connecter à {API_BASE_URL}{C.END}\n")
        sys.exit(1)


# ==============================================================================
# TESTS AUTOMATIQUES
# ==============================================================================

def test_health():
    title("SANTÉ DU SERVEUR")
    try:
        res = client.get("/health")
        record("GET /health répond", res.status_code == 200, f"status={res.status_code}")
    except httpx.ConnectError:
        print(f"\n{C.RED}❌ Backend injoignable sur {API_BASE_URL}. Lance-le d'abord.{C.END}\n")
        sys.exit(1)


def test_signup():
    title("INSCRIPTION (/auth/signup)")

    res = api_post("/api/auth/signup", {
        "entreprise_name": TEST_ENTREPRISE,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "whatsapp_phone_number_id": TEST_PHONE_NUMBER_ID,
        "whatsapp_token": TEST_WHATSAPP_TOKEN,
        "faqs": TEST_FAQS_TEXT,
    })
    success = res.status_code == 201
    record("Inscription réussie (201)", success, f"status={res.status_code} body={res.text[:200]}")
    if success:
        data = res.json()
        State.access_token = data.get("access_token")
        State.client_id = data.get("id")
        record("access_token reçu", bool(State.access_token))
        record("id client reçu", State.client_id is not None)
        dim(f"client_id={State.client_id}  email={TEST_EMAIL}")
    else:
        print(f"\n{C.RED}Impossible de continuer sans un compte créé. Arrêt des tests.{C.END}")
        print_summary()
        sys.exit(1)

    # Doublon d'email -> doit être refusé
    res_dup_email = api_post("/api/auth/signup", {
        "entreprise_name": "Autre Boutique",
        "email": TEST_EMAIL,
        "password": "AutreMotDePasse123",
        "whatsapp_phone_number_id": f"TEST-PNID-{uuid.uuid4().hex[:8]}",
        "whatsapp_token": "autre-token",
        "faqs": None,
    })
    record(
        "Email en double refusé (406)",
        res_dup_email.status_code == 406,
        f"status={res_dup_email.status_code}"
    )

    # Doublon de phone_number_id -> doit être refusé
    res_dup_phone = api_post("/api/auth/signup", {
        "entreprise_name": "Encore une autre Boutique",
        "email": f"kwiko.test.dup.{uuid.uuid4().hex[:8]}@example.com",
        "password": "AutreMotDePasse123",
        "whatsapp_phone_number_id": TEST_PHONE_NUMBER_ID,
        "whatsapp_token": "autre-token",
        "faqs": None,
    })
    record(
        "whatsapp_phone_number_id en double refusé (406)",
        res_dup_phone.status_code == 406,
        f"status={res_dup_phone.status_code} body={res_dup_phone.text[:200]}"
    )


def test_login():
    title("CONNEXION (/auth/login)")

    res = api_post("/api/auth/login", {"email": TEST_EMAIL, "password": TEST_PASSWORD})
    success = res.status_code == 200 and "access_token" in res.json()
    record("Connexion réussie avec bon mot de passe", success, f"status={res.status_code}")
    if success:
        # On garde le token le plus récent
        State.access_token = res.json()["access_token"]

    res_bad = api_post("/api/auth/login", {"email": TEST_EMAIL, "password": "mauvais_mot_de_passe"})
    record("Connexion refusée avec mauvais mot de passe (401)", res_bad.status_code == 401)

    res_unknown = api_post("/api/auth/login", {"email": "inconnu.xyz@example.com", "password": "peu importe"})
    record("Connexion refusée pour email inconnu (401)", res_unknown.status_code == 401)


def test_faqs():
    title("FAQ (/faqs, /faqs/list)")

    res = api_post("/api/faqs", {
        "faqs": "Q: Puis-je annuler ma commande ?\nR: Oui, sous 1h après validation.\n",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    record("Ajout de FAQ supplémentaire (201)", res.status_code == 201, f"status={res.status_code}")

    res_bad_format = api_post("/api/faqs", {
        "faqs": "ceci n'est pas au bon format du tout",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    record(
        "FAQ mal formatée refusée (406)",
        res_bad_format.status_code == 406,
        f"status={res_bad_format.status_code}"
    )

    res_list = api_post("/api/faqs/list", {
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": State.access_token
    })
    success = res_list.status_code == 200
    record("Liste des FAQ récupérée", success, f"status={res_list.status_code}")
    if success:
        faqs = res_list.json()
        State.faq_ids = [f["id"] for f in faqs]
        # 3 FAQ initiales + 1 ajoutée = 4 minimum
        record(
            f"Au moins 4 FAQ présentes (trouvé {len(faqs)})",
            len(faqs) >= 4
        )
        dim(f"Exemple: {faqs[0]['question'] if faqs else 'aucune'}")

    # Sans token -> refusé
    res_no_token = api_post("/api/faqs/list", {
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": ""
    })
    record(
        "Liste FAQ refusée sans token valide",
        res_no_token.status_code in (401, 406),
        f"status={res_no_token.status_code}"
    )


def test_client_me():
    title("PROFIL CLIENT (/client/me)")

    res = client.post("/api/client/me" if False else "/api/client/me", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": State.access_token
    })
    success = res.status_code == 200
    record("Profil client récupéré", success, f"status={res.status_code}")
    if success:
        data = res.json()
        record("Champ 'client' présent", "client" in data)
        record("Champ 'faqs' présent", "faqs" in data)
        record("password_hash absent de la réponse (sécurité)", "password_hash" not in data.get("client", {}))
        dim(f"entreprise = {data.get('client', {}).get('entreprise_name')}")


def test_webhook_verification():
    title("VÉRIFICATION WEBHOOK (GET /api/webhook)")

    if not VERIFY_TOKEN:
        info("KWIKO_WHATSAPP_VERIFY_TOKEN non défini dans l'environnement -- test sauté.")
        info("Exporte-le pour tester cette étape : export KWIKO_WHATSAPP_VERIFY_TOKEN=...")
        return

    challenge = str(random.randint(100000, 999999))
    res = api_get("/api/webhook", params={
        "hub.mode": "subscribe",
        "hub.challenge": challenge,
        "hub.verify_token": VERIFY_TOKEN,
    })
    success = res.status_code == 200 and res.text.strip().strip('"') == challenge
    record("Le challenge est bien renvoyé tel quel", success, f"status={res.status_code} body={res.text[:100]}")

    res_bad = api_get("/api/webhook", params={
        "hub.mode": "subscribe",
        "hub.challenge": challenge,
        "hub.verify_token": "mauvais-token-de-verif",
    })
    record(
        "Mauvais verify_token refusé",
        res_bad.status_code in (401, 403),
        f"status={res_bad.status_code}"
    )


def build_incoming_whatsapp_payload(text_body, wamid_suffix=""):
    """Construit un payload identique à celui que Meta enverrait réellement."""
    now_ts = str(int(time.time()))
    wamid = f"wamid.TEST_{RUN_ID}{wamid_suffix}"
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "TEST_WABA_ID",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "TEST",
                                "phone_number_id": TEST_PHONE_NUMBER_ID,
                            },
                            "contacts": [
                                {
                                    "profile": {"name": "Client Test Kwiko"},
                                    "wa_id": TEST_RECIPIENT_WA_ID,
                                }
                            ],
                            "messages": [
                                {
                                    "from": TEST_RECIPIENT_WA_ID,
                                    "id": wamid,
                                    "timestamp": now_ts,
                                    "type": "text",
                                    "text": {"body": text_body},
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }


def test_incoming_whatsapp_message():
    title("SIMULATION D'UN MESSAGE WHATSAPP ENTRANT (POST /api/webhook)")

    if REAL_MODE:
        info(f"MODE RÉEL actif -- la réponse sera vraiment envoyée à {TEST_RECIPIENT_WA_ID}")
    else:
        info("Mode régression (pas de vrai envoi WhatsApp) -- voir l'en-tête du script pour activer le mode réel")

    payload = build_incoming_whatsapp_payload(INCOMING_TEST_MESSAGE, wamid_suffix="_1")
    dim(f"Message simulé : \"{INCOMING_TEST_MESSAGE}\"")

    res = client.post("/api/webhook", json=payload)
    record("Webhook accepte le message entrant (200)", res.status_code == 200, f"status={res.status_code}")

    info("Attente de 3 secondes pour laisser le temps au RAG + LLM de traiter...")
    time.sleep(3)

    # On va vérifier via /contacts/list puis /contacts/get que tout a bien été enregistré
    res_contacts = client.post("/api/contacts/list", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": State.access_token, "contact_id": 0
    })
    success = res_contacts.status_code == 200
    record("Liste des contacts récupérée après message", success, f"status={res_contacts.status_code}")

    if success:
        contacts = res_contacts.json()
        matching = [c for c in contacts if c.get("whatsapp_num") == TEST_RECIPIENT_WA_ID]
        record(f"Le contact WhatsApp a bien été créé ({TEST_RECIPIENT_WA_ID})", len(matching) == 1)
        if matching:
            State.contact_id = matching[0]["id"]
            dim(f"contact_id={State.contact_id}  nom={matching[0].get('name')}")

    if State.contact_id:
        res_detail = client.post("/api/contacts/get", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD,
            "token": State.access_token, "contact_id": State.contact_id
        })
        success = res_detail.status_code == 200
        record("Détail du contact récupéré", success, f"status={res_detail.status_code}")
        if success:
            data = res_detail.json()
            messages = data.get("messages", [])
            entrants = [m for m in messages if m.get("direction") == "entrant"]
            sortants = [m for m in messages if m.get("direction") == "sortant"]
            record(f"Message entrant bien enregistré (trouvé {len(entrants)})", len(entrants) >= 1)
            record(f"Réponse IA (sortante) bien générée et enregistrée (trouvée {len(sortants)})", len(sortants) >= 1)

            if sortants:
                last_reply = sortants[-1]
                State.message_id = last_reply.get("id")
                print()
                info("💬 Réponse générée par l'IA :")
                print(f"     \"{last_reply.get('contenu')}\"")
                faqs_used = last_reply.get("faqs_used")
                if faqs_used:
                    try:
                        parsed = json.loads(faqs_used)
                        dim(f"FAQ(s) utilisée(s) : {[f.get('question') for f in parsed]}")
                    except Exception:
                        dim(f"faqs_used brut : {faqs_used}")
                else:
                    info("Aucune FAQ utilisée pour cette réponse (réponse de repli générique ?)")


def test_messages_get():
    title("DÉTAIL D'UN MESSAGE (/messages/get)")
    if not State.message_id:
        info("Pas de message_id disponible (étape précédente a peut-être échoué) -- test sauté.")
        return

    res = client.post("/api/messages/get", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD,
        "token": State.access_token, "message_id": State.message_id
    })
    success = res.status_code == 200
    record("Détail du message récupéré", success, f"status={res.status_code}")


def test_token_refresh():
    title("RAFRAÎCHISSEMENT DE TOKEN (/token/refresh)")

    old_token = State.access_token
    res = client.post("/api/token/refresh", json={"email": TEST_EMAIL, "token": old_token})
    success = res.status_code == 200 and "access_token" in res.json()
    record("Nouveau token émis", success, f"status={res.status_code}")

    if success:
        new_token = res.json()["access_token"]
        record("Le nouveau token est différent de l'ancien", new_token != old_token)
        State.access_token = new_token

        # Vérifie que le nouveau token fonctionne bien sur une route protégée
        res_check = client.post("/api/client/me", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": new_token
        })
        record("Le nouveau token fonctionne sur une route protégée", res_check.status_code == 200)

    # Refresh avec un email inexistant -> doit échouer proprement
    res_bad = client.post("/api/token/refresh", json={"email": "inconnu.xyz@example.com", "token": "peu importe"})
    record(
        "Refresh refusé pour un compte inexistant",
        res_bad.status_code in (401, 406),
        f"status={res_bad.status_code}"
    )

    # ⚠️ Test de sécurité important : un token invalide/aléatoire doit être refusé
    res_forged = client.post("/api/token/refresh", json={"email": TEST_EMAIL, "token": "un.token.invente_" + uuid.uuid4().hex})
    record(
        "🔒 SÉCURITÉ : refresh avec un token invalide/forgé refusé",
        res_forged.status_code in (401, 406),
        f"status={res_forged.status_code} -- SI CE TEST ÉCHOUE, VOIR LE FIX check_token=True DISCUTÉ AVANT"
    )


def test_rate_limit_status():
    title("STATUT RATE LIMITING (/rate-limit-status)")
    res = api_get("/api/rate-limit-status")
    record("Endpoint de statut accessible", res.status_code == 200, f"status={res.status_code}")
    if res.status_code == 200:
        dim(res.text[:200])


def print_summary():
    title("RÉSUMÉ")
    total = results["passed"] + results["failed"]
    print(f"  Total : {total}   {C.GREEN}Réussis : {results['passed']}{C.END}   {C.RED}Échoués : {results['failed']}{C.END}")
    if results["failures"]:
        print(f"\n  {C.RED}Détail des échecs :{C.END}")
        for name, detail in results["failures"]:
            print(f"    - {name}  ({detail})")
    print()


# ==============================================================================
# MODE INTERACTIF
# ==============================================================================

def interactive_mode():
    title("MODE INTERACTIF -- SIMULATEUR DE CLIENT WHATSAPP")
    print(
        "  Tape un message comme si tu étais un client qui écrit sur WhatsApp.\n"
        "  Le message part directement à ton backend (webhook simulé), l'IA\n"
        "  cherche dans les FAQ du compte de test et génère une vraie réponse.\n"
    )
    if REAL_MODE:
        info(f"MODE RÉEL : la réponse sera vraiment envoyée sur WhatsApp à {TEST_RECIPIENT_WA_ID}")
    else:
        info("Mode simulation : la réponse est générée pour de vrai mais pas envoyée sur WhatsApp (pas de vrai token)")

    print(f"\n  Compte de test actif : {TEST_EMAIL}")
    print("  Commandes : 'faqs' (voir les FAQ), 'contacts' (voir les contacts), 'quitter'\n")

    counter = 0
    while True:
        try:
            text = input(f"{C.BOLD}Client WhatsApp >{C.END} ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nFin du mode interactif.")
            break

        if not text:
            continue
        if text.lower() in ("quitter", "exit", "quit"):
            print("À bientôt !")
            break

        if text.lower() == "faqs":
            res = client.post("/api/faqs/list", json={
                "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": State.access_token
            })
            if res.status_code == 200:
                for f in res.json():
                    print(f"  [{f['id']}] Q: {f['question']}\n       R: {f['response']}")
            else:
                fail(f"Impossible de récupérer les FAQ (status={res.status_code})")
            continue

        if text.lower() == "contacts":
            res = client.post("/api/contacts/list", json={
                "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": State.access_token, "contact_id": 0
            })
            if res.status_code == 200:
                for c in res.json():
                    print(f"  [{c['id']}] {c.get('name')}  ({c.get('whatsapp_num')})")
            else:
                fail(f"Impossible de récupérer les contacts (status={res.status_code})")
            continue

        counter += 1
        payload = build_incoming_whatsapp_payload(text, wamid_suffix=f"_interactif_{counter}")
        res = client.post("/api/webhook", json=payload)
        if res.status_code != 200:
            fail(f"Le webhook a refusé le message (status={res.status_code})")
            continue

        print("  ⏳ L'IA réfléchit (recherche FAQ + génération LLM)...")
        time.sleep(3)

        if not State.contact_id:
            res_contacts = client.post("/api/contacts/list", json={
                "email": TEST_EMAIL, "password": TEST_PASSWORD, "token": State.access_token, "contact_id": 0
            })
            if res_contacts.status_code == 200:
                matches = [c for c in res_contacts.json() if c.get("whatsapp_num") == TEST_RECIPIENT_WA_ID]
                if matches:
                    State.contact_id = matches[0]["id"]

        if not State.contact_id:
            fail("Impossible de retrouver le contact de test.")
            continue

        res_detail = client.post("/api/contacts/get", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD,
            "token": State.access_token, "contact_id": State.contact_id
        })
        if res_detail.status_code != 200:
            fail(f"Impossible de récupérer la conversation (status={res_detail.status_code})")
            continue

        messages = res_detail.json().get("messages", [])
        sortants = [m for m in messages if m.get("direction") == "sortant"]
        if sortants:
            last = sortants[-1]
            print(f"\n  {C.GREEN}🤖 Kwiko >{C.END} {last.get('contenu')}")
            faqs_used = last.get("faqs_used")
            if faqs_used:
                try:
                    parsed = json.loads(faqs_used)
                    dim(f"(FAQ utilisée : {[f.get('question') for f in parsed]})")
                except Exception:
                    pass
            print()
        else:
            fail("Aucune réponse générée trouvée.")


# ==============================================================================
# POINT D'ENTRÉE
# ==============================================================================

def main():
    print(f"{C.BOLD}{C.BLUE}")
    print("=" * 70)
    print(" TEST KWIKO COMPLET".center(70))
    print("=" * 70)
    print(f"{C.END}")
    print(f"  API cible      : {API_BASE_URL}")
    print(f"  Compte de test : {TEST_EMAIL}")
    print(f"  Mode           : {'RÉEL (vrai WhatsApp)' if REAL_MODE else 'Régression (simulation)'}")
    if not REAL_MODE:
        dim("Pour tester un vrai envoi WhatsApp, voir les variables d'environnement")
        dim("KWIKO_TEST_PHONE_NUMBER_ID / KWIKO_TEST_WHATSAPP_TOKEN / KWIKO_TEST_RECIPIENT_WA_ID")
        dim("documentées en haut de ce script.")

    test_health()
    test_signup()
    test_login()
    test_faqs()
    test_client_me()
    test_webhook_verification()
    test_incoming_whatsapp_message()
    test_messages_get()
    test_token_refresh()
    test_rate_limit_status()

    print_summary()

    if not SKIP_INTERACTIVE:
        interactive_mode()


if __name__ == "__main__":
    main()