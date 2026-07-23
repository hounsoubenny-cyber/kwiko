#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Jul 21 23:13:33 2026

@author: hounsousamuel
"""

import httpx

GRAPH_API_VERSION = "v25.0"

async def send_message(phone_number_id: str, token: str, to: str, texte: str) -> dict:
    """
    Envoie un message texte via l'API WhatsApp Cloud (Meta).

    - phone_number_id : identifiant du numéro WhatsApp DE LA PME (celui qui envoie),
                         récupéré depuis client.whatsapp_phone_number_id
    - token            : le token d'accès de CETTE PME (client.whatsapp_token)
    - to               : le numéro du CLIENT FINAL qui reçoit (le wa_id du webhook)
    - texte            : le contenu du message
    """
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": texte},
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, json=payload, headers=headers)

        # Meta renvoie un JSON d'erreur détaillé même en cas d'échec (ex: token expiré,
        # numéro invalide) -> on le laisse remonter tel quel plutôt que de l'avaler,
        # utile pour débugger en dev.
        if response.status_code >= 400:
            print(f"Échec envoi WhatsApp ({response.status_code}): {response.text}")
            print(response.json())
            raise RuntimeError(f"Échec envoi WhatsApp ({response.status_code}): {response.text}")

        return response.json()