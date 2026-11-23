const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function publicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

function createDocument(file, owner) {
  const document = documentRepository.save({
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  });

  return publicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(publicDocument);
}

function getDocumentForOwner(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    return null;
  }

  return { ...publicDocument(document), filePath: documentRepository.getFilePath(document) };
}

function createUploadMiddleware() {
  return documentRepository.upload.single('file');
}

module.exports = { createDocument, listDocuments, getDocumentForOwner, createUploadMiddleware };