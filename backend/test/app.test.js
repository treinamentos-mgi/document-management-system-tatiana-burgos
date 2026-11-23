const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_MB = '1';
const app = require('../src/app');

function request(server, { method = 'GET', route, headers = {}, body } = {}) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: address.port,
      method,
      path: route,
      headers: { ...headers, ...(body ? { 'Content-Length': body.length } : {}) },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function multipart(fileContents, filename = 'contrato.txt') {
  const boundary = 'dms-test-boundary';
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/plain\r\n\r\n`),
    fileContents,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

test('rotas de upload, listagem e download respeitam os contratos', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(storageDirectory, { recursive: true, force: true });
  });

  const emptyUpload = multipart(Buffer.from(''));
  const missingUser = await request(server, {
    method: 'POST', route: '/upload',
    headers: { 'Content-Type': emptyUpload.contentType }, body: emptyUpload.body,
  });
  assert.strictEqual(missingUser.status, 400);

  const noFile = Buffer.from('--dms-test-boundary--\r\n');
  const missingFile = await request(server, {
    method: 'POST', route: '/upload',
    headers: { 'X-User-Id': 'user-42', 'Content-Type': emptyUpload.contentType }, body: noFile,
  });
  assert.strictEqual(missingFile.status, 400);

  const content = Buffer.from('documento de teste');
  const upload = multipart(content);
  const created = await request(server, {
    method: 'POST', route: '/upload',
    headers: { 'X-User-Id': 'user-42', 'Content-Type': upload.contentType }, body: upload.body,
  });
  assert.strictEqual(created.status, 201);
  const document = JSON.parse(created.body.toString());
  assert.strictEqual(document.originalName, 'contrato.txt');
  assert.strictEqual(document.owner, 'user-42');
  assert.strictEqual(document.size, content.length);
  assert.ok(!Object.hasOwn(document, 'storedName'));

  const listed = await request(server, {
    route: '/documents', headers: { 'X-User-Id': 'user-42' },
  });
  assert.strictEqual(listed.status, 200);
  assert.deepStrictEqual(JSON.parse(listed.body.toString()), [document]);

  const otherUserList = await request(server, {
    route: '/documents', headers: { 'X-User-Id': 'user-99' },
  });
  assert.deepStrictEqual(JSON.parse(otherUserList.body.toString()), []);

  const deniedDownload = await request(server, {
    route: `/documents/${document.id}/download`, headers: { 'X-User-Id': 'user-99' },
  });
  assert.strictEqual(deniedDownload.status, 404);

  const downloaded = await request(server, {
    route: `/documents/${document.id}/download`, headers: { 'X-User-Id': 'user-42' },
  });
  assert.strictEqual(downloaded.status, 200);
  assert.strictEqual(downloaded.headers['content-type'], 'text/plain');
  assert.match(downloaded.headers['content-disposition'], /filename="contrato.txt"/);
  assert.deepStrictEqual(downloaded.body, content);

  const oversized = multipart(Buffer.alloc(1024 * 1024 + 1, 'a'));
  const tooLarge = await request(server, {
    method: 'POST', route: '/upload',
    headers: { 'X-User-Id': 'user-42', 'Content-Type': oversized.contentType }, body: oversized.body,
  });
  assert.strictEqual(tooLarge.status, 413);
});
