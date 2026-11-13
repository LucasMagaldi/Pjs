// Servidor estático mínimo para desenvolvimento: node scripts/serve.js [porta]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('../src', import.meta.url)));
const porta = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const arquivo = normalize(join(raiz, caminho === '/' ? 'index.html' : caminho));
  if (!arquivo.startsWith(raiz)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] ?? 'application/octet-stream' });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
  }
}).listen(porta, () => console.log(`Landing em http://localhost:${porta}`));
