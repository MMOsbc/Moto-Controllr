// utils/validators/index.js
// Funções centralizadas de validação e formatação para o MotoApp

// ─────────────────────────────────────────────
// VALIDAÇÕES
// ─────────────────────────────────────────────

/**
 * Valida data no formato brasileiro DD/MM/AAAA
 * @param {string} valor
 * @returns {{ valido: boolean, erro: string }}
 */
export function validarDataBR(valor) {
  if (!valor || !valor.trim()) {
    return { valido: false, erro: 'Data é obrigatória' };
  }
  // Verifica o formato usando regex
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = valor.trim().match(regex);
 
  if (!match) {
    return { valido: false, erro: 'Use o formato DD/MM/AAAA' };
  }
  // Verifica se a data é válida (considerando meses, dias e anos bissextos)
  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const ano = parseInt(match[3], 10);

  if (mes < 1 || mes > 12) {
    return { valido: false, erro: 'Mês inválido (01–12)' };
  }
 // Verifica o número de dias no mês, considerando anos bissextos
  const diasPorMes = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const bissexto = (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
  if (mes === 2 && bissexto) diasPorMes[2] = 29;

  if (dia < 1 || dia > diasPorMes[mes]) {
    return { valido: false, erro: `Dia inválido para o mês informado` };
  }

  if (ano < 1900 || ano > 2100) {
    return { valido: false, erro: 'Ano fora do intervalo permitido' };
  }

  return { valido: true, erro: '' };
}

/**
 * Valida e-mail usando regex
 * @param {string} valor
 * @returns {{ valido: boolean, erro: string }}
 */
export function validarEmail(valor) {
  if (!valor || !valor.trim()) {
    return { valido: false, erro: 'E-mail é obrigatório' };
  }

  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  if (!regex.test(valor.trim())) {
    return { valido: false, erro: 'E-mail inválido (ex: nome@email.com)' };
  }

  return { valido: true, erro: '' };
}

/**
 * Valida telefone brasileiro com DDD
 * Aceita: (11) 91234-5678 | (11) 1234-5678 | 11912345678
 * @param {string} valor
 * @returns {{ valido: boolean, erro: string }}
 */
export function validarTelefone(valor) {
  if (!valor || !valor.trim()) {
    return { valido: false, erro: 'Telefone é obrigatório' };
  }

  // Remove tudo que não for dígito para validar
  const soDigitos = valor.replace(/\D/g, '');

  if (soDigitos.length < 10 || soDigitos.length > 11) {
    return { valido: false, erro: 'Telefone inválido — use DDD + número' };
  }

  // DDD válido (11–99)
  const ddd = parseInt(soDigitos.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return { valido: false, erro: 'DDD inválido' };
  }

  return { valido: true, erro: '' };
}

/**
 * Valida placa de moto:
 * - Padrão antigo: AAA-9999
 * - Padrão Mercosul: AAA9A99
 * @param {string} valor
 * @returns {{ valido: boolean, erro: string }}
 */
export function validarPlaca(valor) {
  if (!valor || !valor.trim()) {
    return { valido: false, erro: 'Placa é obrigatória' };
  }

  const limpa = valor.trim().toUpperCase().replace(/[-\s]/g, '');

  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const antigo = /^[A-Z]{3}[0-9]{4}$/;

  if (!mercosul.test(limpa) && !antigo.test(limpa)) {
    return {
      valido: false,
      erro: 'Placa inválida — use AAA1234 ou AAA1B23',
    };
  }

  return { valido: true, erro: '' };
}

/**
 * Valida valor monetário (aceita números com vírgula ou ponto)
 * @param {string} valor
 * @returns {{ valido: boolean, erro: string }}
 */
export function validarValorMonetario(valor) {
  if (!valor || !valor.trim()) {
    return { valido: false, erro: 'Valor é obrigatório' };
  }

  // Remove símbolo R$, espaços e pontos de milhar
  const limpo = valor.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();

  if (isNaN(parseFloat(limpo)) || parseFloat(limpo) < 0) {
    return { valido: false, erro: 'Valor inválido' };
  }

  return { valido: true, erro: '' };
}

/**
 * Valida campo obrigatório (não vazio)
 * @param {string} valor
 * @param {string} nomeCampo
 * @returns {{ valido: boolean, erro: string }}
 */
export function validarObrigatorio(valor, nomeCampo = 'Campo') {
  if (!valor || !valor.trim()) {
    return { valido: false, erro: `${nomeCampo} é obrigatório` };
  }
  return { valido: true, erro: '' };
}

// ─────────────────────────────────────────────
// MÁSCARAS / FORMATAÇÕES
// ─────────────────────────────────────────────

/**
 * Aplica máscara de data BR: DD/MM/AAAA
 * @param {string} valor — texto digitado
 * @returns {string}
 */
export function mascaraDataBR(valor) {
  const d = valor.replace(/\D/g, '').substring(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Aplica máscara de telefone: (DDD) XXXXX-XXXX ou (DDD) XXXX-XXXX
 * @param {string} valor
 * @returns {string}
 */
export function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').substring(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Aplica máscara de placa (Mercosul/antiga) durante digitação
 * @param {string} valor
 * @returns {string}
 */
export function mascaraPlaca(valor) {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 7);
  return limpo;
}

/**
 * Formata número como moeda Real brasileiro
 * @param {string|number} valor
 * @returns {string} — ex: "R$ 1.250,00"
 */
export function formatarMoeda(valor) {
  const limpo = String(valor).replace(/\D/g, '');
  if (!limpo) return '';

  const numero = (parseInt(limpo, 10) / 100).toFixed(2);
  const [inteiro, decimal] = numero.split('.');
  const inteiroFormatado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `R$ ${inteiroFormatado},${decimal}`;
}

/**
 * Converte valor formatado (R$ 1.250,00) para número float
 * @param {string} valorFormatado
 * @returns {number}
 */
export function parseMoeda(valorFormatado) {
  if (!valorFormatado) return 0;
  const limpo = String(valorFormatado)
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(limpo) || 0;
}
