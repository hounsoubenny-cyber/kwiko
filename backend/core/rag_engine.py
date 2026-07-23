#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jul 19 19:45:32 2026

@author: hounsousamuel
"""

import os
import sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", "..", ".."))))
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from kwiko.backend.config import EMBEDDING_MODEL, DMODEL

class RAGEngine:
    def __init__(
        self,
        model_path: str = EMBEDDING_MODEL,
    ):
        if not model_path or not os.path.exists(model_path):
            raise RuntimeError("This path doesn't exists")
        
        self.model_path = model_path
        self.model = SentenceTransformer(model_name_or_path=model_path)
    
    @staticmethod
    def load_index(path: str):
        return faiss.read_index(path)
    
    def encode(self, texts: list[str] | str):
        texts = texts if isinstance(texts, list) else [texts]
        return self.model.encode(texts).astype(np.float32)
    
    def create_index(
        self,
        texts: list[str],
        index: list[int],
        save_path: str,
        dmodel: int = DMODEL,
    ):
        index_faiss = faiss.IndexIDMap(faiss.IndexFlatL2(dmodel))
        index_faiss.add_with_ids(self.encode(texts), np.array(index, dtype=np.int64))
        if save_path:
            faiss.write_index(index_faiss, save_path)
        return index_faiss
    
    def add_to_index(
        self,
        texts: list[str],
        index: list[int],
        index_faiss,
        save_path: str,
        dmodel: int = DMODEL,
    ):
        index_faiss.add_with_ids(self.encode(texts), np.array(index, dtype=np.int64))
        if save_path:
            faiss.write_index(index_faiss, save_path)
        return index_faiss
    
    def search(
        self,
        index: faiss.Index,
        query: str,
        k: int = 3,
    ):
        query_embed = self.encode(query)
        distances, doc_ids = index.search(query_embed, k=k)
        return distances[0], doc_ids[0]

def create_default_index(index_path:str, embedding_dim: int = DMODEL, force: bool = False):
    if not os.path.exists(index_path):
        os.makedirs(os.path.dirname(os.path.abspath(index_path)), exist_ok=True)
        empty_index = faiss.IndexIDMap(faiss.IndexFlatL2(embedding_dim))
        faiss.write_index(empty_index, index_path)
    
    else:
        if force:
            os.makedirs(os.path.dirname(os.path.abspath(index_path)), exist_ok=True)
            empty_index = faiss.IndexIDMap(faiss.IndexFlatL2(embedding_dim))
            faiss.write_index(empty_index, index_path)
    
if __name__ == "__main__":
    engine = RAGEngine()
    texts = ["Doc 1", "Doc 2", "Doc 3", "Hello Sam", "Comment ça va ?"]
    indexs = list(range(len(texts)))
    index_path = "./test_path"
    index = engine.create_index(texts, index=indexs, save_path=index_path) # 768
    querys = ["Hello", "doc", "3", "ça va", "?"]
    for q in querys:
        print("-" * 20)
        print()
        print("=" * 10)
        print("Query:", q)
        print("=" * 10)
        distances, ids = engine.search(index, query=q)
        for i, _id in enumerate(ids):
            response = texts[_id]
            print(f"Query: {q} --->  Réponse: {response} (distance {distances[i]})")
        
        # print("*" * 20)
    os.unlink(index_path)
    