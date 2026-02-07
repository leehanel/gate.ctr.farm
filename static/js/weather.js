/* ── Weather Widget ── */

function getWeatherEmoji(code) {
    if ([0, 1].indexOf(code) !== -1) return '☀️';
    if ([2, 3].indexOf(code) !== -1) return '⛅';
    if ([45, 48].indexOf(code) !== -1) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].indexOf(code) !== -1) return '🌧️';
    if ([71, 73, 75, 85, 86].indexOf(code) !== -1) return '❄️';
    if ([95, 96, 99].indexOf(code) !== -1) return '⛈️';
    return '❓';
}

var _weatherCode = null;

function initWeather(lat, lon) {
    lat = lat || 30.72;
    lon = lon || -97.93;

    var url = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude=' + lat
        + '&longitude=' + lon
        + '&current_weather=true'
        + '&hourly=relative_humidity_2m'
        + '&timezone=auto'
        + '&wind_speed_unit=mph'
        + '&temperature_unit=fahrenheit'
        + '&precipitation_unit=inch';

    fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            var currentHour = new Date(data.current_weather.time).getHours();
            var humidityIndex = data.hourly.time.findIndex(function(t) {
                return new Date(t).getHours() === currentHour;
            });

            var temp = data.current_weather.temperature;
            var wind = data.current_weather.windspeed;
            var humidity = data.hourly.relative_humidity_2m[humidityIndex];
            _weatherCode = data.current_weather.weathercode;

            document.getElementById('weather-loading').classList.add('hidden');
            var weatherData = document.getElementById('weather-data');
            weatherData.classList.remove('hidden');
            weatherData.style.display = 'flex';

            document.getElementById('weather-temp').textContent = temp + '°F';
            document.getElementById('weather-desc').textContent =
                t('weather.' + _weatherCode, t('weather.unknown'));
            document.getElementById('weather-wind').textContent = wind;
            document.getElementById('weather-humidity').textContent = humidity;
            document.getElementById('weather-emoji').textContent = getWeatherEmoji(_weatherCode);
        })
        .catch(function() {
            document.getElementById('weather-loading').textContent = 'Weather unavailable';
        });
}

/* Re-translate the weather description when language changes */
window.addEventListener('languageChanged', function() {
    if (_weatherCode !== null) {
        var desc = document.getElementById('weather-desc');
        if (desc) {
            desc.textContent = t('weather.' + _weatherCode, t('weather.unknown'));
        }
    }
});
