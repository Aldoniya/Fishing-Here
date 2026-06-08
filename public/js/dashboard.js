// filepath: public/js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!window.App.isLoggedIn()) {
    window.location.href = '/login';
    return;
  }
  
  const user = window.App.getUser();
  const token = window.App.getToken();
  
  // Update user info
  document.getElementById('userName').textContent = user?.username || 'User';
  document.getElementById('welcomeName').textContent = user?.username || 'Fisherman';
  
  // Load dashboard data
  await loadDashboardData();
  
  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    window.App.logout();
  });
  
  // Comment modal
  const commentModal = document.getElementById('commentModal');
  const addCommentBtn = document.getElementById('addCommentBtn');
  
  if (addCommentBtn) {
    addCommentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      commentModal.classList.add('show');
    });
  }
  
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      commentModal.classList.remove('show');
    });
  });
  
  // Comment form submission
  const commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const subject = document.getElementById('commentSubject').value;
      const message = document.getElementById('commentMessage').value;
      
      try {
        const response = await fetch(`${window.App.API_URL}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subject, message })
        });
        
        if (response.ok) {
          alert('Comment sent to admin successfully!');
          commentModal.classList.remove('show');
          commentForm.reset();
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to send comment');
        }
      } catch (error) {
        alert('Network error. Please try again.');
      }
    });
  }
  
  // Find nearby spots
  document.getElementById('findNearbyBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/map';
  });
  
  // View routes
  document.getElementById('viewRoutesBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/map';
  });
  
  // Load dashboard data function
  async function loadDashboardData() {
    try {
      // Fetch ocean convergence zones
      const zonesRes = await fetch(`${window.App.API_URL}/fishing/zones`);
      const zones = await zonesRes.json();
      
      // Display convergence zones with fish recommendations
      const zonesContainer = document.getElementById('zonesContainer');
      if (zonesContainer) {
        zonesContainer.innerHTML = zones.map(zone => `
          <div class="zone-card">
            <div class="zone-header">
              <h4>${zone.name}</h4>
              <span class="zone-type">${zone.fishing_zone}</span>
            </div>
            <div class="zone-details">
              <div class="zone-detail-item">
                <i class="fas fa-fish"></i>
                <span><strong>Fish Species:</strong> ${zone.recommended_species || zone.fish_type}</span>
              </div>
              <div class="zone-detail-item">
                <i class="fas fa-thermometer-half"></i>
                <span><strong>SST:</strong> ${zone.sea_surface_temp}°C</span>
              </div>
              <div class="zone-detail-item">
                <i class="fas fa-vial"></i>
                <span><strong>Chlorophyll-a:</strong> ${zone.chlorophyll_a} mg/m³</span>
              </div>
              <div class="zone-detail-item">
                <i class="fas fa-star"></i>
                <span><strong>Fishing Score:</strong> ${zone.fishing_score}/100</span>
              </div>
              <div class="zone-detail-item">
                <i class="fas fa-water"></i>
                <span><strong>Best Season:</strong> ${zone.best_season}</span>
              </div>
            </div>
          </div>
        `).join('');
      }
      
      // Fetch fishing spots
      const spotsRes = await fetch(`${window.App.API_URL}/fishing/spots/daily`);
      const spots = await spotsRes.json();
      
      document.getElementById('totalSpots').textContent = spots.length;
      
      // Display popular spots
      const spotsGrid = document.getElementById('spotsGrid');
      if (spotsGrid) {
        spotsGrid.innerHTML = spots.slice(0, 4).map(spot => `
          <div class="spot-card">
            <h4>${spot.name}</h4>
            <p>${spot.fish_type || 'Various fish'}</p>
            <div class="spot-meta">
              <span><i class="fas fa-calendar"></i> ${spot.best_season || 'Year-round'}</span>
              <span><i class="fas fa-ruler-vertical"></i> ${spot.depth || '-'}m</span>
            </div>
          </div>
        `).join('');
      }
      
      // Fetch weather forecast
      const forecastRes = await fetch(`${window.App.API_URL}/weather/forecast`);
      const forecast = await forecastRes.json();
      
      // Display forecast preview
      const forecastDays = document.getElementById('forecastDays');
      if (forecastDays) {
        forecastDays.innerHTML = forecast.slice(0, 5).map(day => `
          <div class="forecast-day">
            <div class="day-name">${day.day}</div>
            <div class="day-icon">
              <i class="fas fa-${getWeatherIcon(day.conditions)}"></i>
            </div>
            <div class="day-temp">${day.temperature_high}°</div>
            <div class="day-condition">${day.conditions}</div>
          </div>
        `).join('');
      }
      
      // Fetch user comments
      const commentsRes = await fetch(`${window.App.API_URL}/comments/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const comments = await commentsRes.json();
      document.getElementById('totalComments').textContent = comments.length;
      
      // Fetch user routes (if available)
      const routesRes = await fetch(`${window.App.API_URL}/fishing/routes`);
      const routes = await routesRes.json();
      document.getElementById('totalRoutes').textContent = routes.length;
      
      // Set last visit
      if (user?.last_login) {
        document.getElementById('lastVisit').textContent = window.App.formatRelativeTime(user.last_login);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }
  
  // Weather icon helper
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
});