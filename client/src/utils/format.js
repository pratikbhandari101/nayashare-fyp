export function formatCurrency(value) {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value || 0);

  return `NPR ${amount}`;
}

export function formatTokens(value) {
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(value || 0) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value || 0);

  return `${amount} tokens`;
}

export function tokensToNpr(value) {
  return (value || 0) * 100;
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString();
}

export function startupImage(startup) {
  if (startup?.images?.[0]) {
    return startup.images[0];
  }

  return "/nayashare-fallback.png";
}
