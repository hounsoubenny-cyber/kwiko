import { ClientMeResponse, ContactItem, FAQItem, MessageItem } from '../types';

export interface DemoDataset {
  client: {
    id: number;
    entreprise_name: string;
    email: string;
    whatsapp_phone_number_id: string;
    whatsapp_token: string;
    created_at: string;
  };
  faqs: FAQItem[];
  contacts: ContactItem[];
  messagesByContact: Record<number, MessageItem[]>;
}

export const INITIAL_DEMO_DATA: DemoDataset = {
  client: {
    id: 9999,
    entreprise_name: "Boutique Démo Kwiko SARL",
    email: "demo@kwiko.app",
    whatsapp_phone_number_id: "109876543210985",
    whatsapp_token: "EAAG_kwiko_demo_permanent_token_xyz_999",
    created_at: "2026-01-15T10:00:00Z"
  },
  faqs: [
    {
      id: 101,
      client_id: 9999,
      question: "Quels sont vos horaires d'ouverture ?",
      response: "Nous sommes ouverts du lundi au samedi de 8h00 à 19h00 sans interruption. Nous sommes fermés le dimanche.",
      created_at: "2026-01-15T10:30:00Z"
    },
    {
      id: 102,
      client_id: 9999,
      question: "Où êtes-vous situés ?",
      response: "Notre magasin principal est situé au centre-ville, Avenue Steinmetz, près de la Place de l'Étoile Rouge, Cotonou.",
      created_at: "2026-01-15T10:35:00Z"
    },
    {
      id: 103,
      client_id: 9999,
      question: "Proposez-vous la livraison à domicile ?",
      response: "Oui ! Nous livrons dans toute la ville sous 2 à 4 heures. La livraison est gratuite à partir de 25 000 FCFA d'achat.",
      created_at: "2026-01-15T10:40:00Z"
    },
    {
      id: 104,
      client_id: 9999,
      question: "Quels sont les frais de livraison ?",
      response: "Les frais de livraison sont de 1 000 FCFA en centre-ville, 1 500 FCFA en périphérie et gratuits pour toute commande supérieure à 25 000 FCFA.",
      created_at: "2026-01-15T10:45:00Z"
    },
    {
      id: 105,
      client_id: 9999,
      question: "Quels sont les moyens de paiement acceptés ?",
      response: "Nous acceptons le paiement en espèces à la livraison, MTN Mobile Money, Moov Money et les cartes bancaires Visa/Mastercard.",
      created_at: "2026-01-15T10:50:00Z"
    },
    {
      id: 106,
      client_id: 9999,
      question: "Quelle est votre politique de retour et d'échange ?",
      response: "Vous pouvez échanger tout article non utilisé dans un délai de 7 jours suivant l'achat, muni de votre ticket de caisse.",
      created_at: "2026-01-15T11:00:00Z"
    },
    {
      id: 107,
      client_id: 9999,
      question: "Comment passer commande sur WhatsApp ?",
      response: "Envoyez-nous simplement les articles souhaités avec votre nom, votre adresse exacte de livraison et votre numéro de téléphone.",
      created_at: "2026-01-15T11:05:00Z"
    },
    {
      id: 108,
      client_id: 9999,
      question: "Avez-vous des remises pour les achats en gros ?",
      response: "Oui, nous offrons 10% de réduction pour toute commande de plus de 10 articles identiques. Contactez notre service commercial pour un devis.",
      created_at: "2026-01-15T11:10:00Z"
    },
    {
      id: 109,
      client_id: 9999,
      question: "Puis-je réserver un produit à l'avance ?",
      response: "Absolument. Vous pouvez réserver un produit pendant 24 heures sans frais. Au-delà, un acompte de 20% sera nécessaire.",
      created_at: "2026-01-15T11:15:00Z"
    },
    {
      id: 110,
      client_id: 9999,
      question: "Faites-vous des emballages cadeaux ?",
      response: "Oui, l'emballage cadeau est disponible gratuitement sur demande lors de la confirmation de votre commande.",
      created_at: "2026-01-15T11:20:00Z"
    },
    {
      id: 111,
      client_id: 9999,
      question: "Comment suivre l'état de ma livraison ?",
      response: "Dès le départ de notre livreur, vous recevez un message WhatsApp avec le numéro de téléphone direct du livreur chargé de votre colis.",
      created_at: "2026-01-15T11:25:00Z"
    },
    {
      id: 112,
      client_id: 9999,
      question: "Vos produits sont-ils sous garantie ?",
      response: "Tous nos appareils électroniques bénéficient d'une garantie constructeur de 12 mois à compter de la date d'achat.",
      created_at: "2026-01-15T11:30:00Z"
    },
    {
      id: 113,
      client_id: 9999,
      question: "Que faire si je reçois un produit défectueux ?",
      response: "Contactez-nous immédiatement via WhatsApp avec une photo de l'article. Nous procéderons à un remplacement gratuit sous 24h.",
      created_at: "2026-01-15T11:35:00Z"
    },
    {
      id: 114,
      client_id: 9999,
      question: "Avez-vous un catalogue au format PDF ?",
      response: "Notre catalogue à jour est consultable directement sur notre profil WhatsApp Business ou sur demande en format PDF par message.",
      created_at: "2026-01-15T11:40:00Z"
    },
    {
      id: 115,
      client_id: 9999,
      question: "Proposez-vous un service après-vente ?",
      response: "Oui, notre équipe technique est disponible du lundi au vendredi de 9h à 17h pour le diagnostic et l'assistance après-vente.",
      created_at: "2026-01-15T11:45:00Z"
    }
  ],
  contacts: [
    {
      id: 1,
      client_id: 9999,
      whatsapp_num: "+229 97 12 34 56",
      name: "Mme. Fatou Diallo",
      created_at: "2026-07-21T09:15:00Z"
    },
    {
      id: 2,
      client_id: 9999,
      whatsapp_num: "+229 95 88 77 66",
      name: "M. Jean Koffi",
      created_at: "2026-07-21T10:00:00Z"
    },
    {
      id: 3,
      client_id: 9999,
      whatsapp_num: "+229 61 22 33 44",
      name: "Mme. Amine Bamba",
      created_at: "2026-07-20T16:30:00Z"
    },
    {
      id: 4,
      client_id: 9999,
      whatsapp_num: "+229 96 44 55 66",
      name: "M. Ibrahim Traoré",
      created_at: "2026-07-20T11:10:00Z"
    },
    {
      id: 5,
      client_id: 9999,
      whatsapp_num: "+229 90 11 22 33",
      name: "Restaurant Le Palmier",
      created_at: "2026-07-19T14:00:00Z"
    },
    {
      id: 6,
      client_id: 9999,
      whatsapp_num: "+229 67 99 88 77",
      name: "Pharmacie du Centre",
      created_at: "2026-07-18T08:20:00Z"
    }
  ],
  messagesByContact: {
    1: [
      {
        id: 1001,
        contact_id: 1,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTcxMjM0NTYVAgASGBQzQUFCQ0RFRUYxMDIwMzA0MDU2Nw==",
        direction: "entrant",
        contenu: "Bonjour, êtes-vous ouverts aujourd'hui ?",
        created_at: "2026-07-21T14:20:00Z",
        faqs_used: null
      },
      {
        id: 1002,
        contact_id: 1,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTcxMjM0NTYVAgASGBQzQUFCQ0RFRUYxMDIwMzA0MDU2OA==",
        direction: "sortant",
        contenu: "Bonjour ! Nous sommes ouverts du lundi au samedi de 8h00 à 19h00 sans interruption. Nous sommes fermés le dimanche.",
        created_at: "2026-07-21T14:20:03Z",
        faqs_used: JSON.stringify([
          { question: "Quels sont vos horaires d'ouverture ?", response: "Nous sommes ouverts du lundi au samedi de 8h00 à 19h00 sans interruption. Nous sommes fermés le dimanche." }
        ])
      },
      {
        id: 1003,
        contact_id: 1,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTcxMjM0NTYVAgASGBQzQUFCQ0RFRUYxMDIwMzA0MDU2OQ==",
        direction: "entrant",
        contenu: "Super, merci ! Est-ce que vous livrez vers Ganhi ?",
        created_at: "2026-07-21T14:21:50Z",
        faqs_used: null
      },
      {
        id: 1004,
        contact_id: 1,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTcxMjM0NTYVAgASGBQzQUFCQ0RFRUYxMDIwMzA0MDU3MA==",
        direction: "sortant",
        contenu: "Oui ! Nous livrons dans toute la ville sous 2 à 4 heures. La livraison est gratuite à partir de 25 000 FCFA d'achat (ou 1 000 FCFA en centre-ville).",
        created_at: "2026-07-21T14:22:00Z",
        faqs_used: JSON.stringify([
          { question: "Proposez-vous la livraison à domicile ?", response: "Oui ! Nous livrons dans toute la ville sous 2 à 4 heures. La livraison est gratuite à partir de 25 000 FCFA d'achat." },
          { question: "Quels sont les frais de livraison ?", response: "Les frais de livraison sont de 1 000 FCFA en centre-ville, 1 500 FCFA en périphérie et gratuits pour toute commande supérieure à 25 000 FCFA." }
        ])
      }
    ],
    2: [
      {
        id: 2001,
        contact_id: 2,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTU4ODc3NjYVAgASGBQzQUFCQ0RFRUYyMDIwMzA0MDU3MQ==",
        direction: "entrant",
        contenu: "Bonjour, acceptez-vous MTN Mobile Money pour le paiement ?",
        created_at: "2026-07-21T15:00:00Z",
        faqs_used: null
      },
      {
        id: 2002,
        contact_id: 2,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTU4ODc3NjYVAgASGBQzQUFCQ0RFRUYyMDIwMzA0MDU3Mg==",
        direction: "sortant",
        contenu: "Bonjour M. Koffi ! Nous acceptons le paiement en espèces à la livraison, MTN Mobile Money, Moov Money et les cartes bancaires Visa/Mastercard.",
        created_at: "2026-07-21T15:00:04Z",
        faqs_used: JSON.stringify([
          { question: "Quels sont les moyens de paiement acceptés ?", response: "Nous acceptons le paiement en espèces à la livraison, MTN Mobile Money, Moov Money et les cartes bancaires Visa/Mastercard." }
        ])
      },
      {
        id: 2003,
        contact_id: 2,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTU4ODc3NjYVAgASGBQzQUFCQ0RFRUYyMDIwMzA0MDU3Mw==",
        direction: "entrant",
        contenu: "Parfait, je voudrais commander 3 paquets. Quel est le délai d'échange si besoin ?",
        created_at: "2026-07-21T15:04:30Z",
        faqs_used: null
      },
      {
        id: 2004,
        contact_id: 2,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTU4ODc3NjYVAgASGBQzQUFCQ0RFRUYyMDIwMzA0MDU3NA==",
        direction: "sortant",
        contenu: "Vous pouvez échanger tout article non utilisé dans un délai de 7 jours suivant l'achat, muni de votre ticket de caisse.",
        created_at: "2026-07-21T15:05:00Z",
        faqs_used: JSON.stringify([
          { question: "Quelle est votre politique de retour et d'échange ?", response: "Vous pouvez échanger tout article non utilisé dans un délai de 7 jours suivant l'achat, muni de votre ticket de caisse." }
        ])
      }
    ],
    3: [
      {
        id: 3001,
        contact_id: 3,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5NjEyMjMzNDQVAgASGBQzQUFCQ0RFRUYzMDIwMzA0MDU3NQ==",
        direction: "entrant",
        contenu: "Bonjour Kwiko, où se trouve exactement votre boutique ?",
        created_at: "2026-07-21T12:39:20Z",
        faqs_used: null
      },
      {
        id: 3002,
        contact_id: 3,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5NjEyMjMzNDQVAgASGBQzQUFCQ0RFRUYzMDIwMzA0MDU3Ng==",
        direction: "sortant",
        contenu: "Bonjour Mme. Bamba ! Notre magasin principal est situé au centre-ville, Avenue Steinmetz, près de la Place de l'Étoile Rouge, Cotonou.",
        created_at: "2026-07-21T12:39:24Z",
        faqs_used: JSON.stringify([
          { question: "Où êtes-vous situés ?", response: "Notre magasin principal est situé au centre-ville, Avenue Steinmetz, près de la Place de l'Étoile Rouge, Cotonou." }
        ])
      },
      {
        id: 3003,
        contact_id: 3,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5NjEyMjMzNDQVAgASGBQzQUFCQ0RFRUYzMDIwMzA0MDU3Nw==",
        direction: "entrant",
        contenu: "Avez-vous des garanties sur les appareils ?",
        created_at: "2026-07-21T12:40:00Z",
        faqs_used: null
      },
      {
        id: 3004,
        contact_id: 3,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5NjEyMjMzNDQVAgASGBQzQUFCQ0RFRUYzMDIwMzA0MDU3OA==",
        direction: "sortant",
        contenu: "Tous nos appareils électroniques bénéficient d'une garantie constructeur de 12 mois à compter de la date d'achat.",
        created_at: "2026-07-21T12:40:03Z",
        faqs_used: JSON.stringify([
          { question: "Vos produits sont-ils sous garantie ?", response: "Tous nos appareils électroniques bénéficient d'une garantie constructeur de 12 mois à compter de la date d'achat." }
        ])
      }
    ],
    4: [
      {
        id: 4001,
        contact_id: 4,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTY0NDU1NjZWAgASGBQzQUFCQ0RFRUY0MDIwMzA0MDU3OQ==",
        direction: "entrant",
        contenu: "Bonjour, avez-vous des remises si je prends 15 pièces ?",
        created_at: "2026-07-21T11:17:30Z",
        faqs_used: null
      },
      {
        id: 4002,
        contact_id: 4,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTY0NDU1NjZWAgASGBQzQUFCQ0RFRUY0MDIwMzA0MDU4MA==",
        direction: "sortant",
        contenu: "Bonjour M. Traoré ! Oui, nous offrons 10% de réduction pour toute commande de plus de 10 articles identiques. Contactez notre service commercial pour un devis personnalisé.",
        created_at: "2026-07-21T11:18:00Z",
        faqs_used: JSON.stringify([
          { question: "Avez-vous des remises pour les achats en gros ?", response: "Oui, nous offrons 10% de réduction pour toute commande de plus de 10 articles identiques. Contactez notre service commercial pour un devis." }
        ])
      }
    ],
    5: [
      {
        id: 5001,
        contact_id: 5,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTAxMDIyMzNWAgASGBQzQUFCQ0RFRUY1MDIwMzA0MDU4MQ==",
        direction: "entrant",
        contenu: "Bonsoir, puis-je réserver un produit pour demain matin ?",
        created_at: "2026-07-20T18:49:30Z",
        faqs_used: null
      },
      {
        id: 5002,
        contact_id: 5,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5OTAxMDIyMzNWAgASGBQzQUFCQ0RFRUY1MDIwMzA0MDU4Mg==",
        direction: "sortant",
        contenu: "Absolument. Vous pouvez réserver un produit pendant 24 heures sans frais. Au-delà, un acompte de 20% sera nécessaire.",
        created_at: "2026-07-20T18:50:00Z",
        faqs_used: JSON.stringify([
          { question: "Puis-je réserver un produit à l'avance ?", response: "Absolument. Vous pouvez réserver un produit pendant 24 heures sans frais. Au-delà, un acompte de 20% sera nécessaire." }
        ])
      }
    ],
    6: [
      {
        id: 6001,
        contact_id: 6,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5Njc5OTg4NzdVAgASGBQzQUFCQ0RFRUY2MDIwMzA0MDU4Mw==",
        direction: "entrant",
        contenu: "Bonjour, faites-vous des emballages cadeaux ?",
        created_at: "2026-07-19T09:29:30Z",
        faqs_used: null
      },
      {
        id: 6002,
        contact_id: 6,
        client_id: 9999,
        wamid: "wamid.HBgLMjI5Njc5OTg4NzdVAgASGBQzQUFCQ0RFRUY2MDIwMzA0MDU4NA==",
        direction: "sortant",
        contenu: "Bonjour ! Oui, l'emballage cadeau est disponible gratuitement sur demande lors de la confirmation de votre commande.",
        created_at: "2026-07-19T09:30:00Z",
        faqs_used: JSON.stringify([
          { question: "Faites-vous des emballages cadeaux ?", response: "Oui, l'emballage cadeau est disponible gratuitement sur demande lors de la confirmation de votre commande." }
        ])
      }
    ]
  }
};
