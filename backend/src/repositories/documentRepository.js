const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const documents = new Map();
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(__dirname, '../../storage');
const configuredLimitMb = Number(process.env.MAX_FILE_SIZE_MB || 10);
const maxFileSize = (Number.isFinite(configuredLimitMb) && configuredLimitMb > 0
  ? configuredLimitMb
  : 10) * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({ storage, limits: { fileSize: maxFileSize } });

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id) || null;
}

function findByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function getFilePath(document) {
  return path.join(storageDirectory, document.storedName);
}

module.exports = { upload, save, findById, findByOwner, getFilePath };