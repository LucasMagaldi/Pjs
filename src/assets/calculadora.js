// Simulação ilustrativa de economia tributária no Simples Nacional.
// Funções puras, sem acesso ao DOM: usadas pela página e pelos testes.
// Base: LC 123/2006 (Anexos III e V) e a revisão de produto v1.1.

/** Faturamento mensal máximo atendido pelos planos (1 CNPJ, até R$ 30 mil/mês). */
export const FATURAMENTO_MAXIMO_PLANO = 30000;

/** Pró-labore mínimo de referência usado na revisão v1.1. */
export const PRO_LABORE_MINIMO = 1600;

/** Fator R mínimo para ficar no Anexo III. */
export const FATOR_R_LIMITE = 0.28;

/** Alíquota de INSS do sócio sobre o pró-labore. */
export const INSS_SOCIO = 0.11;

/** Pró-labore isento de IR em 2026 (rendimentos de até R$ 5 mil por mês). */
export const LIMITE_ISENCAO_IR = 5000;

// Faixas por receita bruta dos últimos 12 meses (RBT12).
const ANEXO_III = [
  { ate: 180000, aliquota: 0.06, deducao: 0 },
  { ate: 360000, aliquota: 0.112, deducao: 9360 },
  { ate: 720000, aliquota: 0.135, deducao: 17640 },
  { ate: 1800000, aliquota: 0.16, deducao: 35640 },
  { ate: 3600000, aliquota: 0.21, deducao: 125640 },
  { ate: 4800000, aliquota: 0.33, deducao: 648000 },
];

const ANEXO_V = [
  { ate: 180000, aliquota: 0.155, deducao: 0 },
  { ate: 360000, aliquota: 0.18, deducao: 4500 },
  { ate: 720000, aliquota: 0.195, deducao: 9900 },
  { ate: 1800000, aliquota: 0.205, deducao: 17100 },
  { ate: 3600000, aliquota: 0.23, deducao: 62100 },
  { ate: 4800000, aliquota: 0.305, deducao: 540000 },
];

/**
 * Peso de Cofins + PIS + ISS no DAS do Anexo III nas faixas 1 a 4
 * (12,82 + 2,78 + 33,5 = 14,05 + 3,05 + 32 = 13,64 + 2,96 + 32,5 = 49,1%).
 * É a parte do DAS que deixa de ser paga na receita de exportação segregada.
 */
export const PESO_EXPORTACAO_ANEXO_III = 0.491;

function faixa(tabela, rbt12) {
  const encontrada = tabela.find((f) => rbt12 <= f.ate);
  if (!encontrada) throw new RangeError('Receita acima do limite do Simples Nacional');
  return encontrada;
}

/** Alíquota efetiva do Simples: (RBT12 × nominal − dedução) / RBT12. */
export function aliquotaEfetiva(anexo, rbt12) {
  const tabela = anexo === 'III' ? ANEXO_III : ANEXO_V;
  if (!(rbt12 > 0)) return 0;
  const f = faixa(tabela, rbt12);
  return (rbt12 * f.aliquota - f.deducao) / rbt12;
}

const arredondar = (valor) => Math.round(valor * 100) / 100;

/**
 * Compara os tributos mensais sem e com o acompanhamento especializado.
 *
 * @param {object} entrada
 * @param {number} entrada.faturamentoMensal faturamento médio por mês (constante nos últimos 12 meses)
 * @param {number} [entrada.percentualExterior] fração da receita vinda de contratante no exterior (0 a 1)
 */
export function simular({ faturamentoMensal, percentualExterior = 0 }) {
  if (!Number.isFinite(faturamentoMensal) || faturamentoMensal <= 0) {
    throw new RangeError('Informe um faturamento mensal maior que zero');
  }
  if (faturamentoMensal > FATURAMENTO_MAXIMO_PLANO) {
    throw new RangeError('Faturamento acima do escopo dos planos');
  }
  const exterior = Math.min(Math.max(percentualExterior, 0), 1);
  const rbt12 = faturamentoMensal * 12;

  // Cenário genérico: pró-labore mínimo, Fator R abaixo de 28%, Anexo V, sem segregar exportação.
  const proLaboreGenerico = PRO_LABORE_MINIMO;
  const aliquotaV = aliquotaEfetiva('V', rbt12);
  const dasGenerico = faturamentoMensal * aliquotaV;
  const inssGenerico = proLaboreGenerico * INSS_SOCIO;

  // Cenário especialista: pró-labore de 28% (Fator R), Anexo III e exportação segregada.
  const proLabore = Math.max(faturamentoMensal * FATOR_R_LIMITE, PRO_LABORE_MINIMO);
  const aliquotaIII = aliquotaEfetiva('III', rbt12);
  const dasAnexoIII = faturamentoMensal * aliquotaIII;
  const economiaExportacao = dasAnexoIII * exterior * PESO_EXPORTACAO_ANEXO_III;
  const dasEspecialista = dasAnexoIII - economiaExportacao;
  const inssEspecialista = proLabore * INSS_SOCIO;

  const totalGenerico = dasGenerico + inssGenerico;
  const totalEspecialista = dasEspecialista + inssEspecialista;
  const economiaMensal = totalGenerico - totalEspecialista;

  return {
    rbt12,
    generico: {
      anexo: 'V',
      aliquota: aliquotaV,
      das: arredondar(dasGenerico),
      proLabore: arredondar(proLaboreGenerico),
      inss: arredondar(inssGenerico),
      total: arredondar(totalGenerico),
    },
    especialista: {
      anexo: 'III',
      aliquota: aliquotaIII,
      das: arredondar(dasEspecialista),
      proLabore: arredondar(proLabore),
      inss: arredondar(inssEspecialista),
      total: arredondar(totalEspecialista),
    },
    economiaFatorR: arredondar(totalGenerico - (dasAnexoIII + inssEspecialista)),
    economiaExportacao: arredondar(economiaExportacao),
    economiaMensal: arredondar(economiaMensal),
    economiaAnual: arredondar(economiaMensal * 12),
    proLaboreAcimaIsencaoIR: proLabore > LIMITE_ISENCAO_IR,
    planoSugerido: exterior > 0 ? 'internacional' : 'essencial',
  };
}
