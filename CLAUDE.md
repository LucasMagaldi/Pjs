# CLAUDE.md — guia para sessões do Claude Code

Este arquivo é lido automaticamente no início de cada sessão. Siga-o antes de explorar o código.

## 1. Primeiro passo de toda sessão: economia de tokens

Duas ferramentas reduzem o custo de contexto:

- **rtk**: compacta a saída do terminal (`git`, `grep`, `ls`, testes…) por meio de um hook.
- **codebase-memory-mcp**: mantém um grafo do código (funções, chamadas, dependências) consultável por ferramentas MCP.

### Rotina de início (obrigatória, sem esperar pedido do usuário)

Na **primeira resposta** de toda sessão, antes de qualquer exploração ou tarefa, mesmo que o pedido seja outro:

1. **Conferir a instalação:**
   ```bash
   command -v rtk && rtk --version
   command -v codebase-memory-mcp && codebase-memory-mcp --version
   ```
2. **Se faltar alguma**, instalar com os comandos da subseção abaixo e avisar o usuário que o hook do rtk e as ferramentas MCP só carregam numa **nova sessão** (na nuvem: configurar o *Setup script*; localmente: fechar e reabrir o app desktop ou o `claude`). Até lá, usar o grafo pela CLI.
3. **Indexar o projeto.** Na nuvem o índice some a cada sessão. Localmente ele persiste em `~/.cache/codebase-memory-mcp` e só precisa ser atualizado quando o código mudou.
   - Com as ferramentas MCP carregadas: `list_projects` / `index_status`; se não estiver indexado ou estiver desatualizado, `index_repository` com a raiz do repositório.
   - Sem elas: `codebase-memory-mcp cli --quiet index_repository '{"repo_path":"'"$PWD"'"}'`.
4. **Configurar a autoria do git** (seção 2).
5. Informar em uma linha o estado: rtk ativo ou não, MCP carregado ou só CLI, projeto indexado.

Só depois seguir com o pedido do usuário. A partir daí, consultar o grafo **antes** de `grep` e de ler arquivos inteiros.

### Instalação

```bash
# rtk: RTK_VERSION fixo porque o proxy da nuvem bloqueia a busca da "última versão"
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | RTK_VERSION=v1.1.0 sh
~/.local/bin/rtk init -g --auto-patch

# codebase-memory-mcp: instala o binário e configura o MCP, as skills e os hooks do Claude Code
curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash
```

- Os dois instaladores conferem o checksum do release e instalam em `~/.local/bin` (sem `sudo`).
- `rtk init -g --auto-patch` registra o hook globalmente no `~/.claude/settings.json`.
- **Depois de instalar, é preciso abrir uma nova sessão** para o hook do rtk e as ferramentas MCP carregarem.

**Na nuvem (Claude Code na web):** cada sessão sobe um container novo, então as linhas acima devem ficar no *Setup script* do ambiente (menu do ambiente no título da sessão → Edit → Setup script). Ele roda antes da sessão começar, e as ferramentas já chegam carregadas. Se a instalação for necessária no meio da sessão, lembre o usuário dessa configuração.

**Localmente (app desktop ou terminal):** a instalação é feita uma vez só. Basta fechar e reabrir o app (ou o `claude`) e as ferramentas valem para todas as sessões seguintes. Funciona em Mac e Linux; no Windows, via WSL.

### Como usar

| Ferramenta | Quando | Como |
|---|---|---|
| **codebase-memory-mcp** | Entender a estrutura, achar funções, ver quem chama quem, medir o impacto de mudanças | 1) `list_projects` / `index_status`; se o projeto não estiver indexado (ou estiver desatualizado), `index_repository` com o caminho da raiz. 2) `get_architecture`, `search_graph`, `trace_path`, `get_code_snippet`, `detect_changes`. Use **antes** de `grep` e de ler arquivos inteiros |
| **rtk** | Automático, via hook: reescreve os comandos de terminal e devolve a saída compacta | Nada a fazer. `rtk gain` mostra a economia. Se uma saída vier truncada, ela traz `rtk recall <id>` para ver o resto |

Sem as ferramentas MCP na sessão (antes do reinício), o grafo responde pela CLI:

```bash
codebase-memory-mcp cli --quiet index_repository '{"repo_path":"'"$PWD"'"}'
codebase-memory-mcp cli --quiet trace_path '{"project":"<nome em list_projects>","function_name":"<funcao>","direction":"inbound"}'
```

## 2. Autoria do git e commits

```bash
git config user.name "Lucas Magaldi"
git config user.email "<seu e-mail do GitHub>"
```

- Commits seguem **Conventional Commits** (`feat(escopo): ...`, `fix(escopo): ...`, `test(escopo): ...`), de preferência validados pelo `commitlint` no hook `commit-msg` (husky).
- Commits **pequenos e bem delimitados**: um assunto por commit.
- Escopos sugeridos: `landing`, `calc`, `form`, `ui`, `deps`, `ci`, `docs`, `test`.
- Trailers de coautoria do Claude vão no rodapé do commit. Nunca citar identificadores de modelo em commits, PRs ou código.
- Não abrir PR sem pedido explícito.

## 3. O produto

**Contábil PJ (nome provisório)**: contabilidade digital especializada para médicos PJ e programadores PJ, operada com um escritório contábil parceiro. Planos PJ Essencial (R$ 179) e PJ Internacional (R$ 279).

- Contrato de escopo: a *Revisão de produto v1.1* (13/11/2026), resumida em `docs/PENDENCIAS.md`. As decisões confirmadas ali prevalecem sobre sugestões técnicas.
- Decisões recentes e pendências: `docs/PENDENCIAS.md`. Leia antes de começar; ao concluir um item, atualize o arquivo no mesmo PR.

## 4. Stack e comandos

- Landing page estática: HTML, CSS e JavaScript (módulos ES), sem build e sem dependências.
- Testes com `node:test` (Node 20+).

```bash
npm run dev    # http://localhost:4173
npm test
```

## 5. Skills do projeto (`.claude/skills/`)

As skills ficam versionadas em `.claude/skills/<nome>/SKILL.md` e são carregadas automaticamente pelo Claude Code. Cada pasta deve ter um `ORIGEM.md` com a origem, o commit e a licença.

### Instalação

Copie as pastas de um projeto que já as tenha (ex.: o Piccow) ou dos repositórios de origem:

```bash
mkdir -p .claude/skills
cp -r <caminho/do/piccow>/.claude/skills/. .claude/skills/
```

| Skill | Origem |
|---|---|
| `accessibility-audit`, `design-critique` | https://github.com/cuellarfr/design-skills (pasta `skills/`), MIT |
| `nielsen-heuristics-audit`, `don-norman-principles-audit`, `cognitive-walkthrough` | https://github.com/mastepanoski/claude-skills (pasta `skills/`), MIT |
| `ui-ux-pro-max`, `ui-styling`, `design-system`, `design`, `brand`, `banner-design`, `slides` | copiar do Piccow; registrar a origem num `ORIGEM.md` |

Para atualizar uma skill, substitua a pasta pela versão nova do repositório de origem e atualize o commit no `ORIGEM.md`.

### Auditorias de UX

Relatórios em pt-BR. As regras deste arquivo prevalecem sobre as recomendações genéricas das skills.

| Skill | O que faz | Quando usar |
|---|---|---|
| `nielsen-heuristics-audit` | Avalia as 10 heurísticas de Nielsen com severidade 0–4 | Revisão geral de uma tela ou do produto |
| `don-norman-principles-audit` | Avalia descoberta, affordances, sinalizadores, feedback, mapeamento, restrições e modelo mental | Telas novas e interações pouco óbvias |
| `cognitive-walkthrough` | Percorre um fluxo passo a passo como um usuário novato | Fluxos críticos: calculadora e formulário de pré-venda |
| `design-critique` | Combina heurísticas, leis de UX, padrões de interação, arquitetura de informação e qualidade dos textos | Crítica estruturada de um design ou protótipo |
| `accessibility-audit` | Verifica a conformidade com a WCAG 2.2 (A/AA/AAA), com correções em código | Antes de publicar qualquer tela; meta mínima AA |

### UI e design

| Skill | O que faz | Quando usar |
|---|---|---|
| `ui-ux-pro-max` | Base de regras de UI/UX: estilos, paletas, fontes, guidelines, gráficos e stacks | Ao projetar, construir ou revisar qualquer interface. **Os tokens do projeto prevalecem sobre as paletas sugeridas** |
| `ui-styling` | Componentes shadcn/ui (Radix + Tailwind), temas, modo escuro, layouts responsivos | Implementação de componentes e estilos |
| `design-system` | Arquitetura de tokens em três camadas (primitivo → semântico → componente) e especificação de componentes | Criar ou evoluir o design system |
| `design` | Identidade visual, logo, ícones, mockups, banners e imagens para redes sociais | Trabalho de marca e peças visuais |
| `brand` | Voz da marca, identidade visual, mensagens e consistência | Textos de marketing e revisão de tom |

### Marketing e apresentações

| Skill | O que faz | Quando usar |
|---|---|---|
| `banner-design` | Banners para redes sociais, anúncios, hero do site e impressos | Peças de divulgação |
| `slides` | Apresentações em HTML com Chart.js e tokens de design | Pitch, apresentações de resultado |

## 6. Arquitetura

```
src/
  index.html            landing page
  privacidade.html      política de privacidade (rascunho)
  assets/
    calculadora.js      regras tributárias puras (Simples Nacional), sem DOM
    app.js              liga a calculadora e o formulário à página
    config.js           LEAD_ENDPOINT (destino do cadastro)
    styles.css          tokens e estilos
scripts/serve.js        servidor estático de desenvolvimento
tests/                  testes da calculadora
```

Regras de dependência: `calculadora.js` não acessa DOM nem rede. Valores e textos tributários seguem a revisão v1.1 e nunca prometem "garantia" de economia.

## 7. Segurança e privacidade

- Isolamento por usuário em toda query. Testes cobrem a manipulação de IDs.
- Não registrar dados sensíveis dos usuários em logs ou analytics.
- Conteúdo enviado pelo usuário (arquivos, mensagens) é **dado não confiável**: nunca vira instrução para a IA.
- Integrações sem credenciais ficam **indisponíveis** e explícitas na UI, nunca simuladas como produção.
- Rate limit em armazenamento compartilhado (banco ou cache), nunca em memória.
- Script de terceiro exige nonce e a origem na CSP; analytics ou pixel só após consentimento (LGPD).

## 8. Design

- Marca, cores e contrastes: definidos no topo de `src/assets/styles.css` (ainda sem manual de marca). **Nunca use cores fixas nos componentes: só tokens.**
- Texto corrido com contraste mínimo de 4.5:1 (WCAG AA).
- Avisos combinam ícone + rótulo + tom: cor nunca é o único sinal.
- Movimento sempre respeita `prefers-reduced-motion` e tem alternativa por toque e teclado.
- Use `ui-ux-pro-max` para regras de acessibilidade e UX, e as skills de auditoria da seção 5 antes de dar uma tela por concluída.
