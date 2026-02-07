import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface WeatherData {
  temperature: number | null;
  wind: number | null;
  humidity: number | null;
  loading: boolean;
  error: boolean;
  weatherCode: number | null;
}

export function useWeather(latitude = 30.72, longitude = -97.93): WeatherData {
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [wind, setWind] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto&temperature_unit=fahrenheit`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const currentHour = new Date(data.current_weather.time).getHours();
        const humidityIndex = data.hourly.time.findIndex((t: string) =>
          new Date(t).getHours() === currentHour
        );

        setTemperature(data.current_weather.temperature);
        setWind(data.current_weather.windspeed);
        setHumidity(data.hourly.relative_humidity_2m[humidityIndex]);
        setWeatherCode(data.current_weather.weathercode);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [latitude, longitude]);

  return { temperature, wind, humidity, loading, error, weatherCode };
}

export function useWeatherDescription(code: number): string {
  const { t } = useTranslation();
  return t(`weather.${code}`, { defaultValue: t("weather.unknown") });
}

export function getWeatherEmoji(code: number): string {
  if ([0, 1].includes(code)) return '☀️'; // clear
  if ([2, 3].includes(code)) return '⛅'; // partly cloudy
  if ([45, 48].includes(code)) return '🌫️'; // fog
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️'; // rain
  if ([71, 73, 75, 85, 86].includes(code)) return '❄️'; // snow
  if ([95, 96, 99].includes(code)) return '⛈️'; // thunder
  return '❓';
}