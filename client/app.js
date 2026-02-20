/* app.js — Mobile-first single-page assessment (one question per screen) */

(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const state = {
    screen: 'loading',   // loading | email | question | submitting | results
    direction: 'forward',
    config: null,         // { sections: [...] }
    questions: [],        // flat list [{sectionTitle, sectionDesc, ...questionObj}]
    currentIndex: 0,
    answers: {},          // questionId → value
    email: '',
    name: '',
    company: '',
    sessionId: null,
    results: null
  };

  const $ = (sel) => document.querySelector(sel);
  const $app = () => $('#app');
  const API = '/api/assessment';

  // -----------------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------------
  async function init() {
    try {
      const res = await fetch(`${API}/config`);
      if (!res.ok) throw new Error('Failed to load config');
      state.config = await res.json();
      flattenQuestions();
      state.screen = 'email';
      render();
    } catch (err) {
      console.error(err);
      $app().innerHTML = '<div class="text-center py-20 text-red-600">Failed to load assessment. Please refresh.</div>';
    }
  }

  function flattenQuestions() {
    state.questions = [];
    for (const section of state.config.sections) {
      for (const q of section.questions) {
        state.questions.push({
          ...q,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionDescription: section.description
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Render dispatcher
  // -----------------------------------------------------------------------
  function render() {
    const animClass = state.direction === 'back' ? 'screen-enter-back' : 'screen-enter';
    switch (state.screen) {
      case 'email':      renderEmail(animClass); break;
      case 'question':   renderQuestion(animClass); break;
      case 'submitting': renderSubmitting(); break;
      case 'results':    renderResults(animClass); break;
    }
    updateProgressBar();
  }

  function updateProgressBar() {
    const wrap = $('#progress-bar-wrap');
    const bar = $('#progress-bar');
    if (state.screen === 'question') {
      wrap.classList.remove('hidden');
      const pct = Math.round(((state.currentIndex + 1) / state.questions.length) * 100);
      bar.style.width = pct + '%';
    } else {
      wrap.classList.add('hidden');
    }
  }

  // -----------------------------------------------------------------------
  // Email screen
  // -----------------------------------------------------------------------
  function renderEmail(animClass) {
    const totalQ = state.questions.length;
    $app().innerHTML = `
      <div class="w-full max-w-md mx-auto ${animClass}">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI Readiness Assessment</h1>
          <p class="text-gray-500">Discover how prepared your organization is for AI adoption.</p>
        </div>

        <form id="email-form" class="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-5" novalidate>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Work email <span class="text-red-500">*</span></label>
            <input id="email" type="email" required autocomplete="email"
                   class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-brand-500 transition"
                   placeholder="you@company.com" value="${esc(state.email)}">
            <p id="email-err" class="text-red-500 text-sm mt-1 hidden">Please enter a valid email address.</p>
          </div>
          <div>
            <label for="uname" class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-gray-400 text-xs">(optional)</span></label>
            <input id="uname" type="text" autocomplete="name"
                   class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-brand-500 transition"
                   placeholder="Jane Smith" value="${esc(state.name)}">
          </div>
          <div>
            <label for="company" class="block text-sm font-medium text-gray-700 mb-1">Company <span class="text-gray-400 text-xs">(optional)</span></label>
            <input id="company" type="text" autocomplete="organization"
                   class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-brand-500 transition"
                   placeholder="Acme Inc." value="${esc(state.company)}">
          </div>
          <button type="submit" class="btn-primary w-full">Start Assessment &rarr;</button>
          <p class="text-center text-xs text-gray-400">${totalQ} questions &middot; about 5 minutes</p>
        </form>
      </div>`;

    $('#email-form').addEventListener('submit', handleEmailSubmit);
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const email = $('#email').value.trim();
    const name = $('#uname').value.trim();
    const company = $('#company').value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('#email-err').classList.remove('hidden');
      $('#email').focus();
      return;
    }

    state.email = email;
    state.name = name;
    state.company = company;

    // Call start endpoint
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Starting...';
    try {
      const res = await fetch(`${API}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Start failed');
      state.sessionId = data.sessionId;
    } catch (err) {
      console.error(err);
      // Continue even if start fails — scoring still works
      state.sessionId = 'local-' + Date.now();
    }

    state.screen = 'question';
    state.currentIndex = 0;
    state.direction = 'forward';
    render();
  }

  // -----------------------------------------------------------------------
  // Question screen
  // -----------------------------------------------------------------------
  function renderQuestion(animClass) {
    const q = state.questions[state.currentIndex];
    const idx = state.currentIndex;
    const total = state.questions.length;
    const answer = state.answers[q.id];
    const isFirst = idx === 0;
    const isLast = idx === total - 1;
    const canAdvance = !q.required || answer !== undefined;

    // Determine if we are entering a new section
    const prevQ = idx > 0 ? state.questions[idx - 1] : null;
    const newSection = !prevQ || prevQ.sectionId !== q.sectionId;

    let optionsHTML = '';
    if (q.type === 'likert' || q.type === 'multiple') {
      optionsHTML = (q.options || []).map((opt, i) => {
        const sel = answer === i ? 'selected' : '';
        return `<button type="button" class="option-card ${sel}" data-value="${i}">
          <span class="radio"></span>
          <span>${esc(opt)}</span>
        </button>`;
      }).join('');
    } else if (q.type === 'text') {
      optionsHTML = `
        <textarea id="text-answer" rows="4"
          class="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-brand-500 transition resize-none"
          placeholder="${esc(q.placeholder || 'Your thoughts...')}">${esc(answer || '')}</textarea>`;
    }

    $app().innerHTML = `
      <div class="w-full max-w-lg mx-auto ${animClass}">
        <!-- Counter -->
        <div class="flex items-center justify-between mb-2 text-sm text-gray-400">
          <span>${idx + 1} of ${total}</span>
          <span class="font-medium text-brand-600">${esc(q.sectionTitle)}</span>
        </div>

        ${newSection ? `<p class="text-xs text-gray-400 mb-4">${esc(q.sectionDescription)}</p>` : ''}

        <!-- Question card -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-1 leading-snug">${esc(q.question)}</h2>
          ${q.helpText ? `<p class="text-sm text-gray-400 mb-4">${esc(q.helpText)}</p>` : '<div class="mb-4"></div>'}
          ${!q.required ? '<p class="text-xs text-gray-400 mb-3 italic">Optional — you can skip this question</p>' : ''}

          <div class="space-y-3" id="options-container">
            ${optionsHTML}
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center gap-3">
          ${!isFirst ? '<button id="btn-back" class="btn-secondary flex-1">&#8592; Back</button>' : '<div class="flex-1"></div>'}
          ${!q.required && q.type === 'text' && !isLast
            ? `<button id="btn-skip" class="btn-secondary">Skip</button>` : ''}
          <button id="btn-next" class="btn-primary flex-1" ${canAdvance ? '' : 'disabled'}>
            ${isLast ? 'See Results' : 'Next &rarr;'}
          </button>
        </div>
      </div>`;

    // Wire up events
    if (q.type === 'likert' || q.type === 'multiple') {
      document.querySelectorAll('.option-card').forEach((card) => {
        card.addEventListener('click', () => {
          const val = parseInt(card.dataset.value, 10);
          state.answers[q.id] = val;
          // Update UI immediately
          document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          $('#btn-next').disabled = false;
          // Auto-advance after short delay for likert
          if (q.type === 'likert') {
            setTimeout(() => advanceQuestion(), 250);
          }
        });
      });
    }

    if (q.type === 'text') {
      const ta = $('#text-answer');
      ta.addEventListener('input', () => {
        state.answers[q.id] = ta.value;
        if (q.required) {
          $('#btn-next').disabled = !ta.value.trim();
        }
      });
    }

    const backBtn = $('#btn-back');
    if (backBtn) backBtn.addEventListener('click', goBack);

    const skipBtn = $('#btn-skip');
    if (skipBtn) skipBtn.addEventListener('click', () => advanceQuestion());

    $('#btn-next').addEventListener('click', () => advanceQuestion());
  }

  function advanceQuestion() {
    const q = state.questions[state.currentIndex];
    // For required questions, validate
    if (q.required && state.answers[q.id] === undefined) return;

    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      state.direction = 'forward';
      state.screen = 'question';
      render();
    } else {
      submitAssessment();
    }
  }

  function goBack() {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      state.direction = 'back';
      state.screen = 'question';
      render();
    } else {
      state.direction = 'back';
      state.screen = 'email';
      render();
    }
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------
  function renderSubmitting() {
    $app().innerHTML = `
      <div class="text-center py-20 screen-enter">
        <div class="spinner mx-auto"></div>
        <p class="mt-6 text-gray-600 font-medium">Calculating your results&hellip;</p>
      </div>`;
    $('#progress-bar-wrap').classList.add('hidden');
  }

  async function submitAssessment() {
    state.screen = 'submitting';
    render();

    try {
      const res = await fetch(`${API}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, answers: state.answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scoring failed');
      state.results = data;
    } catch (err) {
      console.error(err);
      // Show error but let user retry
      $app().innerHTML = `
        <div class="text-center py-20">
          <p class="text-red-600 mb-4">Something went wrong scoring your assessment.</p>
          <button onclick="location.reload()" class="btn-primary">Try Again</button>
        </div>`;
      return;
    }

    state.screen = 'results';
    state.direction = 'forward';
    render();
  }

  // -----------------------------------------------------------------------
  // Results screen
  // -----------------------------------------------------------------------
  function renderResults(animClass) {
    const r = state.results;
    const overall = r.overall;
    const level = r.readinessLevel;
    const sections = r.sections;
    const insights = r.insights;

    // Gauge SVG params
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (overall / 100) * circumference;

    // Color based on score
    const gaugeColor = overall >= 76 ? '#16a34a' : overall >= 51 ? '#2563eb' : overall >= 26 ? '#f59e0b' : '#ef4444';

    // Section bars
    const sectionBars = Object.entries(sections).map(([id, data]) => {
      const barColor = data.score >= 76 ? 'bg-green-500' : data.score >= 51 ? 'bg-blue-500' : data.score >= 26 ? 'bg-yellow-500' : 'bg-red-500';
      return `
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-gray-700">${esc(data.title)}</span>
            <span class="font-semibold text-gray-900">${data.score}%</span>
          </div>
          <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="score-bar-fill h-full ${barColor} rounded-full" style="width:0%" data-width="${data.score}%"></div>
          </div>
        </div>`;
    }).join('');

    // Strengths
    const strengthsHTML = (insights.strengths || []).map(s =>
      `<div class="flex items-start gap-3 mb-3">
        <span class="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">&#10003;</span>
        <p class="text-sm text-gray-700">${esc(s.message)}</p>
      </div>`
    ).join('');

    // Weaknesses
    const weaknessHTML = (insights.weaknesses || []).map(w =>
      `<div class="flex items-start gap-3 mb-3">
        <span class="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">!</span>
        <p class="text-sm text-gray-700">${esc(w.message)}</p>
      </div>`
    ).join('');

    // Recommendations
    const recsHTML = (insights.recommendations || []).map(r =>
      `<li class="text-sm text-gray-700">${esc(r)}</li>`
    ).join('');

    $app().innerHTML = `
      <div class="w-full max-w-2xl mx-auto ${animClass} pb-12">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Your AI Readiness Score</h1>
          <p class="text-gray-500">Here is how your organization stacks up.</p>
        </div>

        <!-- Score gauge -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center mb-6">
          <div class="inline-block relative">
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="10"/>
              <circle class="gauge-ring" cx="60" cy="60" r="${radius}" fill="none"
                      stroke="${gaugeColor}" stroke-width="10" stroke-linecap="round"
                      stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                      data-offset="${offset}"
                      transform="rotate(-90 60 60)"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-4xl font-bold text-gray-900">${overall}</span>
              <span class="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="inline-block px-4 py-1 rounded-full text-sm font-semibold"
                  style="background:${gaugeColor}20; color:${gaugeColor}">
              ${esc(level.label)}
            </span>
          </div>
          <p class="mt-3 text-sm text-gray-500 max-w-md mx-auto">${esc(level.description)}</p>
        </div>

        <!-- Section scores -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Section Breakdown</h2>
          ${sectionBars}
        </div>

        <!-- Insights -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
          ${strengthsHTML ? '<h3 class="text-sm font-semibold text-green-700 mb-2">Strengths</h3>' + strengthsHTML : ''}
          ${weaknessHTML ? '<h3 class="text-sm font-semibold text-amber-700 mb-2 mt-4">Areas for Improvement</h3>' + weaknessHTML : ''}
        </div>

        <!-- Recommendations -->
        <div class="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Recommendations</h2>
          <ul class="list-disc pl-5 space-y-2">${recsHTML}</ul>
        </div>

        <!-- CTA -->
        <div class="text-center">
          <a href="https://calendly.com/robvoss-vossaiconsulting/30min" target="_blank" rel="noopener"
             class="btn-primary inline-flex px-8">Book a Free Consultation</a>
          <p class="text-xs text-gray-400 mt-3">Your results have been saved.</p>
        </div>
      </div>`;

    // Animate gauge + bars after paint
    requestAnimationFrame(() => {
      const ring = document.querySelector('.gauge-ring');
      if (ring) ring.style.strokeDashoffset = ring.dataset.offset;
      document.querySelectorAll('.score-bar-fill').forEach((bar) => {
        bar.style.width = bar.dataset.width;
      });
    });
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function esc(str) {
    if (str === undefined || str === null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  // -----------------------------------------------------------------------
  // Start
  // -----------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', init);
})();
