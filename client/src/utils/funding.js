export function getFundingGoal(startup) {
  return Number(startup?.funding?.goal ?? startup?.fundingGoal ?? 0) || 0;
}

export function getFundingCurrent(startup) {
  return Number(startup?.funding?.current ?? startup?.amountRaised ?? 0) || 0;
}

export function getFundingPercent(startup) {
  const goal = getFundingGoal(startup);
  const current = getFundingCurrent(startup);

  if (!goal) {
    return 0;
  }

  return Math.min(Math.round((current / goal) * 100), 100);
}

export function getRemainingFunding(startup) {
  return Math.max(getFundingGoal(startup) - getFundingCurrent(startup), 0);
}
