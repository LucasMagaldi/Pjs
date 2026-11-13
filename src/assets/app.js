import { simular, FATURAMENTO_MAXIMO_PLANO } from './calculadora.js';
import { LEAD_ENDPOINT } from './config.js';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const $ = (id) => document.getElementById(id);

const NOMES_PLANO = { essencial: 'PJ Essencial (R$ 179/mês)', internacional: 'PJ Internacional (R$ 279/mês)' };

/* ---------- Calculadora ---------- */

function lerValor(texto) {
  const digitos = String(texto).replace(/\D/g, '');
  return digitos ? Number(digitos) : 0;
}

function iniciarCalculadora() {
  const form = $('form-calculadora');
  if (!form) return;
  const faturamento = $('calc-faturamento');
  const exterior = $('calc-exterior');
  const campoExterior = $('campo-exterior');
  const erro = $('calc-faturamento-erro');
  const resultado = $('calc-resultado');
  let planoSugerido = 'essencial';

  function mostrarErro(mensagem) {
    erro.textContent = mensagem;
    erro.hidden = false;
    faturamento.setAttribute('aria-invalid', 'true');
    resultado.setAttribute('aria-hidden', 'true');
  }

  function limparErro() {
    erro.hidden = true;
    faturamento.removeAttribute('aria-invalid');
    resultado.removeAttribute('aria-hidden');
  }

  function atualizar() {
    const profissao = form.elements.profissao.value;
    const ehDev = profissao === 'dev';
    campoExterior.hidden = !ehDev;
    const percentual = ehDev ? Number(exterior.value) / 100 : 0;
    $('calc-exterior-valor').textContent = `${exterior.value}%`;

    const valor = lerValor(faturamento.value);
    if (valor <= 0) return mostrarErro('Informe o seu faturamento médio por mês.');
    if (valor > FATURAMENTO_MAXIMO_PLANO) {
      return mostrarErro('Acima de R$ 30 mil por mês o seu caso precisa de análise individual. Deixe o contato na pré-venda.');
    }
    limparErro();

    const r = simular({ faturamentoMensal: valor, percentualExterior: percentual });
    $('res-anual').textContent = moeda.format(Math.max(r.economiaAnual, 0));
    $('res-mensal').textContent = moeda.format(Math.max(r.economiaMensal, 0));
    $('res-das-g').textContent = moeda.format(r.generico.das);
    $('res-das-e').textContent = moeda.format(r.especialista.das);
    $('res-pl-g').textContent = moeda.format(r.generico.proLabore);
    $('res-pl-e').textContent = moeda.format(r.especialista.proLabore);
    $('res-inss-g').textContent = moeda.format(r.generico.inss);
    $('res-inss-e').textContent = moeda.format(r.especialista.inss);
    $('res-total-g').textContent = moeda.format(r.generico.total);
    $('res-total-e').textContent = moeda.format(r.especialista.total);
    $('res-fator-r').textContent = `${moeda.format(r.economiaFatorR)}/mês`;
    $('res-exportacao').textContent = `${moeda.format(r.economiaExportacao)}/mês`;
    $('linha-exportacao').hidden = r.economiaExportacao <= 0;
    $('aviso-ir').hidden = !r.proLaboreAcimaIsencaoIR;
    planoSugerido = r.planoSugerido;
    $('res-plano').textContent = NOMES_PLANO[planoSugerido];
  }

  faturamento.addEventListener('input', () => {
    const valor = lerValor(faturamento.value);
    faturamento.value = valor ? inteiro.format(valor) : '';
    atualizar();
  });
  form.addEventListener('change', atualizar);
  exterior.addEventListener('input', atualizar);
  form.addEventListener('submit', (e) => e.preventDefault());

  $('calc-cta').addEventListener('click', () => {
    preencherLead({ plano: planoSugerido, profissao: form.elements.profissao.value, faturamento: lerValor(faturamento.value) });
  });

  atualizar();
}

/* ---------- Formulário de pré-venda ---------- */

function faixaFaturamento(valor) {
  if (!valor) return '';
  if (valor <= 10000) return 'ate_10k';
  if (valor <= 20000) return '10k_20k';
  if (valor <= 30000) return '20k_30k';
  return 'acima_30k';
}

function preencherLead({ plano, profissao, faturamento }) {
  const form = $('form-lead');
  if (!form) return;
  if (plano) form.elements.plano.value = plano;
  if (profissao) {
    const radio = form.querySelector(`input[name="profissao"][value="${profissao}"]`);
    if (radio) radio.checked = true;
  }
  if (faturamento !== undefined) form.elements.faixa_faturamento.value = faixaFaturamento(faturamento);
}

const VALIDACOES = {
  nome: (v) => (v.trim().length >= 3 && v.trim().includes(' ')) || 'Informe nome e sobrenome.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Informe um e-mail válido, como nome@exemplo.com.',
  whatsapp: (v) => /^\d{10,11}$/.test(v.replace(/\D/g, '')) || 'Informe o número com DDD, como (11) 91234-5678.',
  profissao: (v) => Boolean(v) || 'Escolha a sua profissão.',
  situacao_cnpj: (v) => Boolean(v) || 'Selecione a situação do seu CNPJ.',
  faixa_faturamento: (v) => Boolean(v) || 'Selecione a faixa de faturamento.',
  plano: (v) => Boolean(v) || 'Selecione um plano ou "Ainda não sei".',
  consentimento: (v) => v === true || 'Precisamos da sua autorização para entrar em contato.',
};

const ID_ERRO = {
  nome: 'lead-nome-erro', email: 'lead-email-erro', whatsapp: 'lead-whatsapp-erro',
  profissao: 'lead-profissao-erro', situacao_cnpj: 'lead-cnpj-erro', faixa_faturamento: 'lead-faturamento-erro',
  plano: 'lead-plano-erro', consentimento: 'lead-consentimento-erro',
};

function lerFormulario(form) {
  const el = form.elements;
  return {
    nome: el.nome.value,
    email: el.email.value,
    whatsapp: el.whatsapp.value,
    profissao: el.profissao.value,
    situacao_cnpj: el.situacao_cnpj.value,
    faixa_faturamento: el.faixa_faturamento.value,
    plano: el.plano.value,
    consentimento: el.consentimento.checked,
  };
}

function validar(form, dados) {
  let primeiroInvalido = null;
  for (const [campo, regra] of Object.entries(VALIDACOES)) {
    const resultado = regra(dados[campo]);
    const erro = $(ID_ERRO[campo]);
    const controle = campo === 'profissao' ? form.querySelector('input[name="profissao"]') : form.elements[campo];
    if (resultado === true) {
      erro.hidden = true;
      if (campo !== 'profissao') controle.removeAttribute('aria-invalid');
    } else {
      erro.textContent = resultado;
      erro.hidden = false;
      if (campo !== 'profissao') controle.setAttribute('aria-invalid', 'true');
      primeiroInvalido ??= controle;
    }
  }
  return primeiroInvalido;
}

function mascararTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function iniciarFormulario() {
  const form = $('form-lead');
  if (!form) return;
  const status = $('lead-status');
  const botao = $('lead-enviar');
  const disponivel = /^https:\/\//.test(LEAD_ENDPOINT);

  if (!disponivel) {
    $('lead-indisponivel').hidden = false;
    botao.disabled = true;
    botao.textContent = 'Cadastro indisponível';
  }

  form.elements.whatsapp.addEventListener('input', (e) => {
    e.target.value = mascararTelefone(e.target.value);
  });

  document.querySelectorAll('[data-plano]').forEach((link) => {
    link.addEventListener('click', () => preencherLead({ plano: link.dataset.plano }));
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!disponivel) return;

    const dados = lerFormulario(form);
    const invalido = validar(form, dados);
    if (invalido) {
      status.dataset.tipo = 'erro';
      status.textContent = 'Revise os campos destacados.';
      invalido.focus();
      return;
    }
    // Campo isca preenchido: provável robô. Responde como sucesso sem enviar.
    if (form.elements.site.value) {
      status.dataset.tipo = 'sucesso';
      status.textContent = 'Recebemos o seu contato.';
      return;
    }

    botao.disabled = true;
    botao.textContent = 'Enviando…';
    status.textContent = '';
    try {
      const resposta = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...dados,
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          whatsapp: dados.whatsapp.replace(/\D/g, ''),
          origem: 'landing-pre-venda',
          consentimento_em: new Date().toISOString(),
        }),
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      form.reset();
      status.dataset.tipo = 'sucesso';
      status.textContent = 'Pronto! Recebemos o seu contato. Um especialista fala com você pelo WhatsApp em até 1 dia útil.';
      botao.textContent = 'Cadastro enviado';
    } catch {
      status.dataset.tipo = 'erro';
      status.textContent = 'Não conseguimos enviar agora. Verifique a sua conexão e tente de novo em alguns minutos.';
      botao.disabled = false;
      botao.textContent = 'Quero ser contatado';
    }
  });
}

iniciarCalculadora();
iniciarFormulario();
