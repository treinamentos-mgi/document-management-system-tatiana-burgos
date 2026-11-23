const multer = require('multer');
const documentService = require('../services/documentService');

const uploadFile = documentService.createUploadMiddleware();

function requireUser(req, res, next) {
  const userId = req.get('X-User-Id');
  if (!userId || !userId.trim()) {
    return res.status(400).json({ error: 'O cabeçalho X-User-Id é obrigatório.' });
  }

  req.userId = userId.trim();
  return next();
}

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'O arquivo é obrigatório.' });
  }

  try {
    const document = documentService.createDocument(req.file, req.userId);
    return res.status(201).json(document);
  } catch (error) {
    return res.status(500).json({ error: 'Não foi possível salvar o documento.' });
  }
}

function handleUploadError(error, req, res, next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'O arquivo excede o limite permitido.' });
  }
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: 'O envio do arquivo é inválido.' });
  }

  return res.status(500).json({ error: 'Não foi possível gravar o arquivo.' });
}

function list(req, res) {
  return res.json(documentService.listDocuments(req.userId));
}

function download(req, res, next) {
  const document = documentService.getDocumentForOwner(req.params.id, req.userId);
  if (!document) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(document.filePath, document.originalName, {
    headers: { 'Content-Type': document.mimeType },
  }, (error) => {
    if (!error) {
      return;
    }
    if (res.headersSent) {
      return next(error);
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }
    return res.status(500).json({ error: 'Não foi possível ler o documento.' });
  });
}

module.exports = { requireUser, uploadFile, upload, handleUploadError, list, download };