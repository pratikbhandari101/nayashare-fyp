import { fetchTodayWeather } from "../services/weatherService.js";

export async function getTodayWeather(req, res) {
  try {
    const weather = await fetchTodayWeather();
    res.json(weather);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: "Failed to fetch weather"
    });
  }
}
