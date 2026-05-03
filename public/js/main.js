// filepath: public/js/main.js

// API Base URL - dynamically set based on environment (must be at top for other scripts to use)
window.App = window.App || {};
window.App.API_URL = window.location.origin + '/api';

// Check if user is logged in
const isLoggedIn = () => {
  return localStorage.getItem('token') !== null;
};

// Get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Get user data
const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Logout function
const logout = () => {
  localStorage.clear();
  sessionStorage.clear();
  // Use replace to prevent back-button re-entry
  window.location.replace('/login');
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navAuth = document.querySelector('.nav-auth');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navAuth.style.display = navAuth.style.display === 'flex' ? 'none' : 'flex';
    });
  }
  
  // Contact form handling
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you for your message! We will get back to you soon.');
      contactForm.reset();
    });
  }
  
  // Auto-logout check
  setInterval(() => {
    const token = getToken();
    if (!token) return;
    
    fetch(`${window.App.API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (res.status === 403) {
        logout();
      }
    }).catch(() => {});
  }, 60000);
});

// Export functions for use in other scripts
window.App = {
  ...window.App,
  isLoggedIn,
  getToken,
  getUser,
  logout,
  formatDate,
  formatRelativeTime,
  API_URL: window.App?.API_URL || window.location.origin + '/api'
};