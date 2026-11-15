// Gera a prévia publicável da landing em dist/preview/ (página do claude.ai).
// Uso: node scripts/build-preview.js
//
// O host da prévia monta o próprio esqueleto (<html>, <head>, <body>) e aplica a
// própria CSP. Por isso, a partir de src/ sem alterá-lo:
// - index.html vira só conteúdo: <title>, <style> com todo o CSS embutido e o <body>;
// - fontes .woff2 entram como data URI no CSS;
// - seletores [data-estilo="piccow"] passam a valer sem o atributo no <html>;
// - o cabeçalho fixo e o botão de pausa respeitam as áreas seguras do celular;
// - as outras páginas (portal, privacidade) saem sem a meta de CSP;
// - os scripts seguem como arquivos (assets/*.js), com os mesmos imports relativos.
import { mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(raiz, 'src');
const saida = join(raiz, 'dist', 'preview');

const ler = (arquivo) => readFile(join(src, arquivo), 'utf8');
const semCsp = (html) => html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '');

async function cssComFontes(arquivo) {
  let css = await ler(arquivo);
  const fontes = [...css.matchAll(/url\("(fonts\/[^"]+\.woff2)"\)/g)];
  for (const [trecho, caminho] of fontes) {
    const dados = (await readFile(join(src, 'assets', caminho))).toString('base64');
    css = css.replace(trecho, `url("data:font/woff2;base64,${dados}")`);
  }
  return css;
}

const AJUSTES_HOST = `
/* ---- ajustes da prévia no host (áreas seguras do celular) ---- */
.topo { top: env(safe-area-inset-top, 0px); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--color-nav-de); }
.l-pausar { left: calc(16px + env(safe-area-inset-left, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }
`;

async function main() {
  await rm(saida, { recursive: true, force: true });
  await mkdir(join(saida, 'assets'), { recursive: true });

  // CSS da landing, na mesma ordem dos <link> do index.html
  const partes = [];
  for (const arquivo of ['assets/styles.css', 'assets/piccow.css', 'assets/layout.css', 'assets/tema-navy-rosa.css']) {
    partes.push(`/* ${arquivo} */\n${await cssComFontes(arquivo)}`);
  }
  const css = (partes.join('\n') + AJUSTES_HOST)
    .replaceAll(':root[data-estilo="piccow"]', ':root')
    .replaceAll(':root[data-tema="navy-rosa"]', ':root')
    .replaceAll('[data-tema="navy-rosa"] ', ':root ')
    .replaceAll('[data-estilo="piccow"] ', ':root ');

  const html = await ler('index.html');
  const titulo = 'Contábil PJ';
  const corpo = html.slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>')).trim();
  const descricao = html.match(/<meta name="description" content="([^"]+)">/)[1];
  const pagina = [
    `<title>${titulo}</title>`,
    `<meta name="description" content="${descricao}">`,
    '<style>',
    css,
    '</style>',
    '<script type="module" src="assets/app.js"></script>',
    '<script type="module" src="assets/animacoes.js"></script>',
    corpo,
    '',
  ].join('\n');
  await writeFile(join(saida, 'index.html'), pagina);

  for (const js of ['app.js', 'calculadora.js', 'config.js', 'animacoes.js']) {
    await copyFile(join(src, 'assets', js), join(saida, 'assets', js));
  }
  // páginas extras: documentos completos, sem a meta de CSP
  for (const pagina of ['privacidade.html', 'portal.html']) {
    await writeFile(join(saida, pagina), semCsp(await ler(pagina)));
  }
  for (const css of ['styles.css', 'portal.css']) {
    await copyFile(join(src, 'assets', css), join(saida, 'assets', css));
  }
  console.log(`Prévia gerada em ${saida}`);
}

main().catch((erro) => { console.error(erro); process.exit(1); });
