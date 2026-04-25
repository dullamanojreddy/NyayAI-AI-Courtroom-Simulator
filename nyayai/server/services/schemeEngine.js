function normalizeIncome(value) {
  if (value === undefined || value === null || value === '') {
    return Number.MAX_SAFE_INTEGER;
  }

  if (typeof value === 'number') {
    return value;
  }

  const lower = String(value).toLowerCase();
  const digits = lower.replace(/[^0-9]/g, '');
  if (digits) {
    const numberValue = Number(digits);
    if (!Number.isNaN(numberValue)) {
      if (lower.includes('lakh') || lower.includes('lac') || lower.includes('l')) {
        return numberValue * 100000;
      }
      return numberValue;
    }
  }

  const map = {
    'below 1l': 100000,
    '1-3l': 300000,
    '3-5l': 500000,
    '3-7l': 700000,
    '5-8l': 800000,
    '8l+': 999999999,
    'above 15l': 999999999
  };

  return map[lower] || Number.MAX_SAFE_INTEGER;
}

function includesFlexible(list, value) {
  if (!Array.isArray(list) || list.length === 0) {
    return true;
  }
  if (list.includes('ALL') || list.includes('All') || list.includes('*')) {
    return true;
  }
  return list.some((item) => String(item).toLowerCase() === String(value || '').toLowerCase());
}

function matchesScheme(scheme, input) {
  const income = normalizeIncome(input.income);
  const incomeMax = Number(
    scheme.incomeMax ||
    scheme.eligibilityCriteria?.maxIncome ||
    Number.MAX_SAFE_INTEGER
  );

  const stateOk = includesFlexible(scheme.states, input.state);
  const categoryOk = includesFlexible(
    scheme.categories?.length ? scheme.categories : scheme.eligibilityCriteria?.categories,
    input.category
  );
  const caseTypeOk = includesFlexible(
    scheme.caseTypes?.length ? scheme.caseTypes : scheme.eligibilityCriteria?.caseTypes,
    input.caseType
  );
  const incomeOk = income <= incomeMax;

  return stateOk && categoryOk && caseTypeOk && incomeOk;
}

function filterSchemes(schemes, input) {
  return (schemes || []).filter((scheme) => matchesScheme(scheme, input || {}));
}

module.exports = { filterSchemes };
