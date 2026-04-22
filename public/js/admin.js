// filepath: public/js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = window.App.getToken();
  const user = window.App.getUser();
  
  // Check if admin
  if (!token || user?.role !== 'admin') {
    window.location.href = '/login';
    return;
  }
  
  document.getElementById('adminName').textContent = user?.username || 'Admin';
  
  // Load admin data
  await loadDashboardStats();
  await loadUsers();
  await loadFishingSpots();
  await loadComments();
  await loadActivity();
  
  // Navigation
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (section) {
        showSection(section);
      }
    });
  });
  
  // Logout
  document.getElementById('adminLogout').addEventListener('click', () => {
    window.App.logout();
  });
  
  // Add spot modal
  const spotModal = document.getElementById('spotModal');
  document.getElementById('addSpotBtn')?.addEventListener('click', () => {
    spotModal.classList.add('show');
  });
  
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      spotModal.classList.remove('show');
      document.getElementById('respondModal').classList.remove('show');
    });
  });
  
  // Spot form submission
  document.getElementById('spotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const spotData = {
      name: document.getElementById('spotName').value,
      fish_type: document.getElementById('spotFish').value,
      latitude: parseFloat(document.getElementById('spotLat').value),
      longitude: parseFloat(document.getElementById('spotLng').value),
      best_season: document.getElementById('spotSeason').value,
      depth: parseFloat(document.getElementById('spotDepth').value),
      accessibility: document.getElementById('spotAccess').value,
      safety_level: document.getElementById('spotSafety').value,
      description: document.getElementById('spotDesc').value
    };
    
    try {
      const response = await fetch(`${window.App.API_URL}/fishing/spots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(spotData)
      });
      
      if (response.ok) {
        alert('Spot added successfully!');
        spotModal.classList.remove('show');
        document.getElementById('spotForm').reset();
        await loadFishingSpots();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add spot');
      }
    } catch (error) {
      alert('Error adding spot');
    }
  });
  
  // User search
  document.getElementById('userSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('#usersTableBody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
  
  async function loadDashboardStats() {
    try {
      const res = await fetch(`${window.App.API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const stats = await res.json();
      
      document.getElementById('statUsers').textContent = stats.total_users;
      document.getElementById('statActive').textContent = stats.active_users;
      document.getElementById('statSpots').textContent = stats.total_spots;
      document.getElementById('statComments').textContent = stats.pending_comments;
      document.getElementById('todayVisits').textContent = stats.today_visits;
      document.getElementById('totalRoutes').textContent = stats.total_routes;
      
      // Update badges
      document.getElementById('userCountBadge').textContent = stats.total_users;
      document.getElementById('commentBadge').textContent = stats.pending_comments;
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  async function loadUsers() {
    try {
      const res = await fetch(`${window.App.API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await res.json();
      
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td><span class="status-badge ${user.role}">${user.role}</span></td>
          <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
          <td>${user.last_login ? window.App.formatRelativeTime(user.last_login) : 'Never'}</td>
          <td>
            <div class="table-actions">
              <button class="edit-btn" onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                ${user.is_active ? 'Disable' : 'Enable'}
              </button>
              <button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
      
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }
  
  async function loadFishingSpots() {
    try {
      const res = await fetch(`${window.App.API_URL}/admin/spots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const spots = await res.json();
      
      const grid = document.getElementById('spotsAdminGrid');
      grid.innerHTML = spots.map(spot => `
        <div class="spot-admin-card">
          <h4>${spot.name}</h4>
          <p>${spot.description || spot.fish_type || 'No description'}</p>
          <p><strong>Location:</strong> ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}</p>
          <div class="spot-meta">
            <span><i class="fas fa-calendar"></i> ${spot.best_season || 'Year-round'}</span>
            <span><i class="fas fa-ruler-vertical"></i> ${spot.depth || '-'}m</span>
            <span><i class="fas fa-shield-alt"></i> ${spot.safety_level || 'Good'}</span>
          </div>
          <div class="spot-actions">
            <button class="edit-btn" onclick="editSpot(${spot.id})">Edit</button>
            <button class="delete-btn" onclick="deleteSpot(${spot.id})">Delete</button>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Error loading spots:', error);
    }
  }
  
  async function loadComments() {
    try {
      const res = await fetch(`${window.App.API_URL}/comments/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const comments = await res.json();
      
      const list = document.getElementById('commentsList');
      list.innerHTML = comments.map(comment => `
        <div class="comment-card">
          <div class="comment-header">
            <h4>${comment.username || 'Anonymous'}</h4>
            <span class="comment-date">${window.App.formatRelativeTime(comment.created_at)}</span>
          </div>
          <div class="comment-subject">${comment.subject}</div>
          <div class="comment-message">${comment.message}</div>
          ${comment.admin_response ? `
            <div class="comment-response">
              <strong>Admin Response:</strong> ${comment.admin_response}
            </div>
          ` : ''}
          <div class="comment-actions">
            <button class="edit-btn" onclick="respondToComment(${comment.id}, '${comment.message.replace(/'/g, "\\'")}')">Respond</button>
            <button class="delete-btn" onclick="deleteComment(${comment.id})">Delete</button>
          </div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }
  
  async function loadActivity() {
    try {
      const res = await fetch(`${window.App.API_URL}/admin/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const activities = await res.json();
      
      const tbody = document.getElementById('activityTableBody');
      tbody.innerHTML = activities.map(activity => `
        <tr>
          <td>${window.App.formatRelativeTime(activity.created_at)}</td>
          <td>${activity.username || 'Unknown'}</td>
          <td>${activity.action}</td>
          <td>${activity.details || '-'}</td>
          <td>${activity.ip_address || '-'}</td>
        </tr>
      `).join('');
      
      // Update recent activity widget
      document.getElementById('recentActivity').innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-${activity.action === 'login' ? 'sign-in-alt' : 'info'}"></i>
          </div>
          <div class="activity-info">
            <div class="activity-user">${activity.username || 'Unknown'}</div>
            <div class="activity-action">${activity.action}</div>
          </div>
          <div class="activity-time">${window.App.formatRelativeTime(activity.created_at)}</div>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  }
  
  function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`section-${sectionId}`).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
  }
  
  // Global functions for inline handlers
  window.toggleUserStatus = async (userId, isActive) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'enable' : 'disable'} this user?`)) return;
    
    try {
      const res = await fetch(`${window.App.API_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: isActive })
      });
      
      if (res.ok) {
        await loadUsers();
        await loadDashboardStats();
      }
    } catch (error) {
      alert('Error updating user status');
    }
  };
  
  window.deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`${window.App.API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        await loadUsers();
        await loadDashboardStats();
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };
  
  window.deleteSpot = async (spotId) => {
    if (!confirm('Are you sure you want to delete this spot?')) return;
    // Implement delete spot API call
    alert('Spot deletion not implemented in demo');
  };
  
  window.editSpot = (spotId) => {
    alert('Edit spot functionality - implement in production');
  };
  
  window.respondToComment = (commentId, message) => {
    document.getElementById('commentId').value = commentId;
    document.getElementById('userMessage').textContent = message;
    document.getElementById('respondModal').classList.add('show');
  };
  
  window.deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const res = await fetch(`${window.App.API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        await loadComments();
        await loadDashboardStats();
      }
    } catch (error) {
      alert('Error deleting comment');
    }
  };
  
  // Respond form
  document.getElementById('respondForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const commentId = document.getElementById('commentId').value;
    const response = document.getElementById('adminResponse').value;
    
    try {
      const res = await fetch(`${window.App.API_URL}/comments/${commentId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response })
      });
      
      if (res.ok) {
        alert('Response sent successfully!');
        document.getElementById('respondModal').classList.remove('show');
        document.getElementById('respondForm').reset();
        await loadComments();
        await loadDashboardStats();
      }
    } catch (error) {
      alert('Error sending response');
    }
  });
});