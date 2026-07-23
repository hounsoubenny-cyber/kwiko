export const AUTH_SESSION_KEY = 'kwiko_session_auth_data';

export interface AuthCredentials {
  email: string;
  password: string;
  token: string;
  isDemo?: boolean;
}

export interface ClientData {
  id: number;
  entreprise_name: string;
  email: string;
  whatsapp_phone_number_id: string;
  whatsapp_token: string;
  index_path?: string;
  created_at: string;
}

export interface FAQItem {
  id: number;
  client_id: number;
  question: string;
  response: string;
  created_at: string;
}

export interface ContactItem {
  id: number;
  client_id: number;
  whatsapp_num: string;
  name: string | null;
  created_at: string;
}

export interface FaqUsed {
  id?: number;
  question: string;
  response: string;
}

export interface MessageItem {
  id: number;
  contact_id: number;
  client_id: number;
  direction: 'entrant' | 'sortant';
  contenu: string;
  wamid: string | null;
  faqs_used: string | null; // Raw JSON string from API
  created_at: string;
}

export interface ClientMeResponse {
  client: ClientData;
  faqs: FAQItem[];
  contact: ContactItem[];
  messages: MessageItem[];
}

export interface ContactGetResponse {
  contact: ContactItem;
  messages: MessageItem[];
  client: ClientData;
}

export interface MessageGetResponse {
  message: MessageItem;
  client: ClientData;
  contact: ContactItem | null;
}

export type ViewType = 'dashboard' | 'faqs' | 'contacts' | 'contact-detail' | 'about' | 'getting-started';

export interface ApiErrorDetail {
  message: string;
  error?: string;
}

export interface ApiErrorResponse {
  detail?: ApiErrorDetail;
  error?: string;
  message?: string;
  retry_after?: number;
}
