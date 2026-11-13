# Pendências e decisões

Base: *Revisão de produto v1.1 — Contabilidade digital para médicos PJ e programadores PJ* (13/11/2026). Decisão: **GO condicional**, lançar com 15 pré-vendas pagas.

## Decisões refletidas na landing page

- Dois planos: **PJ Essencial** (R$ 179/mês) e **PJ Internacional** (R$ 279/mês).
- Fator R acompanhado com revisão humana já no Essencial. O texto fala em "acompanhamento", nunca em "garantia".
- Certificado A1, WhatsApp (1ª resposta em 1 dia útil) e resumo mensal da economia no plano de entrada.
- Sem fidelidade; extras com preço publicado; regularização de períodos anteriores fora do plano.
- Calculadora de economia (Fator R + exportação segregada) com os exemplos da revisão cobertos por testes.
- Escopo do Internacional: até 2 contratantes estrangeiros, contrato no CNPJ, câmbio formal na conta PJ.

## Pendências antes de publicar

- [ ] **Nome e marca definitivos.** "Contábil PJ" é provisório (`index.html`, `privacidade.html`).
- [ ] **Destino do cadastro.** Preencher `LEAD_ENDPOINT` em `src/assets/config.js` (função serverless, webhook do CRM ou serviço de formulários). Até lá o formulário aparece como indisponível.
- [ ] **Validar com o parceiro** as simulações do médico (R$ 15 mil/mês) e do dev exportador (R$ 20 mil/mês) usadas na calculadora e no hero.
- [ ] **Política de privacidade:** revisão jurídica, razão social, CNPJ e contato do encarregado (DPO).
- [ ] **Hospedagem:** enviar a CSP e `frame-ancestors 'none'` como cabeçalho HTTP (no `<meta>` o navegador ignora `frame-ancestors`).
- [ ] Confirmar o pró-labore mínimo de referência (R$ 1.600) e a faixa de isenção de IR usados na calculadora.
- [ ] Comparação nominal com concorrentes ficou de fora; decidir com o jurídico se entra.
- [ ] "Contador registrado no CRC" aparece na faixa de confiança: só publicar com o parceiro já contratado e regularizado.
- [ ] Definir a marca e decidir se a paleta segue o verde-petróleo atual ou o azul-marinho + verde sugerido pelo `ui-ux-pro-max` (ver `docs/auditorias/`).
- [ ] Analytics ou pixel só depois de banner de consentimento (LGPD).

## Próximos passos da revisão (dias 1 a 15)

- [ ] Levar ao parceiro a tabela de repasse (45% / 50%) e o processo do Fator R.
- [x] Atualizar a landing page com os dois planos e a calculadora de economia.
- [ ] Incluir nas 30 entrevistas a pergunta de preço com o novo escopo e separar quantos devs recebem do exterior.
