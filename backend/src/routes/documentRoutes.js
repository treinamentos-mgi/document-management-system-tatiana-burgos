const express = require('express');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post(
  '/upload',
  documentController.requireUser,
  documentController.uploadFile,
  documentController.upload,
  documentController.handleUploadError,
);
router.get('/documents', documentController.requireUser, documentController.list);
router.get('/documents/:id/download', documentController.requireUser, documentController.download);

module.exports = router;