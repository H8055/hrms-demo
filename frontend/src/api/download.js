import { api } from './client';

// Documents are served through an authenticated route that returns either a
// signed URL (JSON, when on cloud storage) or the raw file bytes (local disk).
// This helper handles both and opens the result in a new tab.
export async function openDocument(documentId, { userId, self = false } = {}) {
  const path = self
    ? `/employees/me/documents/${documentId}/download`
    : `/employees/${userId}/documents/${documentId}/download`;

  const response = await api.get(path, { responseType: 'blob' });
  const blob = response.data;

  if (blob.type && blob.type.includes('application/json')) {
    const text = await blob.text();
    const { url } = JSON.parse(text);
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}
