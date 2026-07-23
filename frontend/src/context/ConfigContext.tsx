import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadAppConfig, getApiBaseUrl, AppConfig } from '../services/config';
import { Loader2 } from 'lucide-react';

interface ConfigContextType {
  config: AppConfig | null;
  apiBaseUrl: string;
  isReady: boolean;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  apiBaseUrl: 'http://localhost:8000',
  isReady: false
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadAppConfig().then(cfg => {
      if (isMounted) {
        setConfig(cfg);
        setIsReady(true);
      }
    });
    return () => { isMounted = false; };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-3 p-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-slate-950 font-black text-2xl flex items-center justify-center shadow-xl shadow-[#25D366]/20 font-display animate-pulse">
          K
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
          <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
          <span>Chargement de la configuration Kwiko...</span>
        </div>
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ config, apiBaseUrl: getApiBaseUrl(), isReady }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
