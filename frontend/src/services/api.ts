import {
  AuthCredentials,
  AUTH_SESSION_KEY,
  ClientMeResponse,
  ContactGetResponse,
  ContactItem,
  FAQItem,
  MessageGetResponse,
  ApiErrorResponse
} from '../types';
import { buildAbsoluteApiUrl } from './config';
import {
  demoAddFaqsApi,
  demoGetClientMeApi,
  demoGetContactDetailsApi,
  demoGetContactsListApi,
  demoGetFaqsListApi,
  demoGetMessageDetailsApi,
  demoLoginApi,
  demoSignupApi
} from '../demo/demoApiClient';

let globalRateLimitHandler: ((retryAfterSeconds: number, message?: string) => void) | null = null;
let globalTokenUpdateHandler: ((newToken: string) => void) | null = null;
let globalLogoutHandler: (() => void) | null = null;

export function setRateLimitHandler(handler: (retryAfterSeconds: number, message?: string) => void) {
  globalRateLimitHandler = handler;
}

export function setTokenUpdateHandler(handler: (newToken: string) => void) {
  globalTokenUpdateHandler = handler;
}

export function setLogoutHandler(handler: () => void) {
  globalLogoutHandler = handler;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 429) {
    const errorData: ApiErrorResponse = await res.json().catch(() => ({}));
    const retryAfter = errorData.retry_after || 60;
    const msg = errorData.message || 'Trop de requêtes, réessayez dans quelques instants.';

    if (globalRateLimitHandler) {
      globalRateLimitHandler(retryAfter, msg);
    }

    throw new Error(`Trop de requêtes ! Réessayez dans ${retryAfter} secondes.`);
  }

  if (!res.ok) {
    const errorData: ApiErrorResponse = await res.json().catch(() => ({}));
    const message = errorData.detail?.message || errorData.message || `Erreur HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function refreshTokenApi(email: string, token: string) {
  const url = buildAbsoluteApiUrl('/api/token/refresh');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token })
  });

  return handleResponse<{
    id: number;
    entreprise_name: string;
    email: string;
    access_token: string;
    token_type: string;
  }>(res);
}

let isRefreshing = false;
let refreshTokenPromise: Promise<string> | null = null;

async function executeRefreshToken(email: string, currentToken: string): Promise<string> {
  try {
    const res = await refreshTokenApi(email, currentToken);
    const newToken = res.access_token;
    if (!newToken) {
      throw new Error("Nouveau jeton d'accès non fourni.");
    }

    // 1. Update sessionStorage immediately
    try {
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.token = newToken;
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.error("Erreur mise à jour sessionStorage post-refresh:", e);
    }

    // 2. Notify AuthContext if registered
    if (globalTokenUpdateHandler) {
      globalTokenUpdateHandler(newToken);
    }

    return newToken;
  } catch (err) {
    if (globalLogoutHandler) {
      globalLogoutHandler();
    }
    throw err;
  } finally {
    isRefreshing = false;
    refreshTokenPromise = null;
  }
}

function obtainFreshToken(email: string, currentToken: string): Promise<string> {
  if (!isRefreshing || !refreshTokenPromise) {
    isRefreshing = true;
    refreshTokenPromise = executeRefreshToken(email, currentToken);
  }
  return refreshTokenPromise;
}

async function protectedFetch<T>(
  endpoint: string,
  bodyObj: Record<string, any>,
  isRetry = false
): Promise<T> {
  const url = buildAbsoluteApiUrl(endpoint);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj)
  });

  if (res.status === 401) {
    if (isRetry || !bodyObj.email || !bodyObj.token) {
      if (globalLogoutHandler) {
        globalLogoutHandler();
      }
      const errorData: ApiErrorResponse = await res.json().catch(() => ({}));
      const message = errorData.detail?.message || errorData.message || 'Session expirée (401)';
      throw new Error(message);
    }

    try {
      const newToken = await obtainFreshToken(bodyObj.email, bodyObj.token);
      const updatedBody = { ...bodyObj, token: newToken };
      return protectedFetch<T>(endpoint, updatedBody, true);
    } catch (refreshErr) {
      throw refreshErr;
    }
  }

  return handleResponse<T>(res);
}

export async function signupApi(data: {
  entreprise_name: string;
  email: string;
  password: string;
  whatsapp_phone_number_id: string;
  whatsapp_token: string;
  faqs?: string | null;
  isDemo?: boolean;
}) {
  if (data.isDemo) {
    return demoSignupApi(data);
  }
  const url = buildAbsoluteApiUrl('/api/auth/signup');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  return handleResponse<{
    id: number;
    entreprise_name: string;
    email: string;
    access_token: string;
    token_type: string;
  }>(res);
}

export async function loginApi(data: { email: string; password: string; isDemo?: boolean }) {
  if (data.isDemo) {
    return demoLoginApi();
  }
  const url = buildAbsoluteApiUrl('/api/auth/login');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  return handleResponse<{
    access_token: string;
    token_type: string;
  }>(res);
}

export async function addFaqsApi(faqsText: string, creds: { email: string; password: string; isDemo?: boolean }) {
  if (creds.isDemo) {
    return demoAddFaqsApi(faqsText);
  }
  const url = buildAbsoluteApiUrl('/api/faqs');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      faqs: faqsText,
      email: creds.email,
      password: creds.password
    })
  });

  return handleResponse<{ client_id: number; success: boolean }>(res);
}

export async function getFaqsListApi(creds: AuthCredentials) {
  if (creds.isDemo) {
    return demoGetFaqsListApi();
  }
  return protectedFetch<FAQItem[]>('/api/faqs/list', {
    email: creds.email,
    password: creds.password,
    token: creds.token
  });
}

export async function getClientMeApi(creds: AuthCredentials) {
  if (creds.isDemo) {
    return demoGetClientMeApi();
  }
  return protectedFetch<ClientMeResponse>('/api/client/me', {
    email: creds.email,
    password: creds.password,
    token: creds.token
  });
}

export async function getContactDetailsApi(creds: AuthCredentials, contact_id: number) {
  if (creds.isDemo) {
    return demoGetContactDetailsApi(contact_id);
  }
  return protectedFetch<ContactGetResponse>('/api/contacts/get', {
    email: creds.email,
    password: creds.password,
    token: creds.token,
    contact_id
  });
}

export async function getContactsListApi(creds: AuthCredentials) {
  if (creds.isDemo) {
    return demoGetContactsListApi();
  }
  return protectedFetch<ContactItem[]>('/api/contacts/list', {
    email: creds.email,
    password: creds.password,
    token: creds.token,
    contact_id: 0
  });
}

export async function getMessageDetailsApi(creds: AuthCredentials, message_id: number) {
  if (creds.isDemo) {
    return demoGetMessageDetailsApi(message_id);
  }
  return protectedFetch<MessageGetResponse>('/api/messages/get', {
    email: creds.email,
    password: creds.password,
    token: creds.token,
    message_id
  });
}
