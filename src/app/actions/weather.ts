"use server";

import { WeatherData } from "@/types/weather";

const API_KEY = "0431882dbe2347a8347a181f08dfae1d";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const LAT = "-34.426";
const LON = "-58.5796";
const LANG = "es";
const UNITS = "metric";

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const url = `${BASE_URL}?lat=${LAT}&lon=${LON}&appid=${API_KEY}&lang=${LANG}&units=${UNITS}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as WeatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

