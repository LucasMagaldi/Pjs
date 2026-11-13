import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aliquotaEfetiva, simular } from '../src/assets/calculadora.js';

const perto = (atual, esperado, tolerancia = 1) =>
  assert.ok(Math.abs(atual - esperado) <= tolerancia, `${atual} ≉ ${esperado}`);

test('alíquota efetiva da 2ª faixa do Anexo III com RBT12 de R$ 240 mil é 7,3%', () => {
  perto(aliquotaEfetiva('III', 240000), 0.073, 0.0001);
});

test('médico com R$ 15 mil/mês reproduz o exemplo da revisão v1.1', () => {
  const r = simular({ faturamentoMensal: 15000 });
  assert.equal(r.generico.das, 2325);
  assert.equal(r.generico.inss, 176);
  assert.equal(r.generico.total, 2501);
  assert.equal(r.especialista.das, 900);
  assert.equal(r.especialista.proLabore, 4200);
  assert.equal(r.especialista.inss, 462);
  assert.equal(r.especialista.total, 1362);
  assert.equal(r.economiaMensal, 1139);
  assert.equal(r.economiaExportacao, 0);
  assert.equal(r.planoSugerido, 'essencial');
  assert.equal(r.proLaboreAcimaIsencaoIR, false);
});

test('dev com R$ 20 mil/mês 100% do exterior: DAS cai de ~R$ 1.460 para ~R$ 743', () => {
  const r = simular({ faturamentoMensal: 20000, percentualExterior: 1 });
  perto(r.economiaExportacao, 717);
  perto(r.especialista.das, 743);
  assert.equal(r.planoSugerido, 'internacional');
  assert.equal(r.proLaboreAcimaIsencaoIR, true);
  perto(r.economiaMensal, r.economiaFatorR + r.economiaExportacao, 0.02);
});

test('pró-labore nunca fica abaixo do mínimo de referência', () => {
  assert.equal(simular({ faturamentoMensal: 3000 }).especialista.proLabore, 1600);
});

test('rejeita faturamento inválido ou fora do escopo dos planos', () => {
  assert.throws(() => simular({ faturamentoMensal: 0 }), RangeError);
  assert.throws(() => simular({ faturamentoMensal: Number.NaN }), RangeError);
  assert.throws(() => simular({ faturamentoMensal: 30001 }), RangeError);
});
