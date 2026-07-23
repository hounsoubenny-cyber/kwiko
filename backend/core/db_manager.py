#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jul 19 20:47:32 2026

@author: hounsousamuel
"""

import os
import sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", "..", ".."))))
import json
import faiss
import sqlalchemy as sa
from enum import StrEnum, Enum
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Union, get_origin, get_type_hints
from sqlmodel import SQLModel, Field, Relationship, Column, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from kwiko.backend.utils.loop_utils import _run_async
from kwiko.backend.core.rag_engine import RAGEngine, create_default_index

def utcnow():
    return datetime.now(tz=timezone.utc)

class Direction(StrEnum):
    ENTRANT = "entrant"
    SORTANT = "sortant"

RELATION_SHIP_DEFAULT_CONF = {
    "cascade": "all, delete-orphan",
    "lazy": "selectin",
}
RELATION_SHIP_CASCADE_ONLY = {
    "cascade": "all",
    "lazy": "selectin",
}


class Client(SQLModel, table=True):
    """Une PME utilisant Kwiko."""

    __tablename__ = "client"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    entreprise_name: str = Field(description="Nom de l'entreprise")
    email: str = Field(unique=True, index=True, description="Email de l'entreprise")
    password_hash: str = Field(description="Hash du mot de passe", exclude=True)
    whatsapp_phone_number_id: str = Field(index=True, description="Le whatsapp phone number id du client", unique=True)
    whatsapp_token: str = Field(description="Token whatsapp")
    index_path: str = Field(description="Chemin de stockage de l'index faq")
    created_at: datetime = Field(default_factory=utcnow)
    contacts: List["Contact"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={
            **RELATION_SHIP_DEFAULT_CONF,
            "order_by": "Contact.id",
        }
    )
    faqs: List["FAQ"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={
            **RELATION_SHIP_DEFAULT_CONF,
            "order_by": "FAQ.id",
        }
    )
    messages: List["Message"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={
            **RELATION_SHIP_CASCADE_ONLY,
            "order_by": "Message.id",
        }
    )


class Contact(SQLModel, table=True):
    """Un client final qui écrit sur WhatsApp à une PME donnée."""

    __tablename__ = "contact"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: int = Field(foreign_key="client.id", index=True)
    whatsapp_num: str = Field(index=True, description="Numéro whatsapp", unique=True)
    name: Optional[str] = Field(default=None, description="Nom whatsapp du client")
    created_at: datetime = Field(default_factory=utcnow, description="Date de création")
    client: Client = Relationship(
        back_populates="contacts",
        sa_relationship_kwargs={
            "lazy": "selectin",
        }
    )
    messages: List["Message"] = Relationship(
        back_populates="contact",
        sa_relationship_kwargs={
            **RELATION_SHIP_DEFAULT_CONF,
            "order_by": "Message.id",
        }
    )


class FAQ(SQLModel, table=True):
    """Une paire question/réponse définie par une PME, avec son embedding."""

    __tablename__ = "faq"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    client_id: int = Field(foreign_key="client.id", index=True)
    question: str = Field(description="Champ question de la faq")
    response: str = Field(description="Champ réponse de la faq")
    created_at: datetime = Field(default_factory=utcnow, description="Date de création")
    client: Client = Relationship(back_populates="faqs")


class Message(SQLModel, table=True):
    """Un message échangé (entrant ou sortant) dans une conversation."""

    __tablename__ = "message"
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    contact_id: int = Field(
        foreign_key="contact.id", index=True,
        description="Id du contact a qui on répond (clé étrangère)"
    )
    client_id: int = Field(
        foreign_key="client.id", index=True,
        description="Id du Client pour qui on répond (clé étrangère)"
    )
    direction: Direction = Field(description="Direction du message (entrant/sortant)")
    contenu: str = Field(description="Contenu du message")
    wamid: Optional[str] = Field(
        default=None,
        index=True,
        unique=True,
        description="id WhatsApp du message (wamid)"
    )
    faqs_used: Optional[str] = Field(
        default=None, sa_column=Column(sa.Text),
        description="Liste des faqs en dict json sérialisé"
    )
    created_at: datetime = Field(default_factory=utcnow, description="Date de création")
    contact: Contact = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={
            "lazy": "selectin",
        }
    )
    client: Client = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={
            "lazy": "selectin",
        }
    )

    def set_faqs(self, faqs: Optional[List[Dict[str, str]]]) -> None:
        self.faqs_used = json.dumps(faqs, default=str) if faqs else None

    def get_faqs(self) -> List[Dict[str, str]]:
        return json.loads(self.faqs_used) if self.faqs_used else []


DB_OBJS = Union[Client, Contact, Message, FAQ]

class DBObjEnum(Enum):
    client = Client
    contact = Contact
    message = Message
    faq = FAQ


class DBManager:
    def __init__(self, db_url: str):
        self.db_url = db_url
        db_path = db_url.removeprefix("sqlite+aiosqlite:///")
        if db_path and db_path != ":memory:":
            dirname = os.path.dirname(db_path)
            if dirname:
                os.makedirs(dirname, exist_ok=True)
        _run_async(self.init_db)

    async def init_db(self):
        self.engine = create_async_engine(self.db_url)
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

    @asynccontextmanager
    async def get_session(self):
        async with AsyncSession(self.engine, expire_on_commit=False) as session:
            yield session

    async def add_to_session(
        self,
        obj: DB_OBJS | List[DB_OBJS],
        session: AsyncSession,
        merge: bool = False,
        commit: bool = False,
    ):
        objs = obj if isinstance(obj, (list, tuple)) else [obj]

        for o in objs:
            if not isinstance(o, DB_OBJS):
                raise ValueError("Object type is not acceptable for this database")

        if merge:
            merged = []
            for o in objs:
                merged.append(await session.merge(o))
            objs = merged
        else:
            session.add_all(objs)

        if commit:
            await session.commit()
            for o in objs:
                await session.refresh(o)

        return objs if isinstance(obj, (list, tuple)) else objs[0]

    async def create_client(
        self,
        entreprise_name: str,
        email: str,
        password_hash: str,
        whatsapp_phone_number_id: str,
        whatsapp_token: str,
        index_path: str,
        embedding_dim: int,
    ):
        create_default_index(index_path, embedding_dim, force=False)
        client = Client(
            entreprise_name=entreprise_name,
            email=email,
            password_hash=password_hash,
            whatsapp_phone_number_id=whatsapp_phone_number_id,
            whatsapp_token=whatsapp_token,
            index_path=index_path,
        )
        async with self.get_session() as session:
            client = await self.add_to_session(client, session, commit=True)

        return client

    async def create_contact(
        self,
        client_id: int,
        name: str,
        whatsapp_num: str,
    ):
        contact = Contact(
            name=name,
            whatsapp_num=whatsapp_num,
            client_id=client_id,
        )
        async with self.get_session() as session:
            contact = await self.add_to_session(contact, session, commit=True)

        return contact

    async def create_faq(
        self,
        question: str,
        response: str,
        client_id: int,
    ):
        faq = FAQ(
            question=question,
            response=response,
            client_id=client_id,
        )
        async with self.get_session() as session:
            faq = await self.add_to_session(faq, session, commit=True)
        return faq
    
    async def create_faqs(
        self,
        questions: List[str],
        responses: List[str],
        client_id: int,
    ):
        faqs = [FAQ(
            question=q,
            response=r,
            client_id=client_id,
        ) for q, r in zip(questions, responses)]
        async with self.get_session() as session:
            faqs = await self.add_to_session(faqs, session, commit=True)
        return faqs

    async def create_message(
        self,
        contact_id: int,
        client_id: int,
        direction: Direction,
        contenu: str,
        wamid: str | None = None,
        faqs_used: Optional[List[Dict]] = None,
    ):
        message = Message(
            contact_id=contact_id,
            client_id=client_id,
            direction=direction,
            contenu=contenu,
            wamid=wamid,
        )
        message.set_faqs(faqs_used)
        async with self.get_session() as session:
            message = await self.add_to_session(message, session, commit=True)

        return message

    async def get_obj_by_id(
        self,
        id: int | List[int],
        name: str,
        session: AsyncSession | None = None,
    ) -> DB_OBJS | List[DB_OBJS] | None:
        obj_cls = DBObjEnum[name].value

        async def _fetch(sess: AsyncSession):
            if isinstance(id, list):
                return [await sess.get(obj_cls, _id) for _id in id]
            return await sess.get(obj_cls, id)

        if session is None:
            async with self.get_session() as session:
                return await _fetch(session)

        return await _fetch(session)

    async def update_client(self, id: int, attrs: Dict):
        if not attrs:
            return True

        async with self.get_session() as session:
            obj = await self.get_obj_by_id(id, "client", session)
            if not obj:
                return False
            
            annotations = get_type_hints(type(obj))
            for name, value in attrs.items():
                if name in annotations:
                    if isinstance(
                        value,
                        (get_origin(annotations[name]) or annotations[name])
                    ):
                        if name == "index_path" and not os.path.exists(str(value)):
                            raise ValueError("Trying to update client with inexistant index_path")
                        setattr(obj, name, value)

            session.add(obj)
            await session.commit()
            return True
    
    async def get_mails(self) -> List[str] | None:
        async with self.get_session() as sess:
            result = (await sess.execute(
                select(Client.email)
            )).scalars().all()
            return list(result) if result else []
    
    async def check_mail_exists(self, email: str) -> bool:
        return email in (await self.get_mails())
    
    async def get_client_by_email(self, email: str) -> None | Client:
        async with self.get_session() as sess:
            result = (await sess.execute(
                select(Client).where(Client.email == email.strip())
            )).scalars().all()
            result = list(result)[0] if result else None
            return result
    
    async def get_client_by_whatsapp_phone_number_id(self, whatsapp_phone_number_id: str) -> None | Client:
        async with self.get_session() as sess:
            result = (await sess.execute(
                select(Client).where(Client.whatsapp_phone_number_id == whatsapp_phone_number_id)
            )).scalars().all()
            result = list(result)[0] if result else None
            return result
    
    
    async def get_message_by_wamid(self, wamid: str) -> None | Message:
        async with self.get_session() as sess:
            result = (await sess.execute(
                select(Message).where(Message.wamid == wamid)
            )).scalars().all()
            result = list(result)[0] if result else None
            return result
    
    async def get_contact_by_whatsapp_num(self, client_id: int, whatsapp_num: str) -> None | Contact:
        async with self.get_session() as sess:
            result = (await sess.execute(
                select(Contact).where(
                    Contact.client_id == client_id,
                    Contact.whatsapp_num == whatsapp_num.strip(),
                )
            )).scalars().all()
            return list(result)[0] if result else None
    
async def test_db_manager_complete():
    """
    Fonction de test asynchrone complète qui teste toutes les fonctionnalités de DBManager
    avec des données réelles et des fichiers temporaires.
    """
    
    # === ÉTAPE 1: CRÉATION DE L'ENVIRONNEMENT DE TEST ===
    print("📁 Création de l'environnement de test...")
    import shutil, tempfile
    temp_dir = tempfile.mkdtemp(prefix="dbmanager_test_")
    db_path = os.path.join(temp_dir, "test_database.db")
    index_path = os.path.join(temp_dir, "test_index.faiss")
    db_url = f"sqlite+aiosqlite:///{db_path}"
    
    print(f"   - Répertoire temporaire: {temp_dir}")
    print(f"   - Base de données: {db_path}")
    print(f"   - Index FAISS: {index_path}")
    
    db_manager = None
    
    try:
        # === ÉTAPE 2: INITIALISATION DE DBManager ===
        print("\n🔧 Initialisation de DBManager...")
        db_manager = DBManager(db_url)
        print("   ✅ DBManager initialisé avec succès")
        
        # === ÉTAPE 3: CRÉATION D'UN CLIENT ===
        print("\n👤 Création d'un client...")
        
        client_data = {
            "entreprise_name": "Kwiko Test SARL",
            "email": "contact@kwikotest.com",
            "password_hash": "hashed_password_123456",
            "whatsapp_phone_number_id": "123456789012345",
            "whatsapp_token": "EAAKxZAZA...token_test",
            "index_path": index_path,
            "embedding_dim": 768
        }
        

        client = await db_manager.create_client(**client_data)
        
        print(f"   ✅ Client créé avec ID: {client.id}")
        print(f"      - Nom: {client.entreprise_name}")
        print(f"      - Email: {client.email}")
        print(f"      - Index path: {client.index_path}")
        print(f"      - Créé le: {client.created_at}")
        
        # === ÉTAPE 4: VÉRIFICATION DU CLIENT ===
        print("\n🔍 Vérification du client...")
        
        client_by_email = await db_manager.get_client_by_email(client.email)
        assert client_by_email is not None, "Le client devrait être trouvé par email"
        assert client_by_email.id == client.id, "L'ID du client devrait correspondre"
        print(f"   ✅ Client trouvé par email: {client_by_email.email}")
        
        email_exists = await db_manager.check_mail_exists(client.email)
        assert email_exists is True, "L'email devrait exister"
        print(f"   ✅ Vérification de l'email: {email_exists}")
        
        all_emails = await db_manager.get_mails()
        assert client.email in all_emails, "L'email devrait être dans la liste"
        print(f"   ✅ Liste des emails: {all_emails}")
        
        # === ÉTAPE 5: CRÉATION DE CONTACTS ===
        print("\n📱 Création de contacts...")
        
        contacts_data = [
            {"name": "Jean Dupont", "whatsapp_num": "+33123456789"},
            {"name": "Marie Martin", "whatsapp_num": "+33198765432"},
            {"name": "Pierre Durand", "whatsapp_num": "+33155555555"}
        ]
        
        created_contacts = []
        for contact_info in contacts_data:
            contact = await db_manager.create_contact(
                client_id=client.id,
                name=contact_info["name"],
                whatsapp_num=contact_info["whatsapp_num"]
            )
            created_contacts.append(contact)
            print(f"   ✅ Contact créé: {contact.name} (ID: {contact.id})")
        
        # === ÉTAPE 6: CRÉATION DE FAQS ===
        print("\n❓ Création de FAQs...")
        
        faqs_data = [
            {"question": "Qu'est-ce que Kwiko?", 
             "response": "Kwiko est une plateforme de gestion de relations clients via WhatsApp."},
            {"question": "Comment installer Kwiko?", 
             "response": "Pour installer Kwiko, contactez notre équipe commerciale au 01 23 45 67 89."},
            {"question": "Quels sont les tarifs?", 
             "response": "Nos tarifs commencent à 99€/mois pour la formule essentielle."},
            {"question": "Kwiko est-il sécurisé?", 
             "response": "Oui, Kwiko utilise le chiffrement de bout en bout pour toutes les communications."}
        ]
        
        created_faqs = []
        for faq_info in faqs_data:
            faq = await db_manager.create_faq(
                question=faq_info["question"],
                response=faq_info["response"],
                client_id=client.id,
            )
            created_faqs.append(faq)
            print(f"   ✅ FAQ créée: {faq.question[:30]}... (ID: {faq.id})")
        
        # === ÉTAPE 7: CRÉATION DE MULTIPLES FAQS EN UNE FOIS ===
        print("\n📚 Création de FAQs en lot...")
        
        batch_questions = ["Question batch 1", "Question batch 2", "Question batch 3"]
        batch_responses = ["Réponse batch 1", "Réponse batch 2", "Réponse batch 3"]
        
        batch_faqs = await db_manager.create_faqs(
            questions=batch_questions,
            responses=batch_responses,
            client_id=client.id
        )
        
        print(f"   ✅ {len(batch_faqs)} FAQs créées en lot")
        for i, faq in enumerate(batch_faqs):
            print(f"      - FAQ {i+1}: {faq.question} (ID: {faq.id})")
        
        # === ÉTAPE 8: CRÉATION DE MESSAGES ===
        print("\n💬 Création de messages...")
        
        for contact in created_contacts:
            msg_entrant = await db_manager.create_message(
                contact_id=contact.id,
                client_id=client.id,
                direction=Direction.ENTRANT,
                contenu=f"Bonjour, je suis {contact.name} et j'ai une question sur Kwiko.",
                wamid=f"wamid_{contact.id}_1",
                faqs_used=[{"question": "Qu'est-ce que Kwiko?", "response": "Kwiko est une plateforme..."}]
            )
            print(f"   ✅ Message entrant créé pour {contact.name} (ID: {msg_entrant.id})")
            
            msg_sortant = await db_manager.create_message(
                contact_id=contact.id,
                client_id=client.id,
                direction=Direction.SORTANT,
                contenu=f"Bonjour {contact.name}, merci pour votre message. Comment puis-je vous aider?",
                wamid=f"wamid_{contact.id}_2",
                faqs_used=None
            )
            print(f"   ✅ Message sortant créé pour {contact.name} (ID: {msg_sortant.id})")
        
        # === ÉTAPE 9: TEST DES MÉTHODES DE MESSAGE ===
        print("\n🧪 Test des méthodes Message...")
        
        test_message = await db_manager.create_message(
            contact_id=created_contacts[0].id,
            client_id=client.id,
            direction=Direction.ENTRANT,
            contenu="Test des méthodes set/get faqs",
            faqs_used=[
                {"question": "Test Q1", "response": "Test R1"},
                {"question": "Test Q2", "response": "Test R2"}
            ]
        )
        
        retrieved_faqs = test_message.get_faqs()
        assert len(retrieved_faqs) == 2, "Devrait avoir 2 FAQs"
        print(f"   ✅ get_faqs() retourne {len(retrieved_faqs)} éléments")
        
        new_faqs = [{"question": "Nouvelle Q", "response": "Nouvelle R"}]
        test_message.set_faqs(new_faqs)
        assert test_message.get_faqs() == new_faqs, "Les FAQs devraient être mises à jour"
        print(f"   ✅ set_faqs() fonctionne correctement")
        
        test_message.set_faqs(None)
        assert test_message.get_faqs() == [], "Devrait retourner une liste vide"
        print(f"   ✅ set_faqs(None) fonctionne correctement")
        
        # === ÉTAPE 10: RÉCUPÉRATION D'OBJETS PAR ID ===
        print("\n🔍 Test de récupération par ID...")
        
        retrieved_client = await db_manager.get_obj_by_id(client.id, "client")
        assert retrieved_client is not None, "Le client devrait être trouvé"
        assert retrieved_client.id == client.id, "L'ID devrait correspondre"
        print(f"   ✅ Client récupéré par ID: {retrieved_client.entreprise_name}")
        
        retrieved_contact = await db_manager.get_obj_by_id(created_contacts[0].id, "contact")
        assert retrieved_contact is not None, "Le contact devrait être trouvé"
        assert retrieved_contact.name == created_contacts[0].name, "Le nom devrait correspondre"
        print(f"   ✅ Contact récupéré par ID: {retrieved_contact.name}")
        
        retrieved_faq = await db_manager.get_obj_by_id(created_faqs[0].id, "faq")
        assert retrieved_faq is not None, "La FAQ devrait être trouvée"
        print(f"   ✅ FAQ récupérée par ID: {retrieved_faq.question[:30]}...")
        
        first_message = await db_manager.get_obj_by_id(1, "message")
        assert first_message is not None, "Le message devrait être trouvé"
        print(f"   ✅ Message récupéré par ID: {first_message.contenu[:30]}...")
        
        client_ids = [client.id]
        retrieved_clients = await db_manager.get_obj_by_id(client_ids, "client")
        assert len(retrieved_clients) == 1, "Devrait récupérer 1 client"
        print(f"   ✅ Récupération multiple: {len(retrieved_clients)} objet(s)")
        
        nonexistent = await db_manager.get_obj_by_id(99999, "client")
        assert nonexistent is None, "Devrait retourner None pour un ID inexistant"
        print(f"   ✅ ID inexistant retourne None")
        
        # === ÉTAPE 11: MISE À JOUR D'UN CLIENT ===
        print("\n✏️ Test de mise à jour...")
        
        update_data = {
            "entreprise_name": "Kwiko Test SARL - Updated",
            "email": "updated@kwikotest.com"
        }
        
        update_result = await db_manager.update_client(client.id, update_data)
        assert update_result is True, "La mise à jour devrait réussir"
        print(f"   ✅ Client mis à jour avec succès")
        
        updated_client = await db_manager.get_obj_by_id(client.id, "client")
        assert updated_client.entreprise_name == update_data["entreprise_name"], "Le nom devrait être mis à jour"
        assert updated_client.email == update_data["email"], "L'email devrait être mis à jour"
        print(f"   ✅ Vérification de la mise à jour: {updated_client.entreprise_name}")
        
        empty_update = await db_manager.update_client(client.id, {})
        assert empty_update is True, "La mise à jour vide devrait réussir"
        print(f"   ✅ Mise à jour avec attributs vides: OK")
        
        invalid_update = await db_manager.update_client(client.id, {"invalid_attr": "value"})
        assert invalid_update is True, "Les attributs invalides sont ignorés"
        print(f"   ✅ Attributs invalides ignorés")
        
        # === ÉTAPE 12: TEST DE LA RELATION ENTRE LES TABLES ===
        print("\n🔗 Test des relations...")
        
        full_client = await db_manager.get_obj_by_id(client.id, "client")
        
        assert len(full_client.contacts) >= 3, "Devrait avoir au moins 3 contacts"
        assert len(full_client.faqs) >= 7, "Devrait avoir au moins 7 FAQs (4 + 3)"
        assert len(full_client.messages) >= 6, "Devrait avoir au moins 6 messages (3 contacts × 2 messages)"
        
        print(f"   ✅ Relations du client:")
        print(f"      - Contacts: {len(full_client.contacts)}")
        print(f"      - FAQs: {len(full_client.faqs)}")
        print(f"      - Messages: {len(full_client.messages)}")
        
        contact_with_messages = await db_manager.get_obj_by_id(created_contacts[0].id, "contact")
        assert len(contact_with_messages.messages) >= 2, "Un contact devrait avoir au moins 2 messages"
        print(f"   ✅ Les messages du contact sont correctement liés")
        
        # === ÉTAPE 13: TEST DES EXCEPTIONS ===
        print("\n⚠️ Test des cas d'erreur...")
        
        try:
            async with db_manager.get_session() as session:
                await db_manager.add_to_session({"invalid": "object"}, session)
            print("   ❌ ERREUR: L'objet invalide n'a pas levé d'exception")
        except ValueError as e:
            print(f"   ✅ Exception levée comme prévu: {str(e)}")
        
        no_client_update = await db_manager.update_client(99999, {"email": "test@test.com"})
        assert no_client_update is False, "Devrait retourner False pour un client inexistant"
        print(f"   ✅ Mise à jour de client inexistant retourne False")
        
        no_email = await db_manager.get_client_by_email("nonexistent@test.com")
        assert no_email is None, "Devrait retourner None pour un email inexistant"
        print(f"   ✅ Email inexistant retourne None")
        
        # === ÉTAPE 14: TEST DE LA BASE DE DONNÉES EN MÉMOIRE ===
        print("\n💾 Test de la base de données en mémoire...")
        
        memory_db = DBManager("sqlite+aiosqlite:///:memory:")
        print(f"   ✅ Base de données en mémoire créée")
        
        # === ÉTAPE 15: VÉRIFICATION FINALE ===
        print("\n📊 Résumé des données créées:")
        print(f"   - 1 Client")
        print(f"   - {len(created_contacts)} Contacts")
        print(f"   - {len(created_faqs)} FAQs individuelles")
        print(f"   - {len(batch_faqs)} FAQs en lot")
        print(f"   - {len(created_contacts) * 2 + 1} Messages")
        print(f"   - {len(all_emails)} Emails dans la base")
        
        print("\n✅ TOUS LES TESTS ONT RÉUSSI!")
        
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
        
    finally:
        print("\n🧹 Nettoyage des fichiers temporaires...")
        
        if db_manager and hasattr(db_manager, 'engine'):
            try:
                await db_manager.engine.dispose()
            except:
                pass
        
        try:
            shutil.rmtree(temp_dir)
            print(f"   ✅ Répertoire temporaire supprimé: {temp_dir}")
        except Exception as e:
            print(f"   ⚠️ Impossible de supprimer le répertoire temporaire: {e}")
    
    return client, faq, contact, test_message
# Point d'entrée pour exécuter le test directement
if __name__ == "__main__":
    print("=" * 80)
    print("🧪 TEST COMPLET DE DBMANAGER")
    print("=" * 80)
    client, faq, contact, test_message = _run_async(test_db_manager_complete)
    print("=" * 80)
    print("🎉 Tous les tests ont été exécutés avec succès!")
    print("=" * 80)