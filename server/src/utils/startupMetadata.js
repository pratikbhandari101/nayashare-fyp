import { NEPAL_LOCATION_TREE } from "../data/startupMetadata.js";

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

export function normalizeOptionalStructuredValue(value, fallback = "") {
  const normalized = normalizeStructuredValue(value);
  return normalized || fallback;
}

export function createNepalLocationIndex() {
  return NEPAL_LOCATION_TREE.map((provinceEntry) => ({
    province: normalizeStructuredValue(provinceEntry.province),
    districts: provinceEntry.districts.map((districtEntry) => ({
      district: normalizeStructuredValue(districtEntry.district),
      cities: districtEntry.cities.map((city) => normalizeStructuredValue(city))
    }))
  }));
}

const nepalLocationIndex = createNepalLocationIndex();

export function isValidProvince(province) {
  if (!province) {
    return true;
  }

  return nepalLocationIndex.some((entry) => entry.province === province);
}

export function isValidDistrictForProvince(province, district) {
  if (!district) {
    return true;
  }

  const provinceEntry = nepalLocationIndex.find((entry) => entry.province === province);
  return Boolean(provinceEntry?.districts.some((entry) => entry.district === district));
}

export function isValidCityForDistrict(province, district, city) {
  if (!city) {
    return true;
  }

  const provinceEntry = nepalLocationIndex.find((entry) => entry.province === province);
  const districtEntry = provinceEntry?.districts.find((entry) => entry.district === district);
  return Boolean(districtEntry?.cities.includes(city));
}
