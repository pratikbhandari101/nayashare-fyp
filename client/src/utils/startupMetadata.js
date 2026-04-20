import { CATEGORY_OPTIONS, INDUSTRY_OPTIONS, NEPAL_LOCATION_TREE } from "../data/startupMetadata.js";

export function normalizeStructuredValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ");
}

function titleCaseWord(word) {
  if (!word) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

function fallbackLabel(value) {
  return normalizeStructuredValue(value)
    .split(" ")
    .map((part) => {
      if (part === "/") {
        return "/";
      }

      return part
        .split("-")
        .map((segment) => titleCaseWord(segment))
        .join("-");
    })
    .join(" ");
}

const optionLabelMap = new Map(
  [...CATEGORY_OPTIONS, ...INDUSTRY_OPTIONS].map((option) => [option.value, option.label])
);

for (const province of NEPAL_LOCATION_TREE) {
  optionLabelMap.set(province.value, province.label);

  for (const district of province.districts) {
    optionLabelMap.set(district.value, district.label);

    for (const city of district.cities) {
      optionLabelMap.set(city.value, city.label);
    }
  }
}

export function formatStructuredValue(value, fallback = "") {
  const normalized = normalizeStructuredValue(value);

  if (!normalized) {
    return fallback;
  }

  return optionLabelMap.get(normalized) || fallbackLabel(normalized);
}
