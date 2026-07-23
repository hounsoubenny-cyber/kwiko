export interface AppConfig {
  API_BASE_URL: string;
  // Valeur fixe, partagée par toute la plateforme Kwiko (pas propre à chaque PME) —
  // ne sert qu'une seule fois, à la vérification initiale du webhook côté Meta.
  // Voir GettingStartedView.tsx pour où elle est affichée au client.
  WHATSAPP_VERIFY_TOKEN: string;
}

const DEFAULT_CONFIG: AppConfig = {
  API_BASE_URL: 'http://localhost:8000',
  WHATSAPP_VERIFY_TOKEN: ''
};

let currentConfig: AppConfig = { ...DEFAULT_CONFIG };
let isConfigLoaded = false;

export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const saved = sessionStorage.getItem('kwiko_session_auth_data');
    if (saved && saved.includes('"isDemo":true')) {
      isConfigLoaded = true;
      return currentConfig;
    }

    const response = await fetch('/config.json', { cache: 'no-store' });
    if (!response.ok) {
      console.warn(
        `[Config] Impossible de charger /config.json (HTTP ${response.status}). Utilisation du serveur par défaut : ${DEFAULT_CONFIG.API_BASE_URL}`
      );
      currentConfig = { ...DEFAULT_CONFIG };
    } else {
      const json = await response.json();
      if (json && typeof json.API_BASE_URL === 'string') {
        const url = json.API_BASE_URL.trim();
        currentConfig = {
          API_BASE_URL: url || DEFAULT_CONFIG.API_BASE_URL,
          WHATSAPP_VERIFY_TOKEN:
          typeof json.WHATSAPP_VERIFY_TOKEN === 'string'
          ? json.WHATSAPP_VERIFY_TOKEN.trim()
          : DEFAULT_CONFIG.WHATSAPP_VERIFY_TOKEN
        };
      } else {
        console.warn(
          `[Config] Champ API_BASE_URL absent dans /config.json. Utilisation de la valeur de repli : ${DEFAULT_CONFIG.API_BASE_URL}`
        );
        currentConfig = { ...DEFAULT_CONFIG };
      }
    }
  } catch (err) {
    console.warn(
      `[Config] Erreur lors de la lecture de /config.json:`,
      err,
      `-> Repli vers : ${DEFAULT_CONFIG.API_BASE_URL}`
    );
    currentConfig = { ...DEFAULT_CONFIG };
  } finally {
    isConfigLoaded = true;
  }
  return currentConfig;
}

export function getApiBaseUrl(): string {
  return currentConfig.API_BASE_URL;
}

export function getWhatsappVerifyToken(): string {
  return currentConfig.WHATSAPP_VERIFY_TOKEN;
}

export function isAppConfigLoaded(): boolean {
  return isConfigLoaded;
}

export function buildAbsoluteApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  return `${cleanBase}${cleanEndpoint}`;
}
