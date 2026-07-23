import { INITIAL_DEMO_DATA, DemoDataset } from './demoData';
import {
  ClientMeResponse,
  ContactGetResponse,
  ContactItem,
  FAQItem,
  MessageGetResponse
} from '../types';

// In-memory demo state instance clone so changes persist during the session
let demoState: DemoDataset = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));

export function resetDemoState() {
  demoState = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function demoLoginApi() {
  await delay(250);
  return {
    access_token: 'kwiko_demo_token_123',
    token_type: 'bearer'
  };
}

export async function demoSignupApi(data: {
  entreprise_name: string;
  email: string;
  whatsapp_phone_number_id: string;
  whatsapp_token: string;
  faqs?: string | null;
}) {
  await delay(300);
  if (data.entreprise_name) {
    demoState.client.entreprise_name = data.entreprise_name;
  }
  if (data.email) {
    demoState.client.email = data.email;
  }
  if (data.whatsapp_phone_number_id) {
    demoState.client.whatsapp_phone_number_id = data.whatsapp_phone_number_id;
  }
  if (data.faqs) {
    demoAddFaqsApi(data.faqs);
  }

  return {
    id: demoState.client.id,
    entreprise_name: demoState.client.entreprise_name,
    email: demoState.client.email,
    access_token: 'kwiko_demo_token_123',
    token_type: 'bearer'
  };
}

export async function demoGetClientMeApi(): Promise<ClientMeResponse> {
  await delay(200);

  const allMessages = Object.values(demoState.messagesByContact).flat();

  return {
    client: {
      id: demoState.client.id,
      entreprise_name: demoState.client.entreprise_name,
      email: demoState.client.email,
      whatsapp_phone_number_id: demoState.client.whatsapp_phone_number_id,
      whatsapp_token: demoState.client.whatsapp_token,
      created_at: demoState.client.created_at
    },
    faqs: [...demoState.faqs],
    contact: [...demoState.contacts],
    messages: allMessages
  };
}

export async function demoAddFaqsApi(faqsText: string) {
  await delay(350);
  if (!faqsText.trim()) {
    return { client_id: demoState.client.id, success: true };
  }

  // Parse Q: and R: pairs or line pairs
  const blocks = faqsText.split(/\n\s*\n/);
  const newFaqs: FAQItem[] = [];

  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+)/i);
    const rMatch = block.match(/R:\s*(.+)/i);

    if (qMatch && rMatch) {
      newFaqs.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        client_id: demoState.client.id,
        question: qMatch[1].trim(),
        response: rMatch[1].trim(),
        created_at: new Date().toISOString()
      });
    } else {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        newFaqs.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          client_id: demoState.client.id,
          question: lines[0].replace(/^[Q1-9\.\-\s]+:/i, '').trim(),
          response: lines[1].replace(/^[R1-9\.\-\s]+:/i, '').trim(),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  if (newFaqs.length === 0) {
    // Fallback: create 1 FAQ entry from raw text
    newFaqs.push({
      id: Date.now(),
      client_id: demoState.client.id,
      question: "Question importée",
      response: faqsText.trim(),
      created_at: new Date().toISOString()
    });
  }

  demoState.faqs = [...newFaqs, ...demoState.faqs];

  return {
    client_id: demoState.client.id,
    success: true
  };
}

export async function demoGetFaqsListApi(): Promise<FAQItem[]> {
  await delay(150);
  return [...demoState.faqs];
}

export async function demoGetContactsListApi(): Promise<ContactItem[]> {
  await delay(150);
  return [...demoState.contacts];
}

export async function demoGetContactDetailsApi(contact_id: number): Promise<ContactGetResponse> {
  await delay(200);

  const contact = demoState.contacts.find((c) => c.id === contact_id) || demoState.contacts[0];
  const messages = demoState.messagesByContact[contact_id] || demoState.messagesByContact[1] || [];

  return {
    contact: { ...contact },
    messages: [...messages],
    client: { ...demoState.client }
  };
}

export async function demoGetMessageDetailsApi(message_id: number): Promise<MessageGetResponse> {
  await delay(150);

  let foundMsg = null;
  let foundContact = demoState.contacts[0];

  for (const [cId, msgs] of Object.entries(demoState.messagesByContact)) {
    const msg = msgs.find((m) => m.id === message_id);
    if (msg) {
      foundMsg = msg;
      foundContact = demoState.contacts.find((c) => c.id === Number(cId)) || foundContact;
      break;
    }
  }

  if (!foundMsg) {
    foundMsg = demoState.messagesByContact[1][0];
  }

  return {
    message: { ...foundMsg },
    contact: { ...foundContact },
    client: { ...demoState.client }
  };
}
