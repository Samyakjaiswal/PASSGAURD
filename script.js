/* ============================================================
   PassGuard — script.js
   All analysis runs client-side. No network calls.
   ============================================================ */

'use strict';

// ── DOM refs ──────────────────────────────────────────────
const passwordInput    = document.getElementById('passwordInput');
const toggleVisibility = document.getElementById('toggleVisibility');
const eyeIcon          = document.getElementById('eyeIcon');
const copyBtn          = document.getElementById('copyBtn');
const generateBtn      = document.getElementById('generateBtn');
const barFill          = document.getElementById('barFill');
const strengthBar      = document.getElementById('strengthBar');
const strengthLabel    = document.getElementById('strengthLabel');
const entropyBadge     = document.getElementById('entropyBadge');
const themeToggle      = document.getElementById('themeToggle');
const themeIcon        = document.getElementById('themeIcon');
const toast            = document.getElementById('toast');

// Checklist items
const checks = {
  length:  document.getElementById('chkLength'),
  upper:   document.getElementById('chkUpper'),
  lower:   document.getElementById('chkLower'),
  number:  document.getElementById('chkNumber'),
  special: document.getElementById('chkSpecial'),
};

// Metric displays
const metricLen     = document.getElementById('metricLen');
const metricPool    = document.getElementById('metricPool');
const metricEntropy = document.getElementById('metricEntropy');
const metricCrack   = document.getElementById('metricCrack');

const recList = document.getElementById('recList');

// ── Strength levels ───────────────────────────────────────
// Each level carries a label, CSS colour class, bar-fill %,
// and bar background colour (maps to CSS custom properties).
const LEVELS = [
  { label: 'Very Weak',   cls: 'str-very-weak',  pct:  12, color: 'var(--c-very-weak)' },
  { label: 'Weak',        cls: 'str-weak',        pct:  30, color: 'var(--c-weak)'      },
  { label: 'Medium',      cls: 'str-medium',      pct:  55, color: 'var(--c-medium)'    },
  { label: 'Strong',      cls: 'str-strong',      pct:  78, color: 'var(--c-strong)'    },
  { label: 'Very Strong', cls: 'str-very-strong', pct: 100, color: 'var(--c-very-strong)'},
];

// ── Eye SVGs (show / hide states) ────────────────────────
const EYE_OPEN  = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_SHUT  = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

// ── Character pool helpers ────────────────────────────────
/**
 * Calculate the pool size (alphabet) a password draws from.
 * Used in entropy formula: H = L × log₂(N)
 */
function poolSize(pwd) {
  let n = 0;
  if (/[a-z]/.test(pwd)) n += 26;
  if (/[A-Z]/.test(pwd)) n += 26;
  if (/[0-9]/.test(pwd)) n += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) n += 32; // printable specials
  return n;
}

/**
 * Entropy in bits = length × log₂(pool).
 * Returns 0 for empty or single-pool tiny passwords.
 */
function entropy(pwd) {
  if (!pwd.length) return 0;
  const N = poolSize(pwd);
  if (N === 0) return 0;
  return Math.round(pwd.length * Math.log2(N));
}

/**
 * Rough crack-time estimate assuming 10 billion guesses/sec
 * (modern GPU cracker). Returns a human-readable string.
 */
function crackTime(bits) {
  if (bits === 0) return '—';
  // Possible combos = 2^bits; at 10^10 guesses/sec on average half explored
  const seconds = Math.pow(2, bits) / 2 / 1e10;
  if (seconds < 1)         return '< 1 second';
  if (seconds < 60)        return `${Math.round(seconds)} sec`;
  if (seconds < 3600)      return `${Math.round(seconds/60)} min`;
  if (seconds < 86400)     return `${Math.round(seconds/3600)} hrs`;
  if (seconds < 31536000)  return `${Math.round(seconds/86400)} days`;
  if (seconds < 3.15e9)    return `${Math.round(seconds/31536000)} yrs`;
  if (seconds < 3.15e12)   return `${(seconds/3.15e9).toFixed(1)}k yrs`;
  return '> 1 million yrs';
}

// ── Score password → level index 0-4 ─────────────────────
/**
 * Scoring logic:
 *  - Start at 0
 *  - Add points for character-type diversity
 *  - Use length bands from the spec to set a floor/ceiling
 *  - Clamp to 0-4
 */
function scorePassword(pwd) {
  if (!pwd.length) return -1; // sentinel: empty

  const len     = pwd.length;
  const hasUpper   = /[A-Z]/.test(pwd);
  const hasLower   = /[a-z]/.test(pwd);
  const hasNumber  = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  // Diversity score (0-4)
  const diversity = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  // Length-based floor as per spec
  let lengthScore;
  if      (len >= 16) lengthScore = 4; // Very Strong floor
  else if (len >= 12) lengthScore = 3; // Strong floor
  else if (len >= 8)  lengthScore = 2; // Medium floor
  else                lengthScore = 1; // Weak ceiling

  // Combine: weighted average favouring length, boosted by diversity
  // Max raw: 4 (length) + 4 (diversity) = 8 → scale to 0-4
  const raw = lengthScore + diversity;
  const scaled = Math.round((raw / 8) * 4);

  // Short passwords can never exceed "Weak" regardless of charset
  if (len < 8)  return Math.min(scaled, 1);
  // Medium-length needs at least 2 character types for "Strong"
  if (len < 12) return Math.min(scaled, 2);

  return Math.min(scaled, 4);
}

// ── Build recommendation list ─────────────────────────────
function buildRecommendations(pwd) {
  const recs = [];
  const len = pwd.length;

  if (!len) return [];

  if (len < 8)  recs.push('Use at least 8 characters. Aim for 16+ for high-security accounts.');
  else if (len < 12) recs.push('Increase to 12 or more characters for stronger protection.');
  else if (len < 16) recs.push('16+ characters makes brute-force attacks computationally infeasible.');

  if (!/[A-Z]/.test(pwd)) recs.push('Add uppercase letters (A–Z) to expand the character pool.');
  if (!/[a-z]/.test(pwd)) recs.push('Add lowercase letters (a–z).');
  if (!/[0-9]/.test(pwd)) recs.push('Include at least one digit (0–9).');
  if (!/[^a-zA-Z0-9]/.test(pwd)) recs.push('Add special characters like !@#$%^&*() to dramatically raise entropy.');

  // Common patterns
  if (/(.)\1{2,}/.test(pwd)) recs.push('Avoid repeating the same character three or more times in a row.');
  if (/^[a-z]+$/i.test(pwd)) recs.push('Mix character types — letters alone are predictable.');
  if (/^[0-9]+$/.test(pwd))  recs.push('A numbers-only password is extremely vulnerable.');
  if (/password|pass|123|qwerty|abc|letmein|admin|welcome/i.test(pwd))
    recs.push('Avoid common words and keyboard patterns — they are the first tried in dictionary attacks.');

  if (!recs.length && len >= 16) recs.push('Great work. Consider storing this in a password manager so you never need to remember it.');

  return recs;
}

// ── Render UI ─────────────────────────────────────────────
function renderStrength(pwd) {
  const idx     = scorePassword(pwd);
  const isEmpty = idx === -1;
  const level   = isEmpty ? null : LEVELS[idx];

  // — Strength label
  const allLabelClasses = LEVELS.map(l => l.cls);
  strengthLabel.classList.remove(...allLabelClasses);
  if (isEmpty) {
    strengthLabel.textContent = 'No password entered';
  } else {
    strengthLabel.textContent = level.label;
    strengthLabel.classList.add(level.cls);
  }

  // — Bar fill
  const pct = isEmpty ? 0 : level.pct;
  barFill.style.width       = pct + '%';
  barFill.style.background  = isEmpty ? 'var(--text-dim)' : level.color;
  strengthBar.setAttribute('aria-valuenow', pct);

  // — Entropy badge
  const bits = entropy(pwd);
  entropyBadge.textContent = isEmpty ? '— bits' : `${bits} bits`;

  // — Checklist
  setCheck(checks.length,  pwd.length >= 8,            '8+ characters');
  setCheck(checks.upper,   /[A-Z]/.test(pwd),           'Uppercase letter (A–Z)');
  setCheck(checks.lower,   /[a-z]/.test(pwd),           'Lowercase letter (a–z)');
  setCheck(checks.number,  /[0-9]/.test(pwd),           'Number (0–9)');
  setCheck(checks.special, /[^a-zA-Z0-9]/.test(pwd),    'Special character (!@#…)');

  // — Metrics
  if (isEmpty) {
    metricLen.textContent     = '—';
    metricPool.textContent    = '—';
    metricEntropy.textContent = '—';
    metricCrack.textContent   = '—';
  } else {
    metricLen.textContent     = pwd.length;
    metricPool.textContent    = poolSize(pwd);
    metricEntropy.textContent = bits;
    metricCrack.textContent   = crackTime(bits);
  }

  // — Recommendations
  const recs = buildRecommendations(pwd);
  recList.innerHTML = '';
  if (!recs.length && isEmpty) {
    recList.innerHTML = '<li class="rec-item placeholder">Start typing to see recommendations.</li>';
  } else if (!recs.length) {
    const li = document.createElement('li');
    li.className = 'rec-item';
    li.textContent = 'Your password meets all recommendations.';
    recList.appendChild(li);
  } else {
    recs.forEach(text => {
      const li = document.createElement('li');
      li.className = 'rec-item';
      li.textContent = text;
      recList.appendChild(li);
    });
  }
}

/** Toggle a checklist item between pass/fail states */
function setCheck(el, passes, label) {
  const icon = el.querySelector('.check-icon');
  const text = el.querySelector('.check-text');
  el.classList.toggle('pass', passes);
  icon.setAttribute('aria-label', passes ? `${label}: passed` : `${label}: failed`);
  // text content stays; CSS ::before pseudo-element shows ✓/✕
}

// ── Event: real-time input ────────────────────────────────
passwordInput.addEventListener('input', () => {
  renderStrength(passwordInput.value);
});

// ── Event: show/hide toggle ───────────────────────────────
let isVisible = false;
toggleVisibility.addEventListener('click', () => {
  isVisible = !isVisible;
  passwordInput.type = isVisible ? 'text' : 'password';
  eyeIcon.innerHTML  = isVisible ? EYE_SHUT : EYE_OPEN;
  toggleVisibility.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
});

// ── Event: copy to clipboard ──────────────────────────────
copyBtn.addEventListener('click', async () => {
  const pwd = passwordInput.value;
  if (!pwd) return;

  try {
    await navigator.clipboard.writeText(pwd);
    showToast('Copied to clipboard');
  } catch {
    // Fallback for environments without clipboard API
    const ta = document.createElement('textarea');
    ta.value = pwd;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied to clipboard');
  }
});

// ── Event: generate password ──────────────────────────────
/**
 * Generates a cryptographically random password using
 * window.crypto.getRandomValues (no Math.random).
 * Guarantees at least one character from each required class.
 */
generateBtn.addEventListener('click', () => {
  const length = 20;
  const pools  = {
    upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower:   'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*()-_=+[]{}|;:,.<>?',
  };
  const allChars = Object.values(pools).join('');

  // Ensure at least one from each pool
  let result = [
    randomFrom(pools.upper),
    randomFrom(pools.lower),
    randomFrom(pools.numbers),
    randomFrom(pools.special),
  ];

  // Fill the rest randomly
  for (let i = result.length; i < length; i++) {
    result.push(randomFrom(allChars));
  }

  // Shuffle using Fisher-Yates with crypto randomness
  for (let i = result.length - 1; i > 0; i--) {
    const j = cryptoRandInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  passwordInput.value = result.join('');
  // Reset visibility to hidden after generating
  if (isVisible) {
    isVisible = false;
    passwordInput.type = 'password';
    eyeIcon.innerHTML  = EYE_OPEN;
    toggleVisibility.setAttribute('aria-label', 'Show password');
  }
  renderStrength(passwordInput.value);
  passwordInput.focus();
});

/** Pick one random character from a string */
function randomFrom(str) {
  return str[cryptoRandInt(str.length)];
}

/** Uniform random integer in [0, max) using crypto */
function cryptoRandInt(max) {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return arr[0] % max;
}

// ── Event: theme toggle ───────────────────────────────────
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  themeIcon.textContent = isDark ? '☽' : '☀';
  // Persist preference
  try { localStorage.setItem('pg-theme', isDark ? 'light' : 'dark'); } catch {}
});

// Restore saved theme preference on load
(function initTheme() {
  try {
    const saved = localStorage.getItem('pg-theme');
    if (saved) {
      document.documentElement.dataset.theme = saved;
      themeIcon.textContent = saved === 'light' ? '☽' : '☀';
    }
  } catch {}
})();

// ── Toast helper ──────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Initial render (empty state) ──────────────────────────
renderStrength('');
