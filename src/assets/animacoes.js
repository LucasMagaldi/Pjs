// Animações das prévias do app. Sem dependências.
// - Cada bloco [data-anima] ganha .em-cena quando entra na tela (uma vez).
// - [data-conta] sobe do zero até o valor quando o bloco entra em cena.
// - O cartão do Fator R (hero) percorre três estados em ciclo.
// - "Pausar animações" congela tudo (WCAG 2.2.2); com prefers-reduced-motion
//   nada se move e as prévias mostram o estado final.

const raiz = document.documentElement;
raiz.classList.add('js');

const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pausado = () => raiz.dataset.animacoes === 'pausadas';
const numero = (valor, casas = 0) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/* ---------- Números que sobem ---------- */
function contar(el) {
  const alvo = Number(el.dataset.conta);
  const casas = Number(el.dataset.casas ?? 0);
  if (semMovimento) { el.textContent = numero(alvo, casas); return; }
  const duracao = 1400;
  let decorrido = 0;
  let ultimo = null;
  const passo = (agora) => {
    if (ultimo !== null && !pausado()) decorrido += agora - ultimo;
    ultimo = agora;
    const t = Math.min(decorrido / duracao, 1);
    const suave = 1 - Math.pow(1 - t, 3);
    el.textContent = numero(alvo * suave, casas);
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* ---------- Entrada em cena ---------- */
function entrarEmCena(bloco) {
  bloco.classList.add('em-cena');
  bloco.querySelectorAll('[data-conta]').forEach(contar);
}

const blocos = document.querySelectorAll('[data-anima]');
if ('IntersectionObserver' in window && !semMovimento) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrarEmCena(entrada.target);
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.25 });
  blocos.forEach((bloco) => observador.observe(bloco));
} else {
  blocos.forEach(entrarEmCena);
}

/* ---------- Ciclo do Fator R ---------- */
const ESTADOS = [
  { valor: 22.4, duracao: 2600 }, // projeção abaixo do limite
  { valor: 22.4, duracao: 3400 }, // sugestão do contador
  { valor: 29.1, duracao: 3400 }, // aprovado: Anexo III
];
const ESCALA = 40; // o trilho vai de 0% a 40% de Fator R; 28% fica em 70%

function iniciarFator(fator) {
  const rotulo = fator.querySelector('[data-fator-valor]');
  let estado = 0;
  let mostrado = ESTADOS[0].valor;
  let visivel = true;

  const aplicar = (indice, animarNumero) => {
    const { valor } = ESTADOS[indice];
    fator.dataset.estado = String(indice);
    fator.style.setProperty('--fator', `${(valor / ESCALA) * 100}%`);
    if (!animarNumero || semMovimento) { rotulo.textContent = numero(valor, 1); mostrado = valor; return; }
    const de = mostrado;
    const inicio = performance.now();
    const passo = (agora) => {
      const t = Math.min((agora - inicio) / 900, 1);
      mostrado = de + (valor - de) * (1 - Math.pow(1 - t, 3));
      rotulo.textContent = numero(mostrado, 1);
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };

  if (semMovimento) { aplicar(2, false); return; }
  aplicar(0, false);

  // só avança com o bloco visível e sem pausa
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(fator);
  let restante = ESTADOS[0].duracao;
  let ultimo = performance.now();
  setInterval(() => {
    const agora = performance.now();
    if (visivel && !pausado()) restante -= agora - ultimo;
    ultimo = agora;
    if (restante > 0) return;
    estado = (estado + 1) % ESTADOS.length;
    aplicar(estado, true);
    restante = ESTADOS[estado].duracao;
  }, 100);
}

document.querySelectorAll('[data-fator]').forEach(iniciarFator);

/* ---------- Botão de pausa ---------- */
const botao = document.getElementById('pausar-animacoes');
if (botao) {
  const texto = botao.querySelector('span');
  botao.addEventListener('click', () => {
    const pausar = !pausado();
    if (pausar) raiz.dataset.animacoes = 'pausadas';
    else delete raiz.dataset.animacoes;
    botao.setAttribute('aria-pressed', String(pausar));
    texto.textContent = pausar ? 'Retomar animações' : 'Pausar animações';
  });
}
