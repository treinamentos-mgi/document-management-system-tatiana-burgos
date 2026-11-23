const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function buildDocumentMetadata(file, owner) {
  return {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };
}

function toPublicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

function findDocumentForOwner(id, owner) {
  const document = documentRepository.findById(id);
  return document?.owner === owner ? document : null;
}

function createDocument(file, owner) {
  const metadata = buildDocumentMetadata(file, owner);
  const document = documentRepository.save(metadata);
  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

function getDocumentForOwner(id, owner) {
  const document = findDocumentForOwner(id, owner);
  if (!document) {
    return null;
  }

  return {
    ...toPublicDocument(document),
    filePath: documentRepository.getFilePath(document),
  };
}

function createUploadMiddleware() {
  return documentRepository.upload.single('file');
}

module.exports = { createDocument, listDocuments, getDocumentForOwner, createUploadMiddleware };