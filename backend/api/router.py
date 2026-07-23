#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul 20 20:13:44 2026

@author: hounsousamuel
"""

import os
import sys
import faiss
import asyncio
from typing import List, Optional

from fastapi import APIRouter, Depends, status, HTTPException, Request, Query
from pydantic import BaseModel

sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", "..", ".."))))
from kwiko.backend.core.rag_engine import RAGEngine, create_default_index
from kwiko.backend.core.llm_manager import LLMManager, create_message, IAUnavailableError
from kwiko.backend.core.db_manager import DBManager, Direction, Contact, Client, Message, FAQ
from kwiko.backend.utils.jwt_utils import create_token, verify_token
from kwiko.backend.utils.cryto_utils import checkpw, hashpw
from kwiko.backend.utils.limiter import limiter
from kwiko.backend.api.whatsapp_client import send_message
from kwiko.backend.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_EXP_MINUTES,
    JWT_NOT_BEFORE_SECONDS,
    INDEX_DIR,
    DB_URL, EMBEDDING_MODEL,
    DMODEL, LIMITE,
    WHATSAPP_VERIFY_TOKEN
)

router = APIRouter()
DB_MANAGER = None
LLM_MANAGER = None
RAG_ENGINE = None

# =============================================================================
# MODELS
# =============================================================================

class SignupRequest(BaseModel):
    entreprise_name: str
    email: str
    password: str
    whatsapp_phone_number_id: str
    whatsapp_token: str
    faqs: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

class FAQCreateRequest(BaseModel):
    faqs: str
    email: str
    password: str

class GlobalData(BaseModel):
    email: str
    password: str
    token: str | None = None

class GetContactData(GlobalData):
    contact_id: int

class GetClientData(GlobalData):
    ...

class GetMessageData(GlobalData):
    message_id: int
    
class RefreshTokenData(BaseModel):
    email: str
    token: str 
    
# =============================================================================
# Utilitaires et logique métier
# =============================================================================

def get_db() -> DBManager:
    global DB_MANAGER
    if DB_MANAGER is None:
        DB_MANAGER = DBManager(DB_URL)
    return DB_MANAGER

def get_rag() -> RAGEngine:
    global RAG_ENGINE
    if RAG_ENGINE is None:
        RAG_ENGINE = RAGEngine(EMBEDDING_MODEL)
    return RAG_ENGINE

def get_llm() -> LLMManager:
    global LLM_MANAGER
    if LLM_MANAGER is None:
        LLM_MANAGER = LLMManager()
    return LLM_MANAGER

def _create_index_path(email, entreprise_name):
    return os.path.join(INDEX_DIR, f"{entreprise_name}_{email}.faiss")

def split_and_validate_faq(faqs_str: str) -> list[dict]:
    if faqs_str is None:
        return []
    
    faqs_str = str(faqs_str).strip()
    if not faqs_str:
        return []
    
    faqs_raw = faqs_str.split("\n\n")
    if any(not line.strip().startswith(("Q:", "R:")) for line in faqs_raw):
        raise ValueError("Faq invalide !")
        
    faqs = []
    for faq_raw in faqs_raw:
        faq = faq_raw.split("\n")
        question_lines = list(filter(lambda line: line.strip().startswith("Q:"), faq))
        response_lines = list(filter(lambda line: line.strip().startswith("R:"), faq))
 
        if not question_lines or not response_lines:
            raise ValueError("Faq invalide ! Chaque bloc doit contenir une ligne Q: et une ligne R:")
 
        question = question_lines[0].strip().removeprefix("Q:").strip()
        response = response_lines[0].strip().removeprefix("R:").strip()
        faqs.append({"question": question, "response": response})
 
    return faqs


async def get_client(
    data, 
    db_manager, 
    token:str | None = None, 
    check_token: bool = False,
    checkpassword: bool = True,
    verify_exp: bool = False
) -> Client:
    client = await db_manager.get_client_by_email(data.email.strip())
    if not client:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail={"message": "Client inexistant"}
        )
    
    if checkpassword:
        if not checkpw(data.password, client.password_hash.encode()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Email ou mot de passe incorrect"}
            )
    
    if check_token:
        if not token:
            raise HTTPException(
                detail={"message": "token is required"},
                status_code=status.HTTP_406_NOT_ACCEPTABLE
            )
        client_id = verify_token(token, key=JWT_SECRET_KEY, algorithm=JWT_ALGORITHM, verify_exp=verify_exp)
        if int(client_id) != int(client.id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Token non appartenant au propriétaire légitime"}
            )
    return client

async def create_client(
    data: SignupRequest,
    db_manager: DBManager,
    rag_manager: RAGEngine,
):
    if await db_manager.check_mail_exists(data.email):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail={"message": "Email existant"}
        )
        
    existing = await db_manager.get_client_by_whatsapp_phone_number_id(
        data.whatsapp_phone_number_id.strip()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail={"message": "Ce numéro WhatsApp Business est déjà associé à un autre compte Kwiko"}
        )
    index_path = _create_index_path(
        email=data.email,
        entreprise_name=data.entreprise_name
    )
    client = await db_manager.create_client(
        index_path=index_path,
        entreprise_name=data.entreprise_name,
        email=data.email.strip(),
        embedding_dim=DMODEL,
        whatsapp_phone_number_id=data.whatsapp_phone_number_id,
        whatsapp_token=data.whatsapp_token,
        password_hash=hashpw(password=data.password).decode(),
    )
    faqs_str = data.faqs
    index_faiss = None
    if faqs_str:
        try:
            faqs = split_and_validate_faq(faqs_str=faqs_str)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail={"message": "Format FAQ invalide", "error": str(e)}
            )
        questions = [faq["question"] for faq in faqs]
        responses = [faq["response"] for faq in faqs]
        faqs_db = await db_manager.create_faqs(
            questions=questions, 
            responses=responses, 
            client_id=client.id,
        )
        ids = [int(faq.id) for faq in faqs_db]
        kwargs = dict(
            texts=questions,
            index=ids,
            dmodel=DMODEL,
            save_path=index_path
        )
        index_faiss = await asyncio.to_thread(rag_manager.create_index, **kwargs)
        client = await db_manager.get_obj_by_id(
            id=client.id,
            name="client",
        )
    
    return {"client": client, "index_faiss": index_faiss}

async def _manage_message(entries: list, db_manager, llm_manager, rag_engine) -> None:
    """Parcourt entry[].changes[].value et ne traite que les vrais messages entrants."""
    for entry in entries:
        for change in entry.get("changes", []):
            value = change.get("value", {})

            # value peut contenir "statuses" (accusés sent/delivered/read) au lieu de
            # "messages" -> on ignore silencieusement, ce n'est pas une erreur.
            messages = value.get("messages")
            if not messages:
                continue

            phone_number_id = value.get("metadata", {}).get("phone_number_id")
            if not phone_number_id:
                print("[webhook] metadata.phone_number_id absent, entrée ignorée")
                continue

            try:
                client = await db_manager.get_client_by_whatsapp_phone_number_id(phone_number_id)
            except Exception as e:
                print(f"[webhook] Erreur lookup client (phone_number_id={phone_number_id}): {e}")
                continue

            if not client:
                print(f"[webhook] Aucun client Kwiko pour phone_number_id={phone_number_id}")
                continue

            contacts_info = value.get("contacts") or [{}]
            wa_id = contacts_info[0].get("wa_id")
            name = contacts_info[0].get("profile", {}).get("name")

            if not wa_id:
                print(f"[webhook] wa_id absent pour client {client.id}, message ignoré")
                continue

            for msg in messages:
                try:
                    await _handle_single_message(msg, client, wa_id, name, db_manager, llm_manager, rag_engine)
                except Exception as e:
                    print(f"[webhook] Erreur traitement message (client={client.id}): {e}")


async def _handle_single_message(msg: dict, client, wa_id: str, name: str | None, db_manager, llm_manager, rag_engine) -> None:
    if msg.get("type") != "text":
        # MVP : on ne gère que le texte. Un jour, brancher image/audio ici.
        return

    wamid = msg.get("id")
    texte = (msg.get("text", {}).get("body") or "").strip()

    if not wamid or not texte:
        return

    # Anti-doublon : Meta peut renvoyer le même webhook plusieurs fois (retry réseau).
    existing = await db_manager.get_message_by_wamid(wamid)
    if existing:
        print(f"[webhook] Message {wamid} déjà traité, on ignore (retry Meta)")
        return

    contact = await _get_or_create_contact(db_manager, client.id, wa_id, name)

    await db_manager.create_message(
        contact_id=contact.id,
        client_id=client.id,
        direction=Direction.ENTRANT,
        contenu=texte,
        wamid=wamid,
    )

    faqs_trouvees = await _search_faqs(db_manager, rag_engine, client, texte)
    reponse = await _generate_reponse(llm_manager, texte, faqs_trouvees)

    await db_manager.create_message(
        contact_id=contact.id,
        client_id=client.id,
        direction=Direction.SORTANT,
        contenu=reponse,
        faqs_used=faqs_trouvees or None,
    )

    try:
        await send_message(client.whatsapp_phone_number_id, client.whatsapp_token, wa_id, reponse)
    except Exception as e:
        # Le message sortant est déjà enregistré en DB même si l'envoi WhatsApp échoue
        # (ex: token expiré) -> pas de perte de trace, juste un échec de livraison à corriger.
        print(f"[webhook] Échec envoi WhatsApp (client={client.id}): {e}")

async def _get_or_create_contact(db_manager, client_id: int, whatsapp_num: str, name: str | None):
    contact = await db_manager.get_contact_by_whatsapp_num(client_id, whatsapp_num)
    if contact:
        return contact
    return await db_manager.create_contact(client_id=client_id, name=name, whatsapp_num=whatsapp_num)

async def _search_faqs(db_manager, rag_engine, client, texte: str) -> list[dict]:
    """Recherche les FAQ pertinentes ; en cas d'échec (index corrompu, etc.), on continue
    sans contexte plutôt que de faire planter toute la réponse au client."""
    try:
        index = rag_engine.load_index(client.index_path)
        distances, ids = await asyncio.to_thread(rag_engine.search, index, texte, 3)

        faq_ids = [int(i) for i in ids if int(i) != -1]  # -1 = "pas assez de vecteurs dans l'index"
        if not faq_ids:
            return []

        faqs_objs = await db_manager.get_obj_by_id(faq_ids, "faq")
        return [
            {"id": f.id, "question": f.question, "response": f.response}
            for f in faqs_objs if f is not None
        ]
    except Exception as e:
        print(f"[webhook] Erreur recherche RAG (client={client.id}): {e}")
        return []


async def _generate_reponse(llm_manager, texte: str, faqs_trouvees: list[dict]) -> str:
    system_prompt, prompt = create_message(texte, faqs_trouvees)
    try:
        return await asyncio.to_thread(llm_manager.generate, system_prompt, prompt)
    except IAUnavailableError:
        return (
            "Désolé, je ne peux pas répondre à votre question pour le moment. "
            "Un membre de notre équipe reviendra vers vous rapidement."
        )

# =============================================================================
# ROUTES
# =============================================================================

# =============================================================================
# AUTH
# =============================================================================

@limiter.limit(f"{LIMITE}/minute")
@router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    request: Request,
    data: SignupRequest,
    db_manager: DBManager = Depends(get_db), 
    rag_manager: RAGEngine = Depends(get_rag)
):
    result = await create_client(data=data, db_manager=db_manager, rag_manager=rag_manager)
    client = result["client"]
    token = create_token(
        data={"username": str(client.id)},
        key=JWT_SECRET_KEY,
        exp=JWT_EXP_MINUTES,
        not_before=JWT_NOT_BEFORE_SECONDS,
        algorithm=JWT_ALGORITHM,
    )
    return {
        "id": client.id, 
        "entreprise_name": client.entreprise_name, 
        "email": client.email,
        "access_token": token, 
        "token_type": "bearer"
    }

@limiter.limit(f"{LIMITE}/minute")
@router.post("/auth/login")
async def login(
    request: Request,
    data: LoginRequest,
):
    db_manager = get_db()
    client = await get_client(data, db_manager)

    token = create_token(
        data={"username": str(client.id)},
        key=JWT_SECRET_KEY,
        exp=JWT_EXP_MINUTES,
        not_before=JWT_NOT_BEFORE_SECONDS,
        algorithm=JWT_ALGORITHM,
    )
    return {"access_token": token, "token_type": "bearer"}

# =============================================================================
# FAQS
# =============================================================================

@limiter.limit(f"{LIMITE}/minute")
@router.post("/faqs", status_code=status.HTTP_201_CREATED)
async def create_faq(
    request: Request,
    data: FAQCreateRequest,
    db_manager: DBManager = Depends(get_db),
    rag_manager: RAGEngine = Depends(get_rag),
):
    client = await get_client(data, db_manager)
        
    try:
        faqs = split_and_validate_faq(faqs_str=data.faqs)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail={"message": "Format FAQ invalide", "error": str(e)}
        )
    
    questions = [faq["question"] for faq in faqs]
    responses = [faq["response"] for faq in faqs]
    faqs_db = await db_manager.create_faqs(
        questions=questions, 
        responses=responses, 
        client_id=client.id,
    )
    ids = [int(faq.id) for faq in faqs_db]
    index_path = client.index_path
    create_default_index(index_path, DMODEL, force=False)        
    index_faiss = faiss.read_index(index_path)
    kwargs = dict(
        texts=questions,
        index=ids,
        dmodel=DMODEL,
        index_faiss=index_faiss,
        save_path=index_path
    )
    await asyncio.to_thread(rag_manager.add_to_index, **kwargs)
    client = await db_manager.get_obj_by_id(
        id=client.id,
        name="client",
    )
    return {
        "client_id": client.id,
        "success": True
    }

@limiter.limit(f"{LIMITE}/minute")
@router.post("/faqs/list")
async def list_faqs(
    request: Request,
    data: GlobalData,
):
    db_manager = get_db()
    client = await get_client(
        data, 
        db_manager,
        token=data.token,
        check_token=True,
        checkpassword=True
    )
    return [f.model_dump(exclude="client") for f in client.faqs]

# =============================================================================
# CLIENT
# =============================================================================

@limiter.limit(f"{LIMITE}/minute")
@router.post("/client/me")
async def me(
    request: Request,
    data: GetClientData
):
    db_manager = get_db()
    client = await get_client(
        data, 
        db_manager,
        token=data.token,
        check_token=True,
        checkpassword=True
    )
    return {
            "client": client.model_dump(),
            "faqs": [f.model_dump() for f in client.faqs],
            "contact": [c.model_dump() for c in client.contacts],
            "messages": [m.model_dump() for m in client.messages]
        }

# =============================================================================
# CONTACT
# =============================================================================

@limiter.limit(f"{LIMITE}/minute")
@router.post("/contacts/get")
async def get_contact(
    request: Request,
    data: GetContactData,
):
    db_manager = get_db()
    client = await get_client(
        data, 
        db_manager,
        token=data.token,
        check_token=True,
        checkpassword=True
    )
    contact: Contact = await db_manager.get_obj_by_id(data.contact_id, "contact")
    if not contact or contact.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Contact introuvable"}
        )

    return {
        "contact": contact.model_dump(),
        "messages": [m.model_dump() for m in contact.messages],
        "client": contact.client.model_dump()
    }        

@limiter.limit(f"{LIMITE}/minute")
@router.post("/contacts/list")
async def list_contact(
    request: Request,
    data: GetContactData,
):
    db_manager = get_db()
    client = await get_client(
        data, 
        db_manager,
        token=data.token,
        check_token=True,
        checkpassword=True
    )
    return [c.model_dump() for c in client.contacts]

# =============================================================================
# MESSAGES
# =============================================================================

@limiter.limit(f"{LIMITE}/minute")
@router.post("/messages/get")
async def get_message(
    request: Request,
    data: GetMessageData,
):
    db_manager = get_db()
    client = await get_client(
        data, 
        db_manager,
        token=data.token,
        check_token=True,
        checkpassword=True
    )
    message: Message = await db_manager.get_obj_by_id(data.message_id, "message")
    if not message or message.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Contact introuvable"}
        )
    
    return {
        "message": message.model_dump(),
        "client": message.client.model_dump(),
        "contact": message.contact.model_dump()
    }

# =============================================================================
# WEBHOOK
# =============================================================================

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    """
    Meta appelle cet endpoint UNE SEULE FOIS, au moment où tu configures l'URL du
    webhook dans ton app Meta for Developers — pas à chaque message.
 
    Il envoie 3 query params (avec des points dans le nom, d'où l'usage de `alias`
    puisque `hub.mode` n'est pas un nom de variable Python valide) :
    - hub.mode         : toujours "subscribe" pour une vérification
    - hub.verify_token : le secret QUE TU AS CHOISI et configuré côté Meta
    - hub.challenge    : une valeur aléatoire que Meta attend de récupérer telle quelle
                         si la vérification réussit -> preuve que c'est bien ton serveur
    """
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge)
 
    raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/webhook")
async def manage_message(request: Request):
    try:
        data = await request.json()
    except Exception as e:
        print(f"[webhook] Payload JSON invalide: {e}")
        return {"status": "ignored"}

    rag_engine = request.app.state.rag_engine
    db_manager = request.app.state.db_manager
    llm_manager = request.app.state.llm_manager
    await _manage_message(data.get("entry", []), db_manager, llm_manager, rag_engine)
    return {"status": "received"}

# =============================================================================
# REFRESH TOKEN
# =============================================================================

@limiter.limit(f"{LIMITE}/minute")
@router.post("/token/refresh")
async def _refresh_token(
    request: Request,
    data: RefreshTokenData
):
    db_manager = get_db()
    client = await get_client(
        data, 
        db_manager,
        token=data.token,
        checkpassword=False,
        verify_exp=False,
        check_token=True,
    )
    token = create_token(
        data={"username": str(client.id)},
        key=JWT_SECRET_KEY,
        exp=JWT_EXP_MINUTES,
        not_before=JWT_NOT_BEFORE_SECONDS,
        algorithm=JWT_ALGORITHM,
    )
    return {
        "id": client.id, 
        "entreprise_name": client.entreprise_name, 
        "email": client.email,
        "access_token": token, 
        "token_type": "bearer"
    }

if __name__ == "__main__":
    faqs_str = '''Q: Quels sont vos horaires ?
R: Nous sommes ouverts de 8h à 18h.

Q: Livrez-vous à Cotonou ?
R: Oui, sous 24h.
'''

    result = split_and_validate_faq(faqs_str)
    for f in result:
        print(f)
    
    assert result[0]['question'] == 'Quels sont vos horaires ?'
    assert result[0]['response'] == 'Nous sommes ouverts de 8h à 18h.'
    assert result[1]['response'] == 'Oui, sous 24h.'
    
    # Cas d'erreur : bloc sans R:
    try:
        split_and_validate_faq('Q: Test sans réponse')
        print('❌ Aurait dû lever une erreur')
    except ValueError as e:
        print('✅ Erreur bien levée pour bloc incomplet:', e)
    
    print()
