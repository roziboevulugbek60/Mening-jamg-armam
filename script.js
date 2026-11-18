
const $ = id => document.getElementById(id);

const today = () => new Date().toLocaleDateString("en-CA");

const defaultState = {
  wallet: 0,
  bank: 0,
  points: 0,
  record: 0,
  totalSaved: 0,
  totalSpent: 0,
  totalBonus: 0,
  totalPurchases: 0,
  goalName: "",
  goalAmount: 0,
  restaurants: [],
  owned: [],
  expenses: [],
  tasks: {},
  lastDailyGift: "",
  lastInterest: "",
  lastMystery: "",
  depositCount: 0,
  saveActions: 0,
  expenseCount: 0
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("mySavingsGame"));
    return saved ? { ...defaultState, ...saved } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem("mySavingsGame", JSON.stringify(state));
}

function formatMoney(number) {
  return Math.floor(number).toLocaleString("uz-UZ");
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => {
    el.classList.remove("show");
  }, 2300);
}

function playSound(frequency = 600) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
    oscillator.onended = () => ctx.close();
  } catch (error) {
    console.log("Ovoz ishlamadi");
  }
}

function addPoints(amount) {
  state.points += amount;
}

function getTotalMoney() {
  return state.wallet + state.bank;
}

function updateRecord() {
  const total = getTotalMoney();

  if (total > state.record) {
    state.record = total;
  }
}

function render() {
  updateRecord();

  $("wallet").textContent = formatMoney(state.wallet);
  $("bankBalance").textContent = formatMoney(state.bank);
  $("points").textContent = formatMoney(state.points);
  $("record").textContent = formatMoney(state.record);

  $("topMoney").textContent = formatMoney(getTotalMoney());
  $("topPoints").textContent = formatMoney(state.points);
  $("topRecord").textContent = formatMoney(state.record);

  $("totalExpenses").textContent = formatMoney(state.totalSpent) + " so‘m";
  $("totalSaved").textContent = formatMoney(state.totalSaved) + " so‘m";
  $("totalSpent").textContent = formatMoney(state.totalSpent) + " so‘m";
  $("totalBonus").textContent = formatMoney(state.totalBonus) + " so‘m";
  $("totalPurchases").textContent = state.totalPurchases;

  renderGoal();
  renderLevel();
  renderExpenses();
  renderTasks();
  renderShop();

  saveState();
}

function addMoney(amount) {
  amount = Math.floor(Number(amount));

  if (!Number.isFinite(amount) || amount <= 0) {
    toast("To‘g‘ri miqdor kiriting!");
    return;
  }

  if (amount > 1000000) {
    toast("Bir martada ko‘pi bilan 1 000 000 so‘m yig‘ish mumkin!");
    return;
  }

  state.wallet += amount;
  state.totalSaved += amount;
  state.saveActions++;

  addPoints(Math.max(1, Math.floor(amount / 100)));
  $("saveMessage").textContent = "+" + formatMoney(amount) + " so‘m jamg‘arildi!";

  playSound(750);
  toast("💰 Pul hamyonga qo‘shildi!");
  render();
}

document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => {
    addMoney(Number(button.dataset.add));
  });
});

$("addCustom").addEventListener("click", () => {
  const amount = Number($("customAmount").value);
  addMoney(amount);
  $("customAmount").value = "";
});

$("customAmount").addEventListener("keydown", event => {
  if (event.key === "Enter") $("addCustom").click();
});

// Maqsad belgilash

$("setGoalBtn").addEventListener("click", () => {
  const name = $("goalName").value.trim();
  const amount = Math.floor(Number($("goalAmount").value));

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    toast("Maqsad nomi va miqdorini kiriting!");
    return;
  }

  if (amount > 1000000000) {
    toast("Maqsad miqdori juda katta!");
    return;
  }

  state.goalName = name;
  state.goalAmount = amount;

  addPoints(10);
  render();
  playSound(700);
  toast("🎯 Yangi maqsad belgilandi!");
});

function renderGoal() {
  const amount = state.goalAmount;
  const percent = amount > 0
    ? Math.min(100, Math.floor(getTotalMoney() / amount * 100))
    : 0;

  $("goalTitle").textContent = state.goalName || "Maqsad belgilanmagan";
  $("goalPercent").textContent = percent + "%";
  $("goalProgress").style.width = percent + "%";

  if (amount > 0) {
    const remaining = Math.max(0, amount - getTotalMoney());

    $("goalDetails").textContent = remaining === 0
      ? "🎉 Tabriklaymiz! Maqsadingizga yetdingiz!"
      : "Yana " + formatMoney(remaining) + " so‘m yig‘ish kerak.";
  } else {
    $("goalDetails").textContent = "Maqsad qo‘ysang, jamg‘arishni boshlashing mumkin.";
  }

  $("goalName").value = state.goalName;
  $("goalAmount").value = state.goalAmount || "";
}

// Virtual bank

$("depositBtn").addEventListener("click", () => {
  const amount = Math.floor(Number($("bankAmount").value));

  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Omonat miqdorini kiriting!");
    return;
  }

  if (amount > state.wallet) {
    $("bankMessage").textContent = "Hamyonda buncha pul yo‘q!";
    playSound(200);
    return;
  }

  state.wallet -= amount;
  state.bank += amount;
  state.depositCount++;

  $("bankAmount").value = "";
  $("bankMessage").textContent = formatMoney(amount) + " so‘m omonatga qo‘yildi.";

  addPoints(5);
  render();
  playSound(800);
  toast("🏦 Pul virtual bankka qo‘yildi!");
});

$("withdrawBtn").addEventListener("click", () => {
  const amount = Math.floor(Number($("bankAmount").value));

  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Pul miqdorini kiriting!");
    return;
  }

  if (amount > state.bank) {
    $("bankMessage").textContent = "Bankda buncha pul mavjud emas!";
    playSound(200);
    return;
  }

  state.bank -= amount;
  state.wallet += amount;

  $("bankAmount").value = "";
  $("bankMessage").textContent = formatMoney(amount) + " so‘m hamyonga qaytarildi.";

  render();
  playSound(650);
  toast("Pul hamyonga qaytarildi!");
});

// Omonat bonusi — bir kunda bir marta

$("interestBtn").addEventListener("click", () => {
  if (state.lastInterest === today()) {
    $("bankMessage").textContent = "Bugungi bonus allaqachon olindi. Ertaga qaytib keling!";
    toast("Bugungi bonus olingan!");
    return;
  }

  if (state.bank <= 0) {
    $("bankMessage").textContent = "Avval bankka virtual pul qo‘ying!";
    return;
  }

  const bonus = Math.max(1, Math.floor(state.bank * 0.02));

  state.bank += bonus;
  state.totalBonus += bonus;
  state.lastInterest = today();

  addPoints(10);
  $("bankMessage").textContent = "+" + formatMoney(bonus) + " so‘m bonus olindi!";

  render();
  playSound(950);
  toast("✨ Omonat bonusi olindi!");
});

// Xarajatlar

$("expenseBtn").addEventListener("click", () => {
  const name = $("expenseName").value.trim();
  const amount = Math.floor(Number($("expenseAmount").value));

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    toast("Xarajat nomi va miqdorini kiriting!");
    return;
  }

  if (amount > state.wallet) {
    toast("Hamyonda yetarli pul yo‘q!");
    return;
  }

  if (amount > 1000000) {
    toast("Xarajat miqdori juda katta!");
    return;
  }

  state.wallet -= amount;
  state.totalSpent += amount;
  state.expenseCount++;

  state.expenses.unshift({
    name,
    amount,
    date: new Date().toLocaleDateString("uz-UZ")
  });

  state.expenses = state.expenses.slice(0, 20);

  $("expenseName").value = "";
  $("expenseAmount").value = "";

  render();
  playSound(350);
  toast("🧾 Xarajat saqlandi!");
});

function renderExpenses() {
  if (!state.expenses.length) {
    $("expenseList").innerHTML = '<p class="muted small">Hozircha xarajat yo‘q.</p>';
    return;
  }

  $("expenseList").innerHTML = state.expenses.map(item => `
    <div class="expense-item">
      <span>${escapeHTML(item.name)} <small>(${escapeHTML(item.date)})</small></span>
      <b>-${formatMoney(item.amount)}</b>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Kunlik topshiriqlar

const taskData = [
  {
    id: "save",
    icon: "🐷",
    title: "Pul yig‘uvchi",
    description: "Kamida 1 000 so‘m jamg‘ar.",
    reward: 20,
    check: () => state.totalSaved >= 1000
  },
  {
    id: "bank",
    icon: "🏦",
    title: "Bank mijozi",
    description: "Virtual bankka pul qo‘y.",
    reward: 25,
    check: () => state.depositCount > 0
  },
  {
    id: "expense",
    icon: "🧾",
    title: "Hisob-kitobchi",
    description: "Bitta xarajatni qayd et.",
    reward: 15,
    check: () => state.expenseCount > 0
  }
];

function renderTasks() {
  $("taskList").innerHTML = taskData.map(task => {
    const completed = Boolean(state.tasks[task.id]);
    const ready = task.check();

    return `
      <div class="task">
        <div class="task-icon">${task.icon}</div>
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p>🎁 Mukofot: ${task.reward} ball</p>
        <button data-task="${task.id}" ${completed || !ready ? "disabled" : ""}>
          ${completed ? "✓ Bajarildi" : ready ? "Mukofotni olish" : "Bajarilmagan"}
        </button>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-task]").forEach(button => {
    button.addEventListener("click", () => claimTask(button.dataset.task));
  });
}

function claimTask(id) {
  const task = taskData.find(item => item.id === id);

  if (!task || state.tasks[id] || !task.check()) return;

  state.tasks[id] = true;
  addPoints(task.reward);

  render();
  playSound(900);
  toast("🏅 Topshiriq bajarildi! +" + task.reward + " ball");
}

// Do‘kon

const shopItems = [
  { id: "hat", emoji: "🧢", name: "Oshpaz qalpog‘i", cost: 30 },
  { id: "star", emoji: "🌟", name: "Oltin yulduz", cost: 50 },
  { id: "house", emoji: "🏠", name: "Orzudagi uy", cost: 100 },
  { id: "car", emoji: "🚗", name: "Virtual avtomobil", cost: 150 },
  { id: "diamond", emoji: "💎", name: "Olmos", cost: 200 },
  { id: "rocket", emoji: "🚀", name: "Kosmik raketa", cost: 300 },
  { id: "castle", emoji: "🏰", name: "Katta qasr", cost: 500 },
  { id: "crown", emoji: "👑", name: "Oltin toj", cost: 700 }
];

function renderShop() {
  $("shopList").innerHTML = shopItems.map(item => {
    const owned = state.owned.includes(item.id);

    return `
      <div class="shop-item">
        <div class="shop-emoji">${item.emoji}</div>
        <h3>${item.name}</h3>
        <p>⭐ ${item.cost} ball</p>
        <button class="${owned ? "owned" : ""}"
          data-buy="${item.id}" ${owned ? "disabled" : ""}>
          ${owned ? "✓ Olingan" : "Sotib olish"}
        </button>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => buyItem(button.dataset.buy));
  });
}

function buyItem(id) {
  const item = shopItems.find(x => x.id === id);

  if (!item || state.owned.includes(id)) return;

  if (state.points < item.cost) {
    toast("Bu buyum uchun ball yetarli emas!");
    playSound(200);
    return;
  }

  state.points -= item.cost;
  state.owned.push(id);
  state.totalPurchases++;

  render();
  playSound(850);
  toast("🛍️ " + item.name + " sotib olindi!");
}

// Kunlik sovg‘a

$("dailyGiftBtn").addEventListener("click", () => {
  if (state.lastDailyGift === today()) {
    $("giftMessage").textContent = "Bugungi sovg‘a allaqachon olingan. Ertaga qaytib keling!";
    toast("Kunlik sovg‘a olingan!");
    return;
  }

  const gift = 300;

  state.wallet += gift;
  state.totalBonus += gift;
  state.lastDailyGift = today();

  addPoints(10);
  $("giftMessage").textContent = "🎉 +" + formatMoney(gift) + " so‘m va 10 ball olindi!";

  render();
  playSound(1000);
  toast("🎁 Kunlik sovg‘a olindi!");
});

// Sirli sovg‘a — kuniga bir marta

$("mysteryGiftBtn").addEventListener("click", () => {
  if (state.lastMystery === today()) {
    $("mysteryMessage").textContent = "Sirli sovg‘a bugun ochilgan. Ertaga yana urinib ko‘ring!";
    toast("Bugungi sovg‘a ishlatildi!");
    return;
  }

  const prizes = [
    { money: 100, points: 5, text: "100 so‘m va 5 ball!" },
    { money: 250, points: 10, text: "250 so‘m va 10 ball!" },
    { money: 500, points: 15, text: "500 so‘m va 15 ball!" },
    { money: 1000, points: 20, text: "1 000 so‘m va 20 ball!" }
  ];

  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  state.wallet += prize.money;
  state.totalBonus += prize.money;
  addPoints(prize.points);
  state.lastMystery = today();

  $("mysteryMessage").textContent = "🎉 " + prize.text;

  render();
  playSound(1050);
  toast("🎁 Sirli sovg‘a ochildi!");
});

// Bosqichlar

function renderLevel() {
  const total = getTotalMoney();

  const levels = [
    { name: "Boshlovchi", min: 0, max: 1000, icon: "🌱" },
    { name: "Tejamkor", min: 1000, max: 5000, icon: "🐷" },
    { name: "Pul yig‘uvchi", min: 5000, max: 15000, icon: "💰" },
    { name: "Jamg‘arma ustasi", min: 15000, max: 50000, icon: "🏦" },
    { name: "Moliyaviy chempion", min: 50000, max: 100000, icon: "🏆" },
    { name: "Millioner", min: 100000, max: 100000, icon: "👑" }
  ];

  let index = levels.findIndex((item, i) => {
    if (i === levels.length - 1) return total >= item.min;
    return total >= item.min && total < item.max;
  });

  if (index < 0) index = 0;

  const current = levels[index];
  const next = levels[index + 1];

  $("levelName").textContent = current.name;
  $("levelNumber").textContent = index + 1;
  $("levelIcon").textContent = current.icon;

  if (next) {
    const percent = Math.min(100, Math.floor(
      (total - current.min) / (next.min - current.min) * 100
    ));

    $("levelProgress").style.width = percent + "%";
    $("levelDetails").textContent =
      "Keyingi bosqich: " + next.name + " — yana " +
      formatMoney(Math.max(0, next.min - total)) + " so‘m kerak.";
  } else {
    $("levelProgress").style.width = "100%";
    $("levelDetails").textContent = "🏆 Eng yuqori bosqichga yetdingiz!";
  }
}

// Boshlang‘ich ko‘rinish

render();
