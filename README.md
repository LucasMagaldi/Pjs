# Contábil PJ — landing page de pré-venda

Landing page de captação para a contabilidade digital de **médicos PJ e programadores PJ** (planos PJ Essencial, R$ 179, e PJ Internacional, R$ 279).

- Calculadora de economia (Fator R e exportação de serviços) que roda só no navegador.
- Formulário de pré-venda com validação acessível, consentimento LGPD e campo isca contra robôs.
- Duas versões visuais: landing clara (`src/index.html`) e portal corporativo escuro (`src/portal.html`, em http://localhost:4173/portal.html).
- HTML, CSS e JS estáticos, sem build e sem dependências: pode ir para qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, GitHub Pages) publicando a pasta `src/`.

```bash
npm run dev
```

```bash
npm test
```

## Antes de publicar

1. Defina o destino do cadastro em `src/assets/config.js` (`LEAD_ENDPOINT`, HTTPS, recebe JSON via POST). Sem ele, o formulário mostra "Cadastro indisponível" e não envia nada.
2. Veja as demais pendências em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).

Campos enviados: `nome`, `email`, `whatsapp` (só dígitos), `profissao`, `situacao_cnpj`, `faixa_faturamento`, `plano`, `consentimento`, `consentimento_em`, `origem`.
