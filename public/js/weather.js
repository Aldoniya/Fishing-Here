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
      
      // Update weather animation based on conditions
      updateWeatherAnimation(current.conditions);
      
      // Update weather icon
      updateWeatherIcon(current.conditions);
      
      // Load 7-day forecast
      const forecastRes = await fetch(`${window.App.API_URL}/weather/forecast`);
      const forecast = await forecastRes.json();
      
      renderForecast(forecast);
      renderHourlyForecast(forecast);
      
      // Render best fishing times
      renderFishingTimes();
      
      // Load fishing spots for spot weather
      const spotsRes = await fetch(`${window.App.API_URL}/fishing/spots`);
      const spots = await spotsRes.json();
      
      renderSpotWeather(spots);
      
    } catch (error) {
      console.error('Error loading weather data:', error);
      // Still render fishing times even if API fails
      renderFishingTimes();
    }
  }
  
  // Update weather animation background
  function updateWeatherAnimation(condition) {
    const bg = document.getElementById('weatherAnimationBg');
    if (!bg) return;
    
    bg.classList.remove('sunny', 'cloudy', 'rainy');
    
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      bg.classList.add('sunny');
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      bg.classList.add('rainy');
    } else {
      bg.classList.add('cloudy');
    }
  }
  
  // Update animated weather icon
  function updateWeatherIcon(condition) {
    const iconContainer = document.getElementById('weatherIconAnimated');
    if (!iconContainer) return;
    
    const lowerCondition = condition.toLowerCase();
    let iconClass = 'fa-cloud-sun';
    
    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      iconClass = 'fa-sun';
    } else if (lowerCondition.includes('rain')) {
      iconClass = 'fa-cloud-rain';
    } else if (lowerCondition.includes('cloud')) {
      iconClass = 'fa-cloud';
    } else if (lowerCondition.includes('night') || lowerCondition.includes('clear')) {
      iconClass = 'fa-moon';
    }
    
    iconContainer.innerHTML = `<i class="fas ${iconClass}"></i>`;
  }
  
  // Render best fishing times
  function renderFishingTimes() {
    const container = document.getElementById('fishingTimesContainer');
    if (!container) return;
    
    // Calculate fishing times based on current hour
    const now = new Date();
    const hour = now.getHours();
    
    // Define fishing time slots
    const timeSlots = [
      { start: 5, end: 8, label: 'Early Morning', desc: 'Best before sunrise', best: true },
      { start: 8, end: 11, label: 'Morning', desc: 'Good activity', best: false },
      { start: 11, end: 14, label: 'Midday', desc: 'Slow period', best: false },
      { start: 14, end: 17, label: 'Afternoon', desc: 'Picking up', best: false },
      { start: 17, end: 20, label: 'Evening', desc: 'Peak feeding', best: true },
      { start: 20, end: 23, label: 'Night', desc: 'Limited activity', best: false }
    ];
    
    // Determine current slot
    let currentSlot = 0;
    for (let i = 0; i < timeSlots.length; i++) {
      if (hour >= timeSlots[i].start && hour < timeSlots[i].end) {
        currentSlot = i;
        break;
      }
    }
    
    container.innerHTML = timeSlots.map((slot, index) => {
      const isCurrent = index === currentSlot;
      const rating = slot.best ? 5 : (slot.start >= 5 && slot.start <= 8 || slot.start >= 17 && slot.start <= 20) ? 4 : 3;
      
      return `
        <div class="fishing-time-slot ${slot.best ? 'best' : ''} ${isCurrent ? 'current' : ''}">
          <div class="time-range">${formatTime(slot.start)} - ${formatTime(slot.end)}</div>
          <div class="time-rating">
            ${Array(5).fill(0).map((_, i) => `<i class="fas fa-star ${i < rating ? 'filled' : ''}"></i>`).join('')}
          </div>
          <div class="time-desc">${slot.label}</div>
        </div>
      `;
    }).join('');
    
    // Update solunar data
    updateSolunarData();
  }
  
  // Format time
  function formatTime(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  }
  
  // Update solunar data
  function updateSolunarData() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    
    // Simple moon phase calculation
    const moonPhases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const phaseIndex = Math.floor(((day + month * 30) % 29.5) / 3.7) % 8;
    
    document.getElementById('moonPhase').textContent = moonPhases[phaseIndex];
    
    // Calculate major and minor periods (approximate)
    const sunriseTime = 6 + Math.floor(Math.random() * 15);
    const sunsetTime = 18 + Math.floor(Math.random() * 30);
    
    document.getElementById('majorPeriod').textContent = `${formatTime(sunriseTime)} - ${formatTime(sunriseTime + 2)}`;
    document.getElementById('minorPeriod').textContent = `${formatTime(sunsetTime)} - ${formatTime(sunsetTime + 2)}`;
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