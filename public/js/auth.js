// filepath: public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authError = document.getElementById('authError');
  
  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const icon = btn.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
  
  // Get API URL - handle case where window.App might not be defined yet
  const getApiUrl = () => {
    if (window.App && window.App.API_URL) {
      return window.App.API_URL;
    }
    return window.location.origin + '/api';
  };
  
  // Show error message
  const showError = (message) => {
    if (authError) {
      authError.textContent = message;
      authError.classList.add('show');
      setTimeout(() => {
        authError.classList.remove('show');
      }, 5000);
    }
  };
  
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch(`${getApiUrl()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirect based on role
          if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          showError(data.error || 'Login failed');
        }
      } catch (error) {
        showError('Network error. Please try again.');
      }
    });
  }
  
  // Register form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }
      
      try {
        const response = await fetch(`${getApiUrl()}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/dashboard';
        } else {
          showError(data.error || 'Registration failed');
        }
      } catch (error) {
        showError('Network error. Please try again.');
      }
    });
  }

});