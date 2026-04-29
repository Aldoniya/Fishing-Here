// filepath: public/js/weather.js

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!window.App.isLoggedIn()) {
    window.location.href = '/login';
    return;
  }
  
  // Load weather data
  await loadWeatherData();
  
  // Logout handler
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.App.logout();
  });
  
  async function loadWeatherData() {
    try {
      // Load current weather
      const currentRes = await fetch(`${window.App.API_URL}/weather/current`);
      const current = await currentRes.json();
      
      document.getElementById('currentTemp').textContent = current.temperature;
      document.getElementById('currentCondition').textContent = current.conditions;
      document.getElementById('currentWind').textContent = `${current.wind_speed} km/h ${current.wind_direction}`;
      document.getElementById('currentHumidity').textContent = `${current.humidity}%`;
      document.getElementById('currentWave').textContent = '0.8m';
      document.getElementById('currentVisibility').textContent = `${current.visibility} km`;
      document.getElementById('currentUV').textContent = current.uv_index || '6';
      document.getElementById('currentSunrise').textContent = current.sunrise || '06:15';
      
      // Load 7-day forecast
      const forecastRes = await fetch(`${window.App.API_URL}/weather/forecast`);
      const forecast = await forecastRes.json();
      
      renderForecast(forecast);
      renderHourlyForecast(forecast);
      
      // Load fishing spots for spot weather
      const spotsRes = await fetch(`${window.App.API_URL}/fishing/spots`);
      const spots = await spotsRes.json();
      
      renderSpotWeather(spots);
      
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  }
  
  function renderForecast(forecast) {
    const forecastGrid = document.getElementById('forecastGrid');
    
    forecastGrid.innerHTML = forecast.map((day, index) => `
      <div class="forecast-card ${index === 0 ? 'today' : ''}">
        <div class="day">${index === 0 ? 'Today' : day.day}</div>
        <div class="icon">
          <i class="fas fa-${getWeatherIcon(day.conditions)}"></i>
        </div>
        <div class="temp-high">${day.temperature_high}°</div>
        <div class="temp-low">${day.temperature_low}°</div>
        <div class="condition">${day.conditions}</div>
        <div class="fishing-status ${getFishingStatus(day.fishing_conditions)}">
          <i class="fas fa-fish"></i>
          <span>${day.fishing_conditions}</span>
        </div>
      </div>
    `).join('');
  }
  
  function renderHourlyForecast(forecast) {
    const hourlyContainer = document.getElementById('hourlyContainer');
    const hours = ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
    const conditions = ['sun', 'cloud-sun', 'sun', 'cloud-sun', 'cloud', 'moon'];
    const temps = [26, 28, 30, 29, 27, 25];
    
    hourlyContainer.innerHTML = hours.map((hour, index) => `
      <div class="hourly-item">
        <div class="time">${hour}</div>
        <div class="icon">
          <i class="fas fa-${conditions[index]}"></i>
        </div>
        <div class="temp">${temps[index]}°C</div>
      </div>
    `).join('');
  }
  
  function renderSpotWeather(spots) {
    const spotWeatherGrid = document.getElementById('spotWeatherGrid');
    
    spotWeatherGrid.innerHTML = spots.slice(0, 6).map(spot => `
      <div class="spot-weather-card">
        <h4>${spot.name}</h4>
        <div class="spot-temp">${24 + Math.floor(Math.random() * 5)}°C</div>
        <div class="spot-condition">${['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)]}</div>
        <div class="spot-details">
          <span><i class="fas fa-wind"></i> ${3 + Math.floor(Math.random() * 5)} km/h</span>
          <span><i class="fas fa-water"></i> ${(0.5 + Math.random()).toFixed(1)}m</span>
        </div>
      </div>
    `).join('');
  }
  
  function getWeatherIcon(condition) {
    const icons = {
      'Sunny': 'sun',
      'Partly Cloudy': 'cloud-sun',
      'Cloudy': 'cloud',
      'Light Rain': 'cloud-rain',
      'Rain': 'cloud-showers-heavy'
    };
    return icons[condition] || 'cloud-sun';
  }
  
  function getFishingStatus(status) {
    if (status === 'Good') return 'good';
    if (status === 'Moderate') return 'moderate';
    return 'poor';
  }
});