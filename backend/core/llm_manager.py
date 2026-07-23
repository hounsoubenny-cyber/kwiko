#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jul 19 20:36:30 2026

@author: hounsousamuel
"""

import os
import sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", "..", ".."))))
import time
import itertools
from groq import Groq
from dotenv import load_dotenv
from kwiko.backend.config import MAX_RETRIES_PER_MODEL, RETRY_DELAY, MODEL_CASCADE

class IAUnavailableError(Exception):
    pass

def _load_keys() -> list:
    load_dotenv()
    keys = []
    i = 1
    while True:
        k = os.getenv(f"GROQ_API_KEY_{i}")
        if not k:
            break
        keys.append(k.strip())
        i += 1
    if not keys:
        raise ValueError("Aucune clé Groq trouvée dans .env (GROQ_API_KEY_1, GROQ_API_KEY_2...)")
    return keys

class LLMManager:
    def __init__(self):
        self._keys  = _load_keys()
        self._cycle = itertools.cycle(self._keys)
        self._client = self._make_client()
        print(f"✅ LLMManager — {len(self._keys)} clé(s), cascade: {MODEL_CASCADE[0]} → fallbacks")

    def _make_client(self) -> Groq:
        return Groq(api_key=next(self._cycle))

    def _rotate(self):
        self._client = self._make_client()

    def generate(self, system_prompt: str, prompt: str, max_tokens: int = 1024) -> str:
        """
        Génère une réponse avec cascade automatique clés → modèles.
        Lève IAUnavailableError si tout échoue.
        """
        for model in MODEL_CASCADE:
            self._client = self._make_client()

            for attempt in range(MAX_RETRIES_PER_MODEL * len(self._keys)):
                try:
                    response = self._client.chat.completions.create(
                        model=model,
                        max_tokens=max_tokens,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user",   "content": prompt},
                        ],
                        temperature=0.4,
                    )
                    return response.choices[0].message.content.strip()

                except Exception as e:
                    err = str(e).lower()
                    if any(x in err for x in ["rate", "limit", "429", "quota", "capacity"]):
                        print(f"⚠️  Rate limit [{model}] clé {(attempt % len(self._keys)) + 1} — rotation...")
                        self._rotate()
                        time.sleep(RETRY_DELAY)
                    elif "model" in err and ("not found" in err or "deprecated" in err):
                        print(f"⚠️  Modèle {model} indisponible, passage au suivant...")
                        break
                    else:
                        print(f"❌ Erreur Groq [{model}]: {e}")
                        raise

        raise IAUnavailableError("Toutes les clés et modèles Groq ont échoué. IA temporairement indisponible.")

def create_message(
    question: str,
    faqs: list[dict[str, str]],
) -> tuple[str, str]:
    """
    Construit le (system_prompt, prompt) à donner à LLMManager.generate().

    - question : la question posée par le client final sur WhatsApp
    - faqs     : les FAQ les plus proches trouvées par le RAG, chacune sous la forme
                 {"question": "...", "response": "..."} (ou "reponse" selon ton schéma)
    """
    system_prompt = (
        "Tu es l'assistant WhatsApp d'une entreprise. Réponds au client de façon "
        "naturelle, courte et polie, en te basant UNIQUEMENT sur les informations "
        "fournies ci-dessous. Si aucune information ne permet de répondre à la "
        "question, dis simplement que tu n'as pas cette information et propose de "
        "contacter directement l'entreprise. N'invente jamais de détails absents "
        "du contexte fourni."
    )

    if faqs:
        contexte = "\n\n".join(
            f"Q: {f['question']}\nR: {f.get('response') or f.get('reponse', '')}"
            for f in faqs
        )
    else:
        contexte = "(Aucune information pertinente trouvée dans la base de connaissances.)"

    prompt = (
        f"Informations disponibles :\n{contexte}\n\n"
        f"Question du client : {question}\n\n"
        f"Réponse :"
    )

    return system_prompt, prompt