import { FAQItem, MessageItem, ContactItem } from '../types';

/** Helper to normalize text for accent-insensitive and case-insensitive comparison */
export function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Helper to escape string for CSV */
export function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

/** Helper to trigger browser download of a blob */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Export FAQs in Q:/R: TXT format */
export function exportFaqsAsTxt(faqs: FAQItem[], filename = 'faqs_kwiko.txt') {
  const text = faqs
    .map(f => `Q: ${f.question}\nR: ${f.response}`)
    .join('\n\n');
  downloadFile(filename, text, 'text/plain;charset=utf-8');
}

/** Export FAQs as CSV */
export function exportFaqsAsCsv(faqs: FAQItem[], filename = 'faqs_kwiko.csv') {
  const headers = ['question', 'réponse', 'date de création'];
  const rows = faqs.map(f => [
    escapeCsvField(f.question),
    escapeCsvField(f.response),
    escapeCsvField(new Date(f.created_at).toLocaleString('fr-FR'))
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8');
}

/** Helper to parse faqs_used from message */
export function parseFaqsUsed(faqsUsedJson: string | null): string {
  if (!faqsUsedJson) return '';
  try {
    const parsed = JSON.parse(faqsUsedJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((f: any) => f.question || f.q || 'FAQ').join(' | ');
    }
  } catch {
    // fallback
  }
  return '';
}

/** Export conversation or list of messages as CSV */
export function exportMessagesAsCsv(
  messages: MessageItem[],
  contactsMap?: Record<number, ContactItem>,
  filename = 'messages_kwiko.csv'
) {
  const hasContactInfo = !!contactsMap;
  const headers = hasContactInfo
    ? ['date', 'contact', 'numéro whatsapp', 'direction', 'contenu', 'FAQ utilisée']
    : ['date', 'direction', 'contenu', 'FAQ utilisée'];

  const rows = messages.map(m => {
    const dateStr = new Date(m.created_at).toLocaleString('fr-FR');
    const directionStr = m.direction === 'entrant' ? 'entrant' : 'sortant';
    const faqsUsedStr = parseFaqsUsed(m.faqs_used);

    if (hasContactInfo && contactsMap) {
      const contact = contactsMap[m.contact_id];
      const contactName = contact?.name || 'Inconnu';
      const contactNum = contact?.whatsapp_num || '';
      return [
        escapeCsvField(dateStr),
        escapeCsvField(contactName),
        escapeCsvField(contactNum),
        escapeCsvField(directionStr),
        escapeCsvField(m.contenu),
        escapeCsvField(faqsUsedStr)
      ];
    } else {
      return [
        escapeCsvField(dateStr),
        escapeCsvField(directionStr),
        escapeCsvField(m.contenu),
        escapeCsvField(faqsUsedStr)
      ];
    }
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8');
}
