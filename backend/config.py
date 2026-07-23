#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jul 19 20:40:01 2026

@author: hounsousamuel
"""

import os, sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", ".."))))
from dotenv import load_dotenv
from kwiko.backend.utils.env_utils import getenv_required

load_dotenv()
BASEDIR = os.path.abspath(
    os.path.dirname(__file__)
)

# =============================================================================
# LLM CONFIG
# =============================================================================
MODEL_CASCADE = [
    os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
]

MAX_RETRIES_PER_MODEL = 3
RETRY_DELAY = 1.0
EMBEDDING_MODEL = os.path.abspath(
    os.path.join(
        BASEDIR,
        "model",
        "MODEL_BERT"
    )
)
if not os.path.exists(EMBEDDING_MODEL):
    raise RuntimeError("You should have an embedding model to start app")

try:
    from sentence_transformers import SentenceTransformer
    _tmp_model = SentenceTransformer(model_name_or_path=EMBEDDING_MODEL)
    DMODEL = _tmp_model.get_sentence_embedding_dimension()
    del _tmp_model
except Exception:
    raise RuntimeError("You embedding model is not acceptable")


# =============================================================================
# DB CONFIG
# =============================================================================
DB_URL = os.getenv("KWIKO_DB_URL", f"sqlite+aiosqlite:///{os.path.join(BASEDIR, 'data', 'kwiko.db')}")
INDEX_DIR = os.path.join(BASEDIR, "data", "faiss_indexes")
os.makedirs(INDEX_DIR, exist_ok=True)

# =============================================================================
# AUTH CONFIG
# =============================================================================

JWT_SECRET_KEY = getenv_required(
    key="KWIKO_JWT_SECRET",
    help_text="Clé secrète JWT (utilisez: openssl rand -hex 32)"
)
JWT_ALGORITHM = "HS256"
JWT_EXP_MINUTES = int(os.getenv("KWIKO_JWT_EXP_MINUTES", "60"))
JWT_NOT_BEFORE_SECONDS = 0
LIMITE = 20

# =============================================================================
# API CONFIG
# =============================================================================

BUILD_DIR = os.path.abspath(os.path.join(BASEDIR, "..", "frontend", "dist"))
STATIC_DIR = os.path.join(BUILD_DIR, "static")
ASSETS_DIR = os.path.join(BUILD_DIR, "assets")
os.makedirs(STATIC_DIR, exist_ok=True)
INDEX_HTML = os.path.join(BUILD_DIR, "index.html")
REACT_EXISTS = os.path.exists(INDEX_HTML)
IP = "0.0.0.0"
PORT = 8000
API_IP = "127.0.0.1"
ALLOWED_ORIGINS = [
    f"http://{API_IP}:{PORT}",
    f"http://localhost:{PORT}",
    f"http://127.0.0.1:{PORT}",
    f"http://{IP}:{PORT}",
]

WHATSAPP_VERIFY_TOKEN = os.getenv("KWIKO_WHATSAPP_VERIFY_TOKEN", "un-secret-que-tu-choisis")
