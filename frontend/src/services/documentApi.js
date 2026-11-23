async function request(path, userId, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...options.headers, 'X-User-Id': userId },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }

  return response;
}

export async function listDocuments(userId) {
  const response = await request('/documents', userId);
  return response.json();
}

export async function uploadDocument(userId, file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', userId, { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(userId, documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`, userId);
  return response.blob();
}