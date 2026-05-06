(function() {
  'use strict';

  // Query DOM elements (on-demand to avoid early null caching issues)
  function getDom() {
    return {
      password: document.getElementById('password'),
      result: document.getElementById('result'),
      strengthBar: document.querySelector('#strengthBar .progress-fill'),
      copyBtn: document.getElementById('copyBtn'),
      eyeIcon: document.getElementById('eyeIcon'),
      inputToggle: document.querySelector('.input-toggle'),
      navbarLinks: document.querySelectorAll('.navbar-nav a[href^="#"]'),
      navbar: document.querySelector('.navbar')
    };
  }

  // Initialize app
  function init() {
    const DOM = getDom();

    // Event listeners
    if (DOM.password) {
      DOM.password.addEventListener('input', throttle(checkPassword, 100));
      DOM.password.addEventListener('paste', () => setTimeout(checkPassword, 50));
    }

    // Navbar functionality
    setupNavbar();

    // Keyboard shortcuts
    setupKeyboard();

    // Initial state
    checkPassword();
    updateNavbar();
  }

  // Throttled function
  function throttle(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Password analysis
  function checkPassword() {
    const DOM = getDom();
    if (!DOM.password) return;

    const password = DOM.password.value.trim();

    if (!password) {
      resetUI();
      return;
    }

    const analysis = analyzePassword(password);
    renderAnalysis(analysis);
    if (DOM.copyBtn) DOM.copyBtn.style.display = 'inline-flex';
  }

  function analyzePassword(password) {
    const score = calculateScore(password);
    const feedback = getFeedback(password, score);
    return { score, feedback, level: getLevel(score) };
  }

  function calculateScore(password) {
    let score = 0;

    // Length
    score += Math.min(Math.floor(password.length / 4), 3);

    // Variety
    score += /[A-Z]/.test(password) ? 1 : 0;
    score += /[a-z]/.test(password) ? 1 : 0;
    score += /[0-9]/.test(password) ? 1 : 0;
    score += /[^A-Za-z0-9]/.test(password) ? 1.5 : 0;

    // Patterns
    score += !/(.)\1{2,}/.test(password) ? 0.5 : 0; // No repeats
    score += !/(123|abc|qwe|asd|pass|admin)/i.test(password) ? 0.5 : 0; // No common

    return Math.min(Math.round(score * 10) / 10, 7);
  }

  function getFeedback(password, score) {
    const issues = [];
    
    if (password.length < 8) issues.push('Min 12 chars');
    if (!/[A-Z]/.test(password)) issues.push('Uppercase');
    if (!/[a-z]/.test(password)) issues.push('Lowercase');
    if (!/[0-9]/.test(password)) issues.push('Numbers');
    if (!/[^A-Za-z0-9]/.test(password)) issues.push('Symbols');
    
    return issues.slice(0, 3); // Max 3 suggestions
  }

  function getLevel(score) {
    if (score >= 6) return { name: 'Elite', icon: '🛡️', color: 'success' };
    if (score >= 4.5) return { name: 'Strong', icon: '🔥', color: 'emerald' };
    if (score >= 3) return { name: 'Medium', icon: '⚡', color: 'blue' };
    if (score >= 1.5) return { name: 'Weak', icon: '⚠️', color: 'warning' };
    return { name: 'Very Weak', icon: '😵', color: 'danger' };
  }

  function renderAnalysis({ score, feedback, level }) {
    const DOM = getDom();
    const width = Math.min((score / 7) * 100, 100);

    if (DOM.strengthBar) DOM.strengthBar.style.width = width + '%';
    if (!DOM.result) return;

    const badges = feedback.length
      ? feedback.map(f => `<span class="badge bg-glass text-xs">${f}</span>`).join('')
      : '<span class="badge bg-success text-xs">Perfect!</span>';

    DOM.result.innerHTML = `
      <div class="result-header">
        <span class="result-icon text-${level.color}-400">${level.icon}</span>
        <span class="result-score text-${level.color}-400">${level.name}</span>
        <span class="score-badge">${score.toFixed(1)}/7</span>
      </div>
      <div class="result-hints">${badges}</div>
    `;
  }

  function resetUI() {
    const DOM = getDom();
    if (DOM.strengthBar) DOM.strengthBar.style.width = '0%';
    if (DOM.result) {
      DOM.result.innerHTML = '<div class="result-icon">🔒</div><div class="result-text">Enter password to get instant analysis</div>';
    }
    if (DOM.copyBtn) DOM.copyBtn.style.display = 'none';
  }

  // Toggle visibility
  function togglePassword() {
    const DOM = getDom();
    if (!DOM.password || !DOM.eyeIcon) return;

    const isPassword = DOM.password.type === 'password';
    DOM.password.type = isPassword ? 'text' : 'password';
    DOM.eyeIcon.textContent = isPassword ? '🙈' : '👁';
  }

  // Generate secure password
  function generatePassword() {
    const DOM = getDom();
    if (!DOM.password) return;

    const length = 18 + Math.floor(Math.random() * 6); // 18-24 chars
    const charset = {
      lower: 'abcdefghijklmnopqrstuvwxyz',
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      digits: '0123456789',
      symbols: '!@#$%^&*()_+{}[]|:;\'\",.<>?/`~'
    };

    let password = '';

    // Mandatory types
    password += charset.upper[Math.floor(Math.random() * charset.upper.length)];
    password += charset.lower[Math.floor(Math.random() * charset.lower.length)];
    password += charset.digits[Math.floor(Math.random() * charset.digits.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

    // Fill with random mix
    const allChars = charset.lower + charset.upper + charset.digits + charset.symbols;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Fisher-Yates shuffle (string -> array -> string)
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const shuffled = arr.join('');

    DOM.password.value = shuffled;
    checkPassword();
  }

  // Copy to clipboard
  function copyPassword() {
    const password = DOM.password.value.trim();
    if (!password) return;

    const isModern = navigator.clipboard && window.isSecureContext;

    if (isModern) {
      navigator.clipboard.writeText(password).then(showCopyFeedback).catch(fallbackCopy);
    } else {
      fallbackCopy(password);
    }
  }

  function showCopyFeedback() {
    const DOM = getDom();
    const btn = DOM.copyBtn;
    if (!btn) return;

    const original = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    btn.classList.add('success');

    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('success');
    }, 2000);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.opacity = '0';
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback();
  }

  // Navbar setup
  function setupNavbar() {
    const DOM = getDom();
    DOM.navbarLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      });
    });
  }

  function updateNavbar() {
    const DOM = getDom();
    let current = '';
    const sections = document.querySelectorAll('[id]');

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100) {
        current = section.getAttribute('id');
      }
    });

    DOM.navbarLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href').substring(1) === current);
    });
  }

  // Keyboard shortcuts
  function setupKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target.closest('input')) return;

      const DOM = getDom();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      switch (e.key.toLowerCase()) {
        case 'g':
          if (ctrlOrCmd) {
            e.preventDefault();
            generatePassword();
          }
          break;
        case 'a':
          if (ctrlOrCmd && DOM.password) {
            e.preventDefault();
            DOM.password.focus();
            DOM.password.select();
          }
          break;
        case 'c':
          if (ctrlOrCmd && DOM.password && DOM.password.value.trim()) {
            e.preventDefault();
            copyPassword();
          }
          break;
      }
    });
  }

  // Responsive enhancements
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      checkPassword();
      updateNavbar();
    }, 150);
  });

  // Scroll handling with RAF
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateNavbar();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Performance observer
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.hero-header, .analyzer-card').forEach(el => {
      observer.observe(el);
    });
  }

  // Auto-hide navbar on mobile scroll
  if (window.innerWidth <= 768) {
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const DOM = getDom();
      const navbar = DOM.navbar;

      if (!navbar) return;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        navbar.style.transform = 'translateY(-100%)';
      } else {
        navbar.style.transform = 'translateY(0)';
      }

      lastScrollY = currentScrollY;
    });
  }

  // Expose functions for inline onclick handlers
  window.checkPassword = checkPassword;
  window.generatePassword = generatePassword;
  window.copyPassword = copyPassword;
  window.togglePassword = togglePassword;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


