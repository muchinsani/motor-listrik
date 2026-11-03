import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/model.mjs', ['model.mjs', 'text/javascript; charset=utf-8']],
  ['/motor.svg', ['motor.svg', 'image/svg+xml']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
]);

export function createAppServer() {
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    response.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Metode tidak diizinkan.');
      return;
    }
    let path;
    try {
      path = new URL(request.url, 'http://localhost').pathname;
    } catch {
      response.writeHead(400);
      response.end('Permintaan tidak valid.');
      return;
    }
    const entry = files.get(path);
    if (!entry) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Halaman tidak ditemukan.');
      return;
    }
    try {
      const body = await readFile(new URL(entry[0], import.meta.url));
      response.writeHead(200, { 'Content-Type': entry[1], 'Content-Length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Aset aplikasi tidak dapat dibaca.');
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 3100);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT harus berupa bilangan bulat antara 1 dan 65535.');
    process.exitCode = 1;
  } else {
    const server = createAppServer();
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${port} sedang digunakan. Pilih PORT lain.` : `Server gagal dijalankan: ${error.code}`);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`Motor Listrik demo: http://localhost:${port}`));
  }
}
