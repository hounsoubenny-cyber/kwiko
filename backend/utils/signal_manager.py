#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Mar 21 08:34:38 2026

@author: hounsousamuel
"""

import os, sys, signal, threading

def signal_manager(func, *args, **kwargs): 
    def function(sig, frame):
        func(sig, frame, *args, **kwargs)
        # os.kill(os.getpid(), 9)
        os._exit(0)
        # sys.exit(1)
    
    
    if threading.current_thread() is threading.main_thread():
        signal.signal(signal.SIGINT, function)
        signal.signal(signal.SIGTERM, function)
        if sys.platform != "win32":
            signal.signal(signal.SIGQUIT, function)
