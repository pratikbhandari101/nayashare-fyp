function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value) {
  return Number(toNumber(value).toFixed(2));
}

function resolveBaseValuation(startup = {}) {
  return Math.max(toNumber(startup.valuation?.initialValuation || startup.initialValuation), 100000);
}

export function calculateValuation(startup = {}) {
  const monthlyRevenue = toNumber(startup.financials?.monthlyRevenue);
  const monthlyExpenses = toNumber(startup.financials?.monthlyExpenses);
  const growthRate = toNumber(startup.traction?.growthRate);
  const initialValuation = resolveBaseValuation(startup);
  const profit = monthlyRevenue - monthlyExpenses;
  const valuationGrowth = profit * 12 * 2 + (growthRate / 100) * initialValuation;
  return roundCurrency(Math.max(initialValuation + valuationGrowth, 0));
}

export function resolveCurrentValuation(startup = {}, options = {}) {
  const valuationMode = startup.valuation?.valuationMode || startup.valuationMode || "auto";
  const initialValuation = resolveBaseValuation(startup);

  if (valuationMode === "manual") {
    return roundCurrency(
      Math.max(
        options.manualValuation ??
          startup.valuation?.currentValuation ??
          startup.currentValuation ??
          initialValuation,
        initialValuation
      )
    );
  }

  return calculateValuation({
    financials: startup.financials?.toObject?.() || startup.financials || {},
    traction: startup.traction?.toObject?.() || startup.traction || {},
    valuation: {
      ...(startup.valuation?.toObject?.() || startup.valuation || {}),
      initialValuation,
      valuationMode
    },
    initialValuation
  });
}

export function syncStartupValuation(startup, options = {}) {
  const base = startup.valuation?.toObject?.() || startup.valuation || {};
  const initialValuation = roundCurrency(
    resolveBaseValuation({
      valuation: base,
      initialValuation: startup.initialValuation
    })
  );
  const valuationMode = base.valuationMode || "auto";
  const currentValuation = resolveCurrentValuation(
    {
      financials: startup.financials?.toObject?.() || startup.financials || {},
      traction: startup.traction?.toObject?.() || startup.traction || {},
      currentValuation: startup.currentValuation,
      initialValuation: startup.initialValuation,
      valuation: {
        ...base,
        initialValuation,
        valuationMode
      }
    },
    options
  );

  startup.valuation = {
    ...base,
    initialValuation,
    currentValuation,
    valuationMode
  };
  startup.initialValuation = initialValuation;
  startup.currentValuation = currentValuation;

  return startup.valuation;
}
