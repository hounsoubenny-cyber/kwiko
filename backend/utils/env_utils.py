#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jun 28 07:36:28 2026

@author: hounsousamuel
"""

import os
import sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", ".."))))
from dotenv import load_dotenv, find_dotenv
load_dotenv(verbose=True)

def getenv_required(key, help_text=None, exit_: bool = True):
    """Variable obligatoire avec message d'aide"""
    value = os.getenv(key)
    
    if not value:
        print(f"\n{'='*50}")
        print(f"❌ VARIABLE OBLIGATOIRE MANQUANTE: {key}")
        print(f"{'='*50}")
        
        if help_text:
            print(f"\n💡 {help_text}")
        
        print("\n📝 Solutions:")
        print("   1. Créez/modifiez le fichier .env:")
        print("      {key}=ta_valeur_ici")
        print("   2. Ou définissez la variable d'environnement:")
        print(f"      export {key}=ta_valeur_ici")
        print("      python main_ids_ips.py")
        print(f"\n{'='*50}\n")
        
        if exit_:
            sys.exit(1)
        
        raise RuntimeError(f"Env var {key} is needed but is missing")    
    
    return value

def validate_password(password):
    """Valide la complexité du mot de passe"""
    if len(password) < 8:
        raise ValueError("Mot de paxsse trop court (min 8 caractères)")
    if not any(c.isupper() for c in password):
        raise ValueError("Doit contenir une majuscule")
    if not any(c.isdigit() for c in password):
        raise ValueError("Doit contenir un chiffre")
    return True