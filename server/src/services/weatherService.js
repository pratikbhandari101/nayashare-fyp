const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm"
};

export async function fetchTodayWeather() {
  const latitude = 27.7172;
  const longitude = 85.324;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error("Failed to fetch weather");
    error.statusCode = response.status;
    throw error;
  }

  return {
    location: "Kathmandu, Nepal",
    temperature: data.current?.temperature_2m ?? null,
    condition: WEATHER_CODES[data.current?.weather_code] || "Weather unavailable",
    unit: data.current_units?.temperature_2m || "°C"
  };
}
