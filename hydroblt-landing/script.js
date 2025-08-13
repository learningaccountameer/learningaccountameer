const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Elements
const messageEl = document.getElementById('message');
const stormLayer = document.querySelector('.storm-layer');
const boltSvg = document.getElementById('bolt');
const flashEl = document.querySelector('.flash');
const brandTitle = document.querySelector('.brand-title');
const soundToggle = document.getElementById('sound-toggle');
const yearEl = document.getElementById('year');

// Copy sequence per requirements
const messages = [
  'Thunder in the background',
  'Recovery',
  'Hydration',
  '20 grams of protein',
  'Packed in one tinny shot'
];

// Audio state
let audioContext = null;
let masterGain = null;
let soundEnabled = false;

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.8; // default volume
  masterGain.connect(audioContext.destination);
}

function enableSound(enabled) {
  soundEnabled = enabled;
  if (enabled) {
    if (!audioContext) initAudio();
    if (audioContext.state === 'suspended') audioContext.resume();
    masterGain.gain.setTargetAtTime(0.8, audioContext.currentTime, 0.02);
  } else if (audioContext && masterGain) {
    masterGain.gain.setTargetAtTime(0.0, audioContext.currentTime, 0.02);
  }
  soundToggle.setAttribute('aria-pressed', String(enabled));
  soundToggle.textContent = `Sound: ${enabled ? 'On' : 'Off'}`;
}

// Very lightweight thunder synthesis using filtered noise + envelope
function playThunder({ delayMs = 0 } = {}) {
  if (!soundEnabled || !audioContext) return;
  const startAt = audioContext.currentTime + (delayMs / 1000);

  // Create noise buffer
  const duration = 2.2 + Math.random() * 0.8;
  const sampleRate = audioContext.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  // Brown noise-ish (integrated white noise)
  let lastOut = 0.0;
  for (let i = 0; i < frameCount; i++) {
    const white = Math.random() * 2 - 1;
    const brown = (lastOut + (0.02 * white)) / 1.02;
    lastOut = brown;
    data[i] = brown * 0.7;
  }

  const src = audioContext.createBufferSource();
  src.buffer = buffer;

  // Filter chain: lowpass + slight bandpass to emphasize rumble
  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 800 + Math.random() * 400;

  const bandpass = audioContext.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 120;
  bandpass.Q.value = 0.7;

  const amp = audioContext.createGain();
  amp.gain.value = 0.0;

  src.connect(lowpass);
  lowpass.connect(bandpass);
  bandpass.connect(amp);
  amp.connect(masterGain);

  // Envelope
  const now = startAt;
  amp.gain.cancelScheduledValues(now);
  amp.gain.setValueAtTime(0.0, now);
  amp.gain.linearRampToValueAtTime(0.9, now + 0.08 + Math.random() * 0.04); // attack
  amp.gain.exponentialRampToValueAtTime(0.08, now + duration * 0.6); // decay
  amp.gain.exponentialRampToValueAtTime(0.001, now + duration); // release

  src.start(startAt);
  src.stop(startAt + duration);
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function showMessageSequence() {
  if (!messageEl) return;

  stormLayer.classList.add('rumble');

  for (let i = 0; i < messages.length; i++) {
    const text = messages[i];
    messageEl.classList.remove('visible', 'flicker');
    messageEl.textContent = text;

    await sleep(60);
    messageEl.classList.add('visible', 'flicker');

    await sleep(1200);
  }

  // Prepare for lightning
  messageEl.classList.remove('flicker');
  await sleep(300);
}

async function strikeLightning() {
  if (!boltSvg) return;

  // Visual flash
  flashEl.classList.add('active');
  setTimeout(() => flashEl.classList.remove('active'), 420);

  // Animate bolt
  boltSvg.classList.add('strike');

  // Thunder sound slightly delayed from flash for realism
  playThunder({ delayMs: 120 });

  // Reveal brand title after strike
  await sleep(520);
  brandTitle.classList.add('reveal');
}

function startExperience() {
  // If reduced motion, show static state
  if (prefersReducedMotion) {
    messageEl.textContent = 'HYDROBLT';
    brandTitle.classList.add('reveal');
    return;
  }

  (async () => {
    await showMessageSequence();
    await strikeLightning();
  })();
}

// Waitlist form handling (local storage + client-side validation)
(function setupForm() {
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('email');
  const nameInput = document.getElementById('name');
  const errorEl = document.getElementById('email-error');
  const successEl = document.getElementById('form-success');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!emailInput.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      errorEl.textContent = 'Please enter a valid email.';
      emailInput.focus();
      return;
    }
    errorEl.textContent = '';

    const entry = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      ts: new Date().toISOString(),
    };

    try {
      const key = 'hydroblt_waitlist';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {
      // ignore storage errors
    }

    successEl.hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
    form.querySelector('button[type="submit"]').textContent = 'Joined';
  });
})();

// Sound toggle setup (requires user interaction for AudioContext)
(function setupSound() {
  soundToggle.addEventListener('click', () => {
    if (!audioContext) initAudio();
    enableSound(!soundEnabled);
  });

  // Also allow first click anywhere on hero to enable sound
  document.querySelector('.hero').addEventListener('click', () => {
    if (!audioContext) initAudio();
    if (!soundEnabled) enableSound(true);
  }, { once: true });
})();

// Kick things off when hero enters viewport
(function onReady() {
  yearEl.textContent = String(new Date().getFullYear());

  const hero = document.querySelector('.hero');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startExperience();
        io.disconnect();
      }
    });
  }, { threshold: 0.4 });
  io.observe(hero);
})();