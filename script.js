// --- Page Elements ---
const loginPage = document.getElementById('login-page');
const moodPage = document.getElementById('mood-page');
const graphPage = document.getElementById('graph-page');
const detailedGraphPage = document.getElementById('detailed-graph-page');
const detailedGraphBtn = document.getElementById('detailed-graph-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const thankYouBtn = document.getElementById('thank-you-btn');
const detailedMoodGraph = document.getElementById('detailed-mood-graph');
const detailedNoDataMsg = document.getElementById('detailed-no-data-msg');
const welcomeMessage = document.getElementById('welcome-message');
const loginForm = document.getElementById('login-form');
const nextBtn = document.getElementById('next-btn');
const moodBtns = document.querySelectorAll('.mood-btn');
const creativeSuggestionDiv = document.getElementById('creative-suggestion');
const resetBtn = document.getElementById('reset-btn');
const resetDialog = document.getElementById('reset-dialog');
const resetYes = document.getElementById('reset-yes');
const resetNo = document.getElementById('reset-no');
const weekTrack = document.getElementById('week-track');

// --- Mood Suggestions ---
const moodCreative = {
  happy: { text: "You're shining! Share your joy, dance, or capture this moment!", features: [] },
  sad: { text: "It's okay to feel sad. Try music, journaling, or a comfort movie.", features: [] },
  angry: { text: "Feeling angry? Try a workout, deep breathing, or a walk.", features: [] },
  calm: { text: "Enjoy your calmness. Read, meditate, or spend time in nature.", features: [] },
  anxious: { text: "Feeling anxious? Try mindfulness, talk to someone, or soothing music.", features: [] },
  excited: { text: "You're full of energy! Try something new, call a friend, or go for a run!", features: [] },
  bored: { text: "Bored? Try drawing, reading, or a new playlist!", features: [] },
  tired: { text: "Feeling tired? Take a nap, stretch, or listen to relaxing sounds.", features: [] },
  grateful: { text: "Gratitude is powerful! Write what you're grateful for, send a thank you note, or meditate.", features: [] },
  confused: { text: "Confused? Try organizing your thoughts, talking to someone, or taking a break.", features: [] },
  motivated: { text: "Motivated! Set a goal, start a project, or inspire someone else.", features: [] },
  stressed: { text: "Stressed? Try deep breathing, a short walk, or calming music.", features: [] }
};

// --- State ---
let selectedMood = null;
let moodData = JSON.parse(localStorage.getItem('moodData') || '{}');
let username = '';

// --- Page Navigation ---
function showPage(page) {
  [loginPage, moodPage, graphPage, detailedGraphPage].forEach(p => p.classList.remove('active'));
  page.classList.add('active');
  if (page === graphPage) renderWeekTrackOnly();
}

// --- Login ---
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  username = document.getElementById('username').value.trim();
  if (!username) {
    alert("Please enter a username");
    return;
  }
  const pwd = document.getElementById('password').value;
  if (pwd.length < 8) {
    alert("Password must be at least 8 characters.");
    return;
  }
  localStorage.setItem('moodUsername', username);
  showWelcomeMessage();
  showPage(moodPage);
});

function showWelcomeMessage() {
  if (username) {
    welcomeMessage.textContent = `Hi ${username}, welcome!`;
  } else {
    welcomeMessage.textContent = '';
  }
}

// --- Mood Selection ---
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    moodBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    nextBtn.disabled = false;
  });
});

// --- Next Button ---
nextBtn.addEventListener('click', () => {
  if (!selectedMood) return;
  const today = getToday();
  moodData[today] = selectedMood;
  localStorage.setItem('moodData', JSON.stringify(moodData));
  renderWeekTrackOnly();
  showCreativeSuggestion(selectedMood);
  showPage(graphPage);
});

// --- Render Week Track (emojis) ---
function renderWeekTrackOnly() {
  const days = getLast7Days();
  const moods = days.map(day => moodData[day] || null);
  weekTrack.innerHTML = '';
  days.forEach((day, i) => {
    const mood = moods[i];
    const emoji = mood ? getMoodEmoji(mood) : '—';
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(day).getDay()];
    const div = document.createElement('div');
    div.className = 'day';
    div.innerHTML = `<div>${dayName}</div><div>${emoji}</div>`;
    weekTrack.appendChild(div);
  });
}

// --- Creative Suggestions ---
function showCreativeSuggestion(mood) {
  const data = moodCreative[mood];
  if (!data) {
    creativeSuggestionDiv.innerHTML = '';
    return;
  }
  creativeSuggestionDiv.innerHTML = `<div>${data.text}</div>`;
}

// --- Reset Mood ---
resetBtn.addEventListener('click', () => {
  resetDialog.classList.remove('hidden');
});
resetYes.addEventListener('click', () => {
  const today = getToday();
  delete moodData[today];
  localStorage.setItem('moodData', JSON.stringify(moodData));
  selectedMood = null;
  moodBtns.forEach(b => b.classList.remove('selected'));
  nextBtn.disabled = true;
  creativeSuggestionDiv.innerHTML = '';
  resetDialog.classList.add('hidden');
  showWelcomeMessage();
  showPage(moodPage);
});
resetNo.addEventListener('click', () => {
  resetDialog.classList.add('hidden');
});

// --- Detailed Graph Navigation ---
detailedGraphBtn.addEventListener('click', () => {
  function showGraphPageWithChart() {
    renderDetailedGraph();
    showPage(detailedGraphPage);
  }
  if (window.Chart) {
    showGraphPageWithChart();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.body.appendChild(script);
    script.onload = showGraphPageWithChart;
  }
});
backToMainBtn.addEventListener('click', () => {
  showPage(graphPage);
});
if (thankYouBtn) {
  thankYouBtn.addEventListener('click', () => {
    alert('Thank you for tracking your mood!');
  });
}

// --- Render Weekly Mood Graph ---
function renderDetailedGraph() {
  if (!detailedMoodGraph) return;
  const days = getLast7Days();
  const moods = days.map(day => moodData[day] !== undefined ? moodData[day] : null);
  const moodMap = { happy: 5, calm: 4, neutral: 3, anxious: 2, sad: 1, angry: 0, excited: 6, bored: 2, tired: 1, grateful: 5, confused: 2, motivated: 6, stressed: 1 };
  const data = moods.map(m => m !== null && m !== undefined ? (moodMap[m] !== undefined ? moodMap[m] : null) : null);
  const hasData = data.some(v => v !== null && v !== undefined);
  if (!hasData) {
    if (window.detailedChart) window.detailedChart.destroy();
    detailedNoDataMsg.style.display = 'block';
    detailedMoodGraph.style.display = 'none';
    return;
  } else {
    detailedNoDataMsg.style.display = 'none';
    detailedMoodGraph.style.display = 'block';
    if (window.detailedChart) window.detailedChart.destroy();
    const ctx = detailedMoodGraph.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, detailedMoodGraph.height);
    gradient.addColorStop(0, 'rgba(76,191,115,0.35)');
    gradient.addColorStop(1, 'rgba(126,217,87,0.10)');
    window.detailedChart = new window.Chart(detailedMoodGraph, {
      type: 'line',
      data: {
        labels: days.map(d => {
          const dateObj = new Date(d);
          return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Mood',
          data: data,
          fill: true,
          borderColor: '#4bbf73',
          backgroundColor: gradient,
          tension: 0.45,
          pointRadius: 10,
          pointBackgroundColor: '#7ed957',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          spanGaps: true
        }]
      },
      options: {
        scales: {
          y: {
            min: 0,
            max: 6,
            ticks: {
              stepSize: 1,
              callback: v => {
                return Object.keys(moodMap).find(k => moodMap[k] === v) || '';
              }
            },
            grid: { color: '#eafaf1' }
          },
          x: {
            grid: { color: '#f6fbf9' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// --- Emoji Helper ---
function getMoodEmoji(mood) {
  return {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    calm: '😌',
    anxious: '😰',
    excited: '🤩',
    bored: '🥱',
    tired: '😴',
    grateful: '🙏',
    confused: '😕',
    motivated: '💪',
    stressed: '😩'
  }[mood] || '—';
}

// --- Date Helpers ---
function getToday() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0,10));
  }
  return days;
}

// --- On Load ---
window.addEventListener('DOMContentLoaded', () => {
  username = localStorage.getItem('moodUsername') || '';
  showWelcomeMessage();
  renderWeekTrackOnly();
  showPage(loginPage);
});