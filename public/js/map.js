// filepath: public/js/map.js

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!window.App.isLoggedIn()) {
    window.location.href = '/login';
    return;
  }
  
  // Initialize map
  const map = L.map('map', { zoomControl: false }).setView([-6.1659, 39.1989], 11);
  
  const baseLayers = {
    openstreet: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }),
    topographic: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
    }),
    ocean: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri Ocean Basemap'
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri World Imagery'
    })
  };
  
  let currentBaseLayerKey = 'openstreet';
  let currentBaseLayer = baseLayers[currentBaseLayerKey];
  currentBaseLayer.addTo(map);
  
  // Custom fishing marker icon
  const fishingIcon = L.divIcon({
    className: 'custom-marker',
    html: '<i class="fas fa-fish-fins"></i>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
  
  let spots = [];
  let selectedSpot = null;
  let userLocation = null;
  let routeLine = null;
  let userMarker = null;
  let chlorophyllLayer = null;
  let sstLayer = null;
  let dataLayerActive = null;
  
  // Load fishing spots
  await loadFishingSpots();
  
  // Load spots into sidebar list
  function renderSpotsList() {
    const spotsList = document.getElementById('spotsList');
    spotsList.innerHTML = spots.map(spot => `
      <div class="spot-list-item" data-id="${spot.id}">
        <h4>${spot.name}</h4>
        <p>${spot.fish_type || 'Various fish'}</p>
        <div class="spot-zone">${spot.fishing_zone || 'Fishing hotspot'}</div>
        <div class="spot-info">
          <span><i class="fas fa-ruler-vertical"></i> ${spot.depth || '-'}m</span>
          <span><i class="fas fa-shield-alt"></i> ${spot.safety_level || 'Good'}</span>
        </div>
        <div class="spot-info spot-metrics">
          <span><i class="fas fa-temperature-high"></i> ${spot.sea_surface_temp || '-'}°C</span>
          <span><i class="fas fa-vial"></i> ${spot.chlorophyll_a || '-'} mg/m³</span>
          <span><i class="fas fa-star"></i> ${spot.fishing_score || '-'} / 100</span>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.spot-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const spotId = parseInt(item.dataset.id);
        selectSpot(spotId);
      });
    });
  }
  
  // Add markers to map
  function addMarkersToMap() {
    spots.forEach(spot => {
      const marker = L.marker([spot.latitude, spot.longitude], { icon: fishingIcon })
        .addTo(map)
        .bindPopup(`
          <div class="fishing-popup">
            <h4>${spot.name}</h4>
            <p>${spot.description || ''}</p>
            <p><strong>Fish:</strong> ${spot.fish_type || 'Various'}</p>
            <div class="popup-meta">
              <span><i class="fas fa-calendar"></i> ${spot.best_season || 'Year-round'}</span>
              <span><i class="fas fa-ruler-vertical"></i> ${spot.depth || '-'}m</span>
            </div>
            <div class="popup-meta">
              <span><i class="fas fa-temperature-high"></i> ${spot.sea_surface_temp || '-'}°C</span>
              <span><i class="fas fa-vial"></i> ${spot.chlorophyll_a || '-'} mg/m³</span>
            </div>
            <div class="popup-meta">
              <span><i class="fas fa-water"></i> ${spot.fishing_zone || 'Ocean hotspot'}</span>
              <span><i class="fas fa-satellite"></i> ${spot.sst_source || 'Aqua MODIS SST'}</span>
            </div>
            <div class="popup-meta">
              <span><i class="fas fa-star"></i> Score ${spot.fishing_score || '-'}/100</span>
            </div>
          </div>
        `);
      
      marker.on('click', () => {
        selectSpot(spot.id);
      });
    });
  }
  
  function setupSatelliteDataLayers() {
    const time = new Date().toISOString().split('T')[0];

    chlorophyllLayer = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3m_CHL_chlor_a/default/${time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`, {
      attribution: 'Chlorophyll A data from Sentinel-3 / MODIS via NASA GIBS',
      opacity: 0.65
    });

    sstLayer = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Aqua_MODIS_L3_SST/default/${time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`, {
      attribution: 'Sea Surface Temperature from Aqua MODIS via NASA GIBS',
      opacity: 0.65
    });

    dataLayerActive = null;
  }

  function renderZoneList() {
    const zoneList = document.getElementById('zonesList');
    const zones = spots
      .filter(spot => spot.convergence_index >= 65)
      .sort((a, b) => b.convergence_index - a.convergence_index)
      .slice(0, 5);

    zoneList.innerHTML = zones.map(zone => `
      <div class="zone-item" data-id="${zone.id}">
        <h4>${zone.name}</h4>
        <p>${zone.fishing_zone}</p>
        <span><strong>Fish:</strong> ${zone.fish_type}</span>
        <span><strong>Score:</strong> ${zone.fishing_score}/100</span>
      </div>
    `).join('');

    document.querySelectorAll('.zone-item').forEach(item => {
      item.addEventListener('click', () => selectSpot(parseInt(item.dataset.id)));
    });
  }

  function toggleDataLayer() {
    if (!chlorophyllLayer || !sstLayer) return;

    if (!dataLayerActive) {
      chlorophyllLayer.addTo(map);
      dataLayerActive = 'chlorophyll';
      document.getElementById('toggleLayer').title = 'Show SST overlay';
    } else if (dataLayerActive === 'chlorophyll') {
      map.removeLayer(chlorophyllLayer);
      sstLayer.addTo(map);
      dataLayerActive = 'sst';
      document.getElementById('toggleLayer').title = 'Show chlorophyll overlay';
    } else {
      map.removeLayer(sstLayer);
      dataLayerActive = null;
      document.getElementById('toggleLayer').title = 'Show ocean data overlay';
    }
  }

  function switchBaseLayer(key) {
    if (!baseLayers[key]) return;
    map.removeLayer(currentBaseLayer);
    currentBaseLayer = baseLayers[key];
    currentBaseLayer.addTo(map);
    currentBaseLayerKey = key;
    document.querySelectorAll('.base-layer-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layer === key);
    });
    document.getElementById('toggleBaseLayer').title = `Base map: ${key}`;
  }

  function updateRouteFromDashboard() {
    const routeRequest = localStorage.getItem('dashboardRouteRequest');
    if (!routeRequest) return;
    localStorage.removeItem('dashboardRouteRequest');

    if (routeRequest === 'best-ocean-route') {
      if (!('geolocation' in navigator)) {
        alert('Location is required to display your route.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.latitude, position.coords.longitude];
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<i class="fas fa-user"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker(userLocation, { icon: userIcon })
            .addTo(map)
            .bindPopup('You are here');

          const oceanSpots = spots.filter(spot => spot.accessibility?.toLowerCase().includes('boat'));
          const bestSpot = oceanSpots.sort((a, b) => b.fishing_score - a.fishing_score)[0];
          if (!bestSpot) {
            alert('No ocean fishing spots available.');
            return;
          }

          selectSpot(bestSpot.id);
          calculateRoute(userLocation, [bestSpot.latitude, bestSpot.longitude]);
        },
        () => {
          alert('Cannot get your location. Please allow location access to view the route.');
        }
      );
    }
  }
  
  // Select a spot
  async function selectSpot(spotId) {
    selectedSpot = spots.find(s => s.id === spotId);
    if (!selectedSpot) return;
    
    // Update sidebar
    document.getElementById('spotName').textContent = selectedSpot.name;
    document.getElementById('spotFish').textContent = selectedSpot.fish_type || 'Various';
    document.getElementById('spotSeason').textContent = selectedSpot.best_season || 'Year-round';
    document.getElementById('spotDepth').textContent = selectedSpot.depth ? `${selectedSpot.depth}m` : 'N/A';
    document.getElementById('spotAccess').textContent = selectedSpot.accessibility || 'Boat';
    document.getElementById('spotSafety').textContent = selectedSpot.safety_level || 'Good';
    document.getElementById('spotTemp').textContent = selectedSpot.sea_surface_temp ? `${selectedSpot.sea_surface_temp}°C` : 'N/A';
    document.getElementById('spotChlorophyll').textContent = selectedSpot.chlorophyll_a ? `${selectedSpot.chlorophyll_a} mg/m³` : 'N/A';
    document.getElementById('spotScore').textContent = selectedSpot.fishing_score ? `Score ${selectedSpot.fishing_score}/100` : 'Score N/A';
    
    // Update fishing conditions
    const fishingCondition = getFishingCondition(selectedSpot);
    document.getElementById('spotFishingCondition').textContent = fishingCondition;
    
    document.getElementById('selectedSpot').style.display = 'block';
    
    // Highlight in list
    document.querySelectorAll('.spot-list-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.id) === spotId);
    });
    
    // Fetch weather for this spot
    await loadSpotWeather(selectedSpot);
    
    // Pan to spot
    map.flyTo([selectedSpot.latitude, selectedSpot.longitude], 13);

    // If origin already known, show the route immediately
    if (userLocation) {
      calculateRoute(userLocation, [selectedSpot.latitude, selectedSpot.longitude]);
    }
  }
  
  // Load spot weather
  async function loadSpotWeather(spot) {
    try {
      const res = await fetch(`${window.App.API_URL}/weather/coords?lat=${spot.latitude}&lng=${spot.longitude}`);
      const weather = await res.json();
      
      document.getElementById('spotWeather').innerHTML = `
        <div class="weather-mini-item">
          <i class="fas fa-thermometer-half"></i>
          <span>${weather.temperature}°C</span>
        </div>
        <div class="weather-mini-item">
          <i class="fas fa-wind"></i>
          <span>${weather.wind_speed} km/h</span>
        </div>
        <div class="weather-mini-item">
          <i class="fas fa-water"></i>
          <span>${weather.wave_height?.toFixed(1)}m</span>
        </div>
        <div class="weather-mini-item">
          <i class="fas fa-water"></i>
          <span>${weather.conditions || 'Clear'}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error loading spot weather:', error);
    }
  }
  
  // Get route to spot
  document.getElementById('getRoute').addEventListener('click', () => {
    if (!selectedSpot || !userLocation) {
      alert('Please enable location services to get directions');
      return;
    }
    
    calculateRoute(userLocation, [selectedSpot.latitude, selectedSpot.longitude]);
  });
  
  // Decode OSRM polyline format
  function decodePolyline(encoded) {
    const poly = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let result = 0, shift = 0, b;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
      result = 0;
      shift = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
      poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
  }

  // Generate turn-by-turn directions from OSRM route steps
  function generateSteps(legs, destination) {
    if (!legs || legs.length === 0) {
      return [
        { icon: 'fa-play', text: 'Start from your location', distance: '0 m' },
        { icon: 'fa-ship', text: `Navigate towards ${destination}`, distance: 'En route' },
        { icon: 'fa-flag-checkered', text: 'Arrive at fishing spot', distance: 'Destination' }
      ];
    }
    const steps = [{ icon: 'fa-play', text: 'Start from your location', distance: '0 m' }];
    legs.forEach((leg) => {
      const distance = leg.distance < 1000 ? `${leg.distance.toFixed(0)} m` : `${(leg.distance / 1000).toFixed(1)} km`;
      const instruction = leg.name ? `Head towards ${leg.name}` : 'Continue navigation';
      steps.push({ icon: 'fa-route', text: instruction, distance: distance });
    });
    steps.push({ icon: 'fa-flag-checkered', text: `Arrive at ${destination}`, distance: 'End' });
    return steps;
  }

  // Add or update the user's moving marker on the map
  function addOrUpdateUserMarker(position) {
    const [lat, lng] = position;
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<i class="fas fa-user"></i>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (userMarker) {
      userMarker.setLatLng(position);
    } else {
      userMarker = L.marker(position, { icon: userIcon })
        .addTo(map)
        .bindPopup('You are here');
    }
  }

  // Update remaining distance/time and keep the map centered on the user's moving location
  function updateRouteProgress(currentLoc, destination) {
    const remainingDistance = calculateDistance(currentLoc[0], currentLoc[1], destination[0], destination[1]);
    const remainingTime = Math.round(remainingDistance / 30 * 60);
    document.getElementById('routeDistance').textContent = `${remainingDistance.toFixed(1)} km remaining`;
    document.getElementById('routeTime').textContent = `${remainingTime} min remaining`;

    addOrUpdateUserMarker(currentLoc);
    if (routeLine) {
      const currentBounds = routeLine.getBounds();
      if (!currentBounds.contains(currentLoc)) {
        map.panTo(currentLoc);
      }
    } else {
      map.panTo(currentLoc);
    }
  }

  function startNavigationWatch(end) {
    if (!('geolocation' in navigator)) return;

    if (routeWatchId !== null) {
      navigator.geolocation.clearWatch(routeWatchId);
      routeWatchId = null;
    }

    routeWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLoc = [position.coords.latitude, position.coords.longitude];
        userLocation = currentLoc;
        addOrUpdateUserMarker(currentLoc);
        updateRouteProgress(currentLoc, end);
      },
      (error) => {
        console.warn('Navigation tracking error:', error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  let routeWatchId = null;

  // Calculate route using OSRM API with real-time tracking
  async function calculateRoute(start, end) {
    const routePanel = document.getElementById('routePanel');
    document.getElementById('routeDestination').textContent = selectedSpot.name;

    try {
      // Stop any existing position tracking
      if (routeWatchId !== null) {
        navigator.geolocation.clearWatch(routeWatchId);
        routeWatchId = null;
      }

      // Get actual route from OSRM API
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&steps=true`;
      const routeResponse = await fetch(osrmUrl);
      const routeData = await routeResponse.json();

      if (!routeData.routes || routeData.routes.length === 0) {
        // Fallback to simple calculation if API fails
        const distance = calculateDistance(start[0], start[1], end[0], end[1]);
        const time = Math.round(distance / 30 * 60);
        document.getElementById('routeDistance').textContent = `${distance.toFixed(1)} km`;
        document.getElementById('routeTime').textContent = `${time} min`;

        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline([start, end], {
          color: '#0077b6',
          weight: 4,
          dashArray: '4,8',
          opacity: 0.8
        }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        document.getElementById('routeSteps').innerHTML = `
          <div class="route-step">
            <span class="step-icon"><i class="fas fa-play"></i></span>
            <span class="step-text">Start from your current location</span>
            <span class="step-meta" style="font-size:11px;color:#999;">0 m</span>
          </div>
          <div class="route-step">
            <span class="step-icon"><i class="fas fa-route"></i></span>
            <span class="step-text">Head towards your selected fishing spot</span>
            <span class="step-meta" style="font-size:11px;color:#999;">${distance.toFixed(1)} km</span>
          </div>
          <div class="route-step">
            <span class="step-icon"><i class="fas fa-flag-checkered"></i></span>
            <span class="step-text">Arrive at ${selectedSpot.name}</span>
            <span class="step-meta" style="font-size:11px;color:#999;">Destination</span>
          </div>
        `;

        startNavigationWatch(end);
      } else {
        const route = routeData.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        document.getElementById('routeDistance').textContent = `${distanceKm} km`;
        document.getElementById('routeTime').textContent = `${durationMin} min`;

        // Decode and draw polyline on map
        const coords = route.geometry?.coordinates
          ? route.geometry.coordinates.map(coord => [coord[1], coord[0]])
          : decodePolyline(route.geometry);
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline(coords, {
          color: '#0077b6',
          weight: 4,
          opacity: 0.8
        }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        // Generate turn-by-turn steps from route
        const steps = generateSteps(route.legs[0].steps, selectedSpot.name);
        document.getElementById('routeSteps').innerHTML = steps.map(step => `
          <div class="route-step">
            <span class="step-icon"><i class="fas ${step.icon}"></i></span>
            <span class="step-text">${step.text}</span>
            <span class="step-meta" style="font-size:11px;color:#999;">${step.distance}</span>
          </div>
        `).join('');

        startNavigationWatch(end);
      }

      // Display destination coordinates and conditions
      document.getElementById('routeLat').textContent = end[0].toFixed(6);
      document.getElementById('routeLng').textContent = end[1].toFixed(6);
      document.getElementById('routeSeaTemp').textContent = selectedSpot.sea_surface_temp ? `SST: ${selectedSpot.sea_surface_temp}°C` : 'SST: -';
      document.getElementById('routeChlorophyll').textContent = selectedSpot.chlorophyll_a ? `Chl-a: ${selectedSpot.chlorophyll_a} mg/m³` : 'Chl-a: -';
      document.getElementById('routeScore').textContent = selectedSpot.fishing_score ? `Score: ${selectedSpot.fishing_score}/100` : 'Score: -';

      routePanel.style.display = 'block';
      routePanel.style.opacity = '0';
      setTimeout(() => {
        routePanel.style.transition = 'opacity 0.3s ease-in-out';
        routePanel.style.opacity = '1';
      }, 10);
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback to simple calculation on API error
      const distance = calculateDistance(start[0], start[1], end[0], end[1]);
      const time = Math.round(distance / 30 * 60);
      document.getElementById('routeDistance').textContent = `${distance.toFixed(1)} km`;
      document.getElementById('routeTime').textContent = `${time} min`;

      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline([start, end], {
        color: '#0077b6',
        weight: 4,
        dashArray: '4,8',
        opacity: 0.8
      }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

      document.getElementById('routeSteps').innerHTML = `
        <div class="route-step">
          <span class="step-icon"><i class="fas fa-play"></i></span>
          <span class="step-text">Start from your current location</span>
          <span class="step-meta" style="font-size:11px;color:#999;">0 m</span>
        </div>
        <div class="route-step">
          <span class="step-icon"><i class="fas fa-route"></i></span>
          <span class="step-text">Head towards your selected fishing spot</span>
          <span class="step-meta" style="font-size:11px;color:#999;">${distance.toFixed(1)} km</span>
        </div>
        <div class="route-step">
          <span class="step-icon"><i class="fas fa-flag-checkered"></i></span>
          <span class="step-text">Arrive at ${selectedSpot.name}</span>
          <span class="step-meta" style="font-size:11px;color:#999;">Destination</span>
        </div>
      `;

      document.getElementById('routeLat').textContent = end[0].toFixed(6);
      document.getElementById('routeLng').textContent = end[1].toFixed(6);
      document.getElementById('routeSeaTemp').textContent = selectedSpot.sea_surface_temp ? `SST: ${selectedSpot.sea_surface_temp}°C` : 'SST: -';
      document.getElementById('routeChlorophyll').textContent = selectedSpot.chlorophyll_a ? `Chl-a: ${selectedSpot.chlorophyll_a} mg/m³` : 'Chl-a: -';
      document.getElementById('routeScore').textContent = selectedSpot.fishing_score ? `Score: ${selectedSpot.fishing_score}/100` : 'Score: -';
      routePanel.style.display = 'block';
      startNavigationWatch(end);
    }
  }
  
  // Calculate distance between two points
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Get fishing condition based on spot details
  function getFishingCondition(spot) {
    const season = spot.best_season?.toLowerCase() || '';
    const safety = spot.safety_level?.toLowerCase() || 'good';
    const depth = spot.depth || 0;
    const temp = spot.sea_surface_temp || 0;
    const chlorophyll = spot.chlorophyll_a || 0;
    
    let details = [];
    
    // Check season
    if (season.includes('year-round') || season.includes('all')) {
      details.push('Year-round productive waters');
    } else if (season) {
      details.push(`Best: ${spot.best_season}`);
    }
    
    // Check safety
    if (safety.includes('excellent') || safety.includes('good')) {
      details.push('Safe for boats');
    } else if (safety.includes('moderate')) {
      details.push('Moderate conditions');
    }
    
    // Check depth for fishing type
    if (depth < 20) {
      details.push('Shallow water');
    } else if (depth < 50) {
      details.push('Medium depth');
    } else {
      details.push('Deep water');
    }
    
    // Use SST and chlorophyll to refine recommendations
    if (temp) {
      if (temp >= 26 && temp <= 29) {
        details.push('Good warm surface temperature');
      } else {
        details.push('Cooler or warmer surface water');
      }
    }
    
    if (chlorophyll) {
      if (chlorophyll >= 0.18) {
        details.push('High chlorophyll - strong food source');
      } else {
        details.push('Moderate chlorophyll levels');
      }
    }
    
    return `Best Fishing: ${details.join(', ')}`;
  }
  
  // Close route panel
  document.querySelector('.close-route').addEventListener('click', () => {
    document.getElementById('routePanel').style.display = 'none';
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
  });
  
  // Close spot details
  document.querySelector('.close-spot').addEventListener('click', () => {
    document.getElementById('selectedSpot').style.display = 'none';
    document.querySelectorAll('.spot-list-item').forEach(item => {
      item.classList.remove('active');
    });
    selectedSpot = null;
  });
  
  // Find nearby spots
  document.getElementById('findNearby').addEventListener('click', () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.latitude, position.coords.longitude];
          
          // Add user marker
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<i class="fas fa-user"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          L.marker(userLocation, { icon: userIcon })
            .addTo(map)
            .bindPopup('You are here');
          
          map.flyTo(userLocation, 12);
          
          // Sort spots by nearest distance and show the closest ocean point
          const nearby = spots
            .map(spot => ({
              spot,
              distance: calculateDistance(userLocation[0], userLocation[1], spot.latitude, spot.longitude)
            }))
            .sort((a, b) => a.distance - b.distance);

          if (nearby.length > 0) {
            selectSpot(nearby[0].spot.id);
            alert(`Nearest ocean spot is ${nearby[0].distance.toFixed(1)} km away. Showing the best location for today.`);
          } else {
            alert('No ocean fishing spots available right now.');
          }
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  });
  
  // Map controls
  document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
  document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
  
  document.getElementById('locateMe').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = [position.coords.latitude, position.coords.longitude];
          map.flyTo(loc, 14);
        },
        () => alert('Unable to get location')
      );
    }
  });
  
  document.getElementById('toggleLayer').addEventListener('click', toggleDataLayer);
  document.getElementById('toggleBaseLayer')?.addEventListener('click', () => {
    document.getElementById('baseLayerMenu').classList.toggle('show');
  });

  document.querySelectorAll('.base-layer-option').forEach(btn => {
    btn.addEventListener('click', () => {
      switchBaseLayer(btn.dataset.layer);
      document.getElementById('baseLayerMenu').classList.remove('show');
    });
  });
  
  // Search spots
  document.getElementById('spotSearch').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = spots.filter(spot => 
      spot.name.toLowerCase().includes(query) ||
      (spot.fish_type && spot.fish_type.toLowerCase().includes(query))
    );
    
    document.getElementById('spotsList').innerHTML = filtered.map(spot => `
      <div class="spot-list-item" data-id="${spot.id}">
        <h4>${spot.name}</h4>
        <p>${spot.fish_type || 'Various fish'}</p>
        <div class="spot-info">
          <span><i class="fas fa-ruler-vertical"></i> ${spot.depth || '-'}m</span>
          <span><i class="fas fa-shield-alt"></i> ${spot.safety_level || 'Good'}</span>
        </div>
      </div>
    `).join('');
    
    document.querySelectorAll('.spot-list-item').forEach(item => {
      item.addEventListener('click', () => {
        selectSpot(parseInt(item.dataset.id));
      });
    });
  });
  
  // Start navigation
  document.getElementById('startNavigation').addEventListener('click', () => {
    if (!selectedSpot) {
      alert('Please select a fishing destination first.');
      return;
    }

    if (!userLocation) {
      if (!('geolocation' in navigator)) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = [position.coords.latitude, position.coords.longitude];
          calculateRoute(userLocation, [selectedSpot.latitude, selectedSpot.longitude]);
        },
        () => {
          alert('Unable to get your location. Please allow location services.');
        }
      );

      return;
    }

    calculateRoute(userLocation, [selectedSpot.latitude, selectedSpot.longitude]);
  });

  // Save route
  document.getElementById('saveRoute').addEventListener('click', async () => {
    const token = window.App.getToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${window.App.API_URL}/fishing/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `Route to ${selectedSpot.name}`,
          start_lat: userLocation[0],
          start_lng: userLocation[1],
          end_lat: selectedSpot.latitude,
          end_lng: selectedSpot.longitude,
          distance: parseFloat(document.getElementById('routeDistance').textContent),
          estimated_time: parseInt(document.getElementById('routeTime').textContent)
        })
      });
      
      if (response.ok) {
        alert('Route saved successfully!');
      }
    } catch (error) {
      alert('Failed to save route');
    }
  });
  
  // Load fishing spots from API
  async function loadFishingSpots() {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`${window.App.API_URL}/fishing/spots/daily?date=${date}`);
      spots = await res.json();
      renderSpotsList();
      addMarkersToMap();
      setupSatelliteDataLayers();
      renderZoneList();
      updateRouteFromDashboard();
    } catch (error) {
      console.error('Error loading spots:', error);
    }
  }
});