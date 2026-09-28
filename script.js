/* =========================================
   CUSTOM SAVING CHALLENGE
========================================= */

const MIN_TARGET = 5000;
const MAX_TARGET = 500000;
const TARGET_STEP = 5000;
const STORAGE_KEY = "customSavingChallenge_v1";

const $ = (id) => document.getElementById(id);

const targetInput = $("targetInput");
const dailyAmountInput = $("dailyAmountInput");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");
const setupSection = $("setupSection");
const challengeSection = $("challengeSection");
const setupMessage = $("setupMessage");
const paymentMessage = $("paymentMessage");
const addSavingBtn = $("addSavingBtn");
const savingTableBody = $("savingTableBody");
const chartCanvas = $("savingChart");

let data = loadData();

function formatMoney(amount) {
  return "Rs." + Math.round(Number(amount) || 0).toLocaleString("en-US");
}

function createDefaultData() {
  return {
    version: 1,
    target: 0,
    dailyAmount: 0,
    totalDays: 0,
    saved: 0,
    currentDay: 1,
    days: [],
    createdAt: null
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return createDefaultData();
    return parsed;
  } catch (error) {
    console.error("Unable to load saving challenge:", error);
    return createDefaultData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function populateTargets() {
  targetInput.innerHTML = "";
  for (let amount = MIN_TARGET; amount <= MAX_TARGET; amount += TARGET_STEP) {
    const option = document.createElement("option");
    option.value = amount;
    option.textContent = formatMoney(amount);
    targetInput.appendChild(option);
  }
}

function calculateDays(target, daily) {
  return Math.max(1, Math.ceil(target / daily));
}

function updatePreview() {
  const target = Number(targetInput.value) || MIN_TARGET;
  const daily = Number(dailyAmountInput.value) || 0;

  $("previewTarget").textContent = formatMoney(target);
  $("previewDaily").textContent = daily > 0 ? formatMoney(daily) : "Rs.0";
  $("previewDays").textContent = daily > 0 ? calculateDays(target, daily).toLocaleString("en-US") : "—";
}

function showFormMessage(element, message, type = "error") {
  element.textContent = message;
  element.className = "form-message " + type;
  window.clearTimeout(element._timer);
  element._timer = window.setTimeout(() => {
    element.textContent = "";
  }, 5000);
}

function createChallenge() {
  const target = Number(targetInput.value);
  const daily = Math.floor(Number(dailyAmountInput.value));

  if (!target || target < MIN_TARGET || target > MAX_TARGET || target % TARGET_STEP !== 0) {
    showFormMessage(setupMessage, "Please select a valid target from Rs.5,000 to Rs.500,000.");
    return;
  }

  if (!daily || daily < 1) {
    showFormMessage(setupMessage, "Please enter a daily saving amount greater than Rs.0.");
    return;
  }

  if (daily > target) {
    const ok = window.confirm(
      "Your daily saving amount is higher than the target.\n\n" +
      "You will finish the goal in 1 day. Continue?"
    );
    if (!ok) return;
  }

  if (data.target > 0 && data.saved > 0) {
    const ok = window.confirm(
      "A challenge is already in progress.\n\n" +
      "Starting a new challenge will replace the current progress. Continue?"
    );
    if (!ok) return;
  }

  data = {
    version: 1,
    target,
    dailyAmount: daily,
    totalDays: calculateDays(target, daily),
    saved: 0,
    currentDay: 1,
    days: [],
    createdAt: new Date().toISOString()
  };

  ensureCurrentDay();
  saveData();
  setupSection.classList.add("hidden");
  challengeSection.classList.remove("hidden");
  render();
}

function ensureCurrentDay() {
  if (!data.target || data.saved >= data.target) return null;

  let day = data.days.find(item => item.day === data.currentDay);
  if (day) return day;

  const remainingGoal = Math.max(data.target - data.saved, 0);
  const planned = Math.min(data.dailyAmount, remainingGoal);

  day = {
    day: data.currentDay,
    planned,
    saved: 0,
    completed: false,
    date: null
  };

  data.days.push(day);
  return day;
}

function addTodaySaving() {
  if (!data.target || !data.dailyAmount) {
    showFormMessage(paymentMessage, "Create a saving challenge first.");
    return;
  }

  if (data.saved >= data.target) {
    showFormMessage(paymentMessage, "🎉 Your goal is already completed!", "success");
    return;
  }

  const day = ensureCurrentDay();

  if (!day || day.completed) {
    showFormMessage(paymentMessage, "Today's saving has already been recorded.", "error");
    return;
  }

  const amount = Math.min(data.dailyAmount, data.target - data.saved);

  data.saved += amount;
  day.saved = amount;
  day.completed = true;
  day.date = new Date().toISOString();

  if (data.saved < data.target) {
    data.currentDay += 1;
    ensureCurrentDay();
  }

  saveData();
  render();

  if (data.saved >= data.target) {
    showFormMessage(paymentMessage, "🎉 Goal completed! You reached your target.", "success");
  } else {
    showFormMessage(paymentMessage, `✅ Day ${day.day} completed — ${formatMoney(amount)} saved.`, "success");
  }
}

function getProgress() {
  if (!data.target) return 0;
  return Math.min((data.saved / data.target) * 100, 100);
}

function updateStats() {
  const progress = getProgress();
  const remaining = Math.max(data.target - data.saved, 0);
  const completedDays = data.days.filter(day => day.completed).length;
  const daysLeft = Math.max(data.totalDays - completedDays, 0);

  $("targetAmount").textContent = formatMoney(data.target);
  $("savedAmount").textContent = formatMoney(data.saved);
  $("remainingAmount").textContent = formatMoney(remaining);
  $("currentDay").textContent = data.saved >= data.target ? "Completed 🎉" : `Day ${data.currentDay}`;

  $("progressText").textContent = `${progress.toFixed(2)}% completed`;
  $("progressPercent").textContent = `${progress.toFixed(2)}%`;
  $("progressFill").style.width = `${progress}%`;

  $("completedDays").textContent = completedDays.toLocaleString("en-US");
  $("totalDays").textContent = data.totalDays.toLocaleString("en-US");
  $("daysRemaining").textContent = daysLeft.toLocaleString("en-US");

  $("todayAmount").textContent =
    data.saved >= data.target ? "Goal Reached 🎉" : formatMoney(Math.min(data.dailyAmount, remaining));

  $("todayDescription").textContent =
    data.saved >= data.target
      ? "You have completed this saving challenge."
      : `Save ${formatMoney(Math.min(data.dailyAmount, remaining))} today and press the button.`;

  $("summarySaved").textContent = formatMoney(data.saved);
  $("summaryRemaining").textContent = formatMoney(remaining);
  $("summaryProgress").textContent = `${progress.toFixed(2)}%`;
  $("summaryDaily").textContent = formatMoney(data.dailyAmount);

  $("tableCompleted").textContent = completedDays.toLocaleString("en-US");
  $("tableTotal").textContent = data.totalDays.toLocaleString("en-US");

  addSavingBtn.disabled = data.saved >= data.target;
  addSavingBtn.textContent = data.saved >= data.target ? "✓ Goal Completed" : "✓ I Saved Today's Amount";
}

function renderTable() {
  savingTableBody.innerHTML = "";

  if (!data.target) return;

  const completed = data.days.filter(day => day.completed);
  const upcoming = data.days.filter(day => !day.completed);

  let visible = [];

  if (completed.length > 0) {
    visible = completed.slice(-20);
  }
  visible = visible.concat(upcoming.slice(0, 10));

  visible = visible.filter((day, index, arr) => arr.findIndex(x => x.day === day.day) === index);

  visible.forEach(day => {
    const row = document.createElement("tr");
    const status = day.completed
      ? '<span class="status completed">✓ Completed</span>'
      : '<span class="status pending">⏳ Today / Pending</span>';

    row.innerHTML = `
      <td><strong>Day ${day.day.toLocaleString("en-US")}</strong></td>
      <td>${formatMoney(day.planned)}</td>
      <td>${formatMoney(day.saved)}</td>
      <td>${status}</td>
    `;
    savingTableBody.appendChild(row);
  });

  const hiddenCount = Math.max(data.days.length - visible.length, 0);
  $("tableNote").textContent = hiddenCount
    ? `Showing the latest completed days and upcoming days. ${hiddenCount.toLocaleString("en-US")} older entries are hidden for performance.`
    : "Your saving history will grow automatically as you complete each day.";
}

function drawChart() {
  const canvas = chartCanvas;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width));
  const height = 280;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const completed = data.days.filter(day => day.completed);
  if (!completed.length) {
    ctx.fillStyle = "#777";
    ctx.font = "600 14px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Your daily savings will appear here.", width / 2, height / 2);
    return;
  }

  const items = completed.slice(-30);
  const padding = { top: 28, right: 18, bottom: 42, left: 54 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxValue = Math.max(...items.map(x => x.saved), data.dailyAmount, 1);
  const step = chartW / items.length;
  const barW = Math.max(5, step * 0.58);

  ctx.font = "11px Inter, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#8a8a96";

  for (let i = 0; i <= 4; i++) {
    const value = maxValue * (i / 4);
    const y = padding.top + chartH - (chartH * i / 4);
    ctx.strokeStyle = "rgba(80,80,100,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(formatCompact(value), padding.left - 8, y + 4);
  }

  items.forEach((item, index) => {
    const x = padding.left + index * step + (step - barW) / 2;
    const barH = (item.saved / maxValue) * chartH;
    const y = padding.top + chartH - barH;

    const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
    gradient.addColorStop(0, "#7c3aed");
    gradient.addColorStop(1, "#2563eb");
    ctx.fillStyle = gradient;

    roundRect(ctx, x, y, barW, Math.max(barH, 3), 6);
    ctx.fill();

    ctx.fillStyle = "#70707b";
    ctx.font = "10px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    if (items.length <= 15 || index % 3 === 0 || index === items.length - 1) {
      ctx.fillText(`D${item.day}`, x + barW / 2, height - 17);
    }
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function formatCompact(value) {
  if (value >= 1000000) return `Rs.${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `Rs.${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return `Rs.${Math.round(value)}`;
}

function updateCompletion() {
  const complete = data.target > 0 && data.saved >= data.target;
  $("completionSection").classList.toggle("hidden", !complete);
  $("completedTargetText").textContent = formatMoney(data.target);
}

function render() {
  if (!data.target) {
    setupSection.classList.remove("hidden");
    challengeSection.classList.add("hidden");
    updatePreview();
    return;
  }

  setupSection.classList.add("hidden");
  challengeSection.classList.remove("hidden");

  ensureCurrentDay();
  updateStats();
  renderTable();
  updateCompletion();
  drawChart();
}

function resetChallenge() {
  if (!data.target) {
    setupSection.classList.remove("hidden");
    return;
  }

  const confirmed = window.confirm(
    "🔄 Reset Saving Challenge?\n\n" +
    "Your target, daily amount, and all saved progress will be deleted.\n\n" +
    "Press OK to start a new challenge."
  );

  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  data = createDefaultData();
  targetInput.value = MIN_TARGET;
  dailyAmountInput.value = "";
  setupSection.classList.remove("hidden");
  challengeSection.classList.add("hidden");
  setupMessage.textContent = "";
  paymentMessage.textContent = "";
  updatePreview();
}

targetInput.addEventListener("change", updatePreview);
dailyAmountInput.addEventListener("input", updatePreview);
startBtn.addEventListener("click", createChallenge);
addSavingBtn.addEventListener("click", addTodaySaving);
resetBtn.addEventListener("click", resetChallenge);

window.addEventListener("resize", () => {
  if (data.target) drawChart();
});

populateTargets();
targetInput.value = data.target || MIN_TARGET;
dailyAmountInput.value = data.dailyAmount || "";
updatePreview();
render();
