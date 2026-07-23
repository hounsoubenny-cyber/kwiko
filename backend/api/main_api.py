#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul 20 20:13:45 2026

@author: hounsousamuel
"""

import os
import sys
import uvicorn
import atexit
import aiohttp
import asyncio
import threading
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", "..", ".."))))

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded

from kwiko.backend.core.db_manager import DBManager
from kwiko.backend.core.rag_engine import RAGEngine
from kwiko.backend.core.llm_manager import LLMManager
from kwiko.backend.api.router import router, get_db, get_llm, get_rag
from kwiko.backend.config import DB_URL, EMBEDDING_MODEL
from kwiko.backend.utils.signal_manager import signal_manager
from kwiko.backend.utils.limiter import get_remote_address, limiter
from kwiko.backend.config import (
    LIMITE,
    REACT_EXISTS,
    ALLOWED_ORIGINS,
    BUILD_DIR,
    STATIC_DIR,
    INDEX_HTML,
    ASSETS_DIR
)


server = None

def get_loop():
    return "asyncio" if sys.platform == "win32" else "uvloop"

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.db_manager = get_db()
        app.state.rag_engine = get_rag()
        app.state.llm_manager = get_llm()
    
        print("✅ Kwiko backend démarré")
    
        def _on_shutdown_signal(sig, frame):
            print(f"\n🛑 Signal {sig} reçu, arrêt de Kwiko...")
    
        if threading.current_thread() is threading.main_thread():
            signal_manager(_on_shutdown_signal)
    
    except:
        os._exit(1)

    yield

    print("👋 Kwiko backend arrêté proprement")

app = FastAPI(title="Kwiko API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.state.limiter = limiter
if REACT_EXISTS:
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    app.mount("/build", StaticFiles(directory=BUILD_DIR), name="build")
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
    

def __close_api():
    global server
    server.should_exit = True
    
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Trop rapide !",
            "message": f"{LIMITE} requêtes max par minute",
            "retry_after": 60
        }
    )

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get('/api/close')
def _close_api():
    global server
    if server is None:
        print('Serveur non lancé !', server)
        return {
            "message ": "Serveur non lancé !"
            }
    else:
        __close_api()
        print('Serveur fermé.')
        return {
            "message ": 'Serveur fermé.'
            }

@app.get("/api/rate-limit-status")
@limiter.limit(f"{LIMITE}/minute")
async def rate_limit_status(request: Request):
    return {
        "ip": get_remote_address(request),
        "limit": f"{LIMITE}/minute"
    }

@app.get("/")
async def home():
    """Sert l'application React - point d'entrée"""
    if REACT_EXISTS:
        return FileResponse(INDEX_HTML)
    else:
        return {
        }
    
    
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """Capture toutes les routes pour React Router"""
    excluded_prefixes = ["api/", "docs", "redoc", "openapi.json"]
    print(full_path)
    if any(full_path.startswith(prefix) for prefix in excluded_prefixes):
        raise HTTPException(404, detail="Route non trouvée")
        
    if full_path.startswith("static/"):
        return FileResponse(os.path.join(STATIC_DIR, full_path))
    
    elif full_path.startswith("assets/"):
        return FileResponse(os.path.join(ASSETS_DIR, full_path))
    
    elif full_path.startswith("build/"):
        return FileResponse(os.path.join(BUILD_DIR, full_path))
    
    if REACT_EXISTS:
        return FileResponse(INDEX_HTML)
    
    else:
        raise HTTPException(status_code=404, detail="Route non trouvée")
        


def start(app, host: str = "0.0.0.0", port: int = 8000):
    """Démarre le serveur dans un thread séparé."""
    global server
    config = uvicorn.Config(app, host=host, port=port, loop=get_loop(), use_colors=True, workers=10)
    server = uvicorn.Server(config=config)
    th = threading.Thread(target=server.run, daemon=True)
    return th, server


def stop(th: threading.Thread, timeout: int = 5):
    """Arrête proprement le thread serveur."""
    print("Arrêt du serveur...")
    th.join(timeout)
    print("Serveur arrêté.")

async def close_api(url):
    """Ferme l'API (utilitaire)."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            print('Statut : ', response.status)


def close_api_atexit(url):
    """Enregistre la fermeture de l'API à la sortie."""
    def _close():
        try:
            loop = asyncio.new_event_loop()
            loop.run_until_complete(close_api(url))
            loop.close()
        except:
            pass
    atexit.register(_close)


if __name__ == "__main__":
    def _run():
        import uvicorn
        uvicorn.run("kwiko.backend.core.main_api:app", host="0.0.0.0", port=8000, reload=True)
    
    _run()