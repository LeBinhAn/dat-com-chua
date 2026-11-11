/**
 * Đặt Cơm Chưa? - CS2 Style Lunch Roulette
 */

// Rarity configurations
const RARITY_CONFIG = {
  consumer: {
    label: "Consumer Grade (Bình Dân)",
    color: "#b0c3d9",
    weight: 45
  },
  industrial: {
    label: "Industrial Grade (Quen Thuộc)",
    color: "#5e98d9",
    weight: 30
  },
  milspec: {
    label: "Mil-Spec Grade (Đặc Trưng)",
    color: "#4b69ff",
    weight: 15
  },
  restricted: {
    label: "Restricted Grade (Thượng Hạng)",
    color: "#8847ff",
    weight: 7
  },
  classified: {
    label: "Classified Grade (Đỉnh Chóp)",
    color: "#d32ce6",
    weight: 3
  }
};

// Available filter tags
const AVAILABLE_TAGS = [
  { id: "chay_only", label: "Chỉ ăn chay", isVegetarianToggle: true },
  { id: "thit_lon", label: "Không thịt lợn", excludeTag: "thit_lon" },
  { id: "thit_bo", label: "Không thịt bò", excludeTag: "thit_bo" },
  { id: "hai_san", label: "Không hải sản", excludeTag: "hai_san" },
  { id: "mon_cay", label: "Không ăn cay", excludeTag: "mon_cay" },
  { id: "mon_nuoc_ngoai", label: "Không món nước ngoài", excludeTag: "mon_nuoc_ngoai" }
];

// Helper to remove Vietnamese diacritics for flexible search
function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d");
}

class LunchBoxApp {
  constructor() {
    this.allFoods = [];
    this.filteredFoods = [];
    this.activeFilters = this.loadFilters();
    this.excludedFoodIds = this.loadExcludedFoods();
    this.searchQuery = "";
    this.history = this.loadHistory();
    this.isSpinning = false;
    this.spinDuration = 5500; // ms
    this.targetIndex = 48; // card index to land on
    this.totalCardsInStrip = 65;

    this.initElements();
    this.initTheme();
    this.initAudioBtn();
    this.renderLegend();
    this.loadFoods();
    this.bindEvents();
    this.renderHistory();
  }

  initElements() {
    this.strip = document.getElementById("rouletteStrip");
    this.viewport = document.getElementById("rouletteViewport");
    this.spinBtn = document.getElementById("spinBtn");
    this.customSelectWrapper = document.getElementById("customSelectWrapper");
    this.foodSearchInput = document.getElementById("foodSearchInput");
    this.clearSearchBtn = document.getElementById("clearSearchBtn");
    this.foodDropdownList = document.getElementById("foodDropdownList");
    this.excludedChipsList = document.getElementById("excludedChipsList");
    this.tagListEl = document.getElementById("tagList");
    this.foodCountEl = document.getElementById("foodCount");
    this.historyListEl = document.getElementById("historyList");
    this.clearHistoryBtn = document.getElementById("clearHistoryBtn");
    this.themeToggleBtn = document.getElementById("themeToggleBtn");
    this.audioToggleBtn = document.getElementById("audioToggleBtn");
    
    // Modal elements
    this.modalBackdrop = document.getElementById("resultModalBackdrop");
    this.modalEmoji = document.getElementById("modalEmoji");
    this.modalRarity = document.getElementById("modalRarity");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalDesc = document.getElementById("modalDesc");
    this.modalConfirmBtn = document.getElementById("modalConfirmBtn");
    this.modalRerollBtn = document.getElementById("modalRerollBtn");
  }

  initTheme() {
    const savedTheme = localStorage.getItem("lunchbox_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  updateThemeIcon(theme) {
    this.themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    this.themeToggleBtn.title = theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối";
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("lunchbox_theme", next);
    this.updateThemeIcon(next);
  }

  initAudioBtn() {
    const isMuted = soundEngine.isMuted;
    this.audioToggleBtn.textContent = isMuted ? "🔇" : "🔊";
    this.audioToggleBtn.title = isMuted ? "Bật âm thanh" : "Tắt âm thanh";
  }

  toggleAudio() {
    const isMuted = soundEngine.toggleMute();
    this.audioToggleBtn.textContent = isMuted ? "🔇" : "🔊";
    this.audioToggleBtn.title = isMuted ? "Bật âm thanh" : "Tắt âm thanh";
  }

  loadFilters() {
    try {
      const saved = localStorage.getItem("lunchbox_filters");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveFilters() {
    localStorage.setItem("lunchbox_filters", JSON.stringify(this.activeFilters));
  }

  loadExcludedFoods() {
    try {
      const saved = localStorage.getItem("lunchbox_excluded_foods");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveExcludedFoods() {
    localStorage.setItem("lunchbox_excluded_foods", JSON.stringify(this.excludedFoodIds));
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem("lunchbox_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    localStorage.setItem("lunchbox_history", JSON.stringify(this.history));
  }

  async loadFoods() {
    try {
      const res = await fetch("foods.json");
      if (!res.ok) throw new Error("Could not load foods.json");
      this.allFoods = await res.json();
      this.renderFilterTags();
      this.renderDropdownList();
      this.renderExcludedChips();
      this.applyFilters();
      this.populateInitialStrip();
    } catch (err) {
      console.error(err);
      this.viewport.innerHTML = `<div style="color:#ef4444;text-align:center;padding:2rem;">Lỗi tải dữ liệu món ăn. Vui lòng thử lại!</div>`;
    }
  }

  renderFilterTags() {
    this.tagListEl.innerHTML = "";
    AVAILABLE_TAGS.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.textContent = tag.label;
      btn.dataset.id = tag.id;

      const isActive = this.activeFilters.includes(tag.id);
      if (isActive) {
        btn.classList.add(tag.isVegetarianToggle ? "active-vegetarian" : "active-exclude");
      }

      btn.addEventListener("click", () => this.toggleFilter(tag));
      this.tagListEl.appendChild(btn);
    });
  }

  toggleFilter(tag) {
    if (this.isSpinning) return;
    const idx = this.activeFilters.indexOf(tag.id);
    if (idx >= 0) {
      this.activeFilters.splice(idx, 1);
    } else {
      this.activeFilters.push(tag.id);
    }
    this.saveFilters();
    this.renderFilterTags();
    this.applyFilters();
    this.populateInitialStrip();
  }

  applyFilters() {
    const isVegetarianOnly = this.activeFilters.includes("chay_only");

    this.filteredFoods = this.allFoods.filter(food => {
      // 1. Direct exclusion from "select with search"
      if (this.excludedFoodIds.includes(food.id)) {
        return false;
      }

      // 2. Vegetarian check
      if (isVegetarianOnly && !food.tags.includes("chay")) {
        return false;
      }

      // 3. Exclusion tags check
      for (const filterId of this.activeFilters) {
        const filterDef = AVAILABLE_TAGS.find(t => t.id === filterId);
        if (filterDef && filterDef.excludeTag) {
          if (food.tags.includes(filterDef.excludeTag)) {
            return false;
          }
        }
      }
      return true;
    });

    this.foodCountEl.textContent = `${this.filteredFoods.length} món khả dụng`;

    if (this.filteredFoods.length === 0) {
      this.spinBtn.disabled = true;
      this.spinBtn.textContent = "Không có món phù hợp bộ lọc";
    } else {
      this.spinBtn.disabled = false;
      this.spinBtn.innerHTML = `<span>🎲</span> MỞ HÒM (QUAY)`;
    }
  }

  openDropdown() {
    this.customSelectWrapper.classList.add("open");
  }

  closeDropdown() {
    this.customSelectWrapper.classList.remove("open");
  }

  renderDropdownList() {
    this.foodDropdownList.innerHTML = "";
    const normalizedQuery = removeVietnameseTones(this.searchQuery.trim());

    const matchingFoods = this.allFoods.filter(food => {
      if (!normalizedQuery) return true;
      const normalizedName = removeVietnameseTones(food.name);
      const normalizedDesc = removeVietnameseTones(food.description || "");
      return normalizedName.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);
    });

    if (matchingFoods.length === 0) {
      this.foodDropdownList.innerHTML = `<div class="select-dropdown-empty">Không tìm thấy món nào phù hợp</div>`;
      return;
    }

    matchingFoods.forEach(food => {
      const isExcluded = this.excludedFoodIds.includes(food.id);
      const rarityInfo = RARITY_CONFIG[food.rarity] || RARITY_CONFIG.consumer;

      const itemEl = document.createElement("div");
      itemEl.className = `select-dropdown-item ${isExcluded ? "is-excluded" : ""}`;
      itemEl.dataset.id = food.id;

      itemEl.innerHTML = `
        <div class="item-left">
          <span class="item-emoji">${food.emoji}</span>
          <span class="item-name" title="${food.name}">${food.name}</span>
        </div>
        <div class="item-right">
          <span class="item-rarity-badge" style="--item-rarity-color: ${rarityInfo.color}">${food.rarity}</span>
          ${isExcluded ? `<span class="item-status-icon" title="Đã loại trừ">🚫</span>` : ""}
        </div>
      `;

      itemEl.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFoodExclusion(food.id);
      });

      this.foodDropdownList.appendChild(itemEl);
    });
  }

  renderExcludedChips() {
    this.excludedChipsList.innerHTML = "";
    if (this.excludedFoodIds.length === 0) return;

    this.excludedFoodIds.forEach(id => {
      const food = this.allFoods.find(f => f.id === id);
      if (!food) return;

      const chip = document.createElement("div");
      chip.className = "excluded-chip";
      chip.title = "Bấm để bỏ lọc món này (cho phép quay lại)";
      chip.innerHTML = `
        <span>🚫 ${food.emoji} ${food.name}</span>
        <span class="chip-close">✕</span>
      `;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFoodExclusion(food.id);
      });
      this.excludedChipsList.appendChild(chip);
    });

    if (this.excludedFoodIds.length > 1) {
      const clearAllBtn = document.createElement("button");
      clearAllBtn.className = "clear-all-chips-btn";
      clearAllBtn.textContent = "Bỏ lọc tất cả";
      clearAllBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.clearAllExclusions();
      });
      this.excludedChipsList.appendChild(clearAllBtn);
    }
  }

  toggleFoodExclusion(foodId) {
    if (this.isSpinning) return;
    const idx = this.excludedFoodIds.indexOf(foodId);
    if (idx >= 0) {
      this.excludedFoodIds.splice(idx, 1);
    } else {
      this.excludedFoodIds.push(foodId);
    }
    this.saveExcludedFoods();
    this.renderDropdownList();
    this.renderExcludedChips();
    this.applyFilters();
    this.populateInitialStrip();
  }

  clearAllExclusions() {
    if (this.isSpinning) return;
    this.excludedFoodIds = [];
    this.saveExcludedFoods();
    this.renderDropdownList();
    this.renderExcludedChips();
    this.applyFilters();
    this.populateInitialStrip();
  }

  // Pick a random food item weighted by rarity
  pickWeightedFood() {
    if (this.filteredFoods.length === 0) return null;

    // Group available items by rarity
    const groups = {};
    for (const food of this.filteredFoods) {
      if (!groups[food.rarity]) groups[food.rarity] = [];
      groups[food.rarity].push(food);
    }

    // Build lottery pool based on active rarities
    let totalWeight = 0;
    const pool = [];
    for (const [rarity, items] of Object.entries(groups)) {
      if (items.length > 0) {
        const w = (RARITY_CONFIG[rarity] && RARITY_CONFIG[rarity].weight) || 10;
        totalWeight += w;
        pool.push({ rarity, items, weight: w });
      }
    }

    // Roll random number
    let rand = Math.random() * totalWeight;
    for (const entry of pool) {
      if (rand < entry.weight) {
        const randomItem = entry.items[Math.floor(Math.random() * entry.items.length)];
        return randomItem;
      }
      rand -= entry.weight;
    }

    return this.filteredFoods[Math.floor(Math.random() * this.filteredFoods.length)];
  }

  createCardElement(food) {
    const card = document.createElement("div");
    card.className = "food-card";
    const rarityInfo = RARITY_CONFIG[food.rarity] || RARITY_CONFIG.consumer;
    card.style.setProperty("--card-color", rarityInfo.color);

    card.innerHTML = `
      <div class="card-emoji">${food.emoji}</div>
      <div class="card-name">${food.name}</div>
      <div class="card-rarity">${food.rarity}</div>
    `;
    return card;
  }

  // Initial preview strip before user spins
  populateInitialStrip() {
    this.strip.innerHTML = "";
    this.strip.style.transform = "translateX(0px)";

    const previewList = this.filteredFoods.length > 0 ? this.filteredFoods : this.allFoods;
    if (previewList.length === 0) return;

    for (let i = 0; i < 25; i++) {
      const food = previewList[i % previewList.length];
      this.strip.appendChild(this.createCardElement(food));
    }

    // Center the strip roughly
    const firstCard = this.strip.querySelector(".food-card");
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth || 170;
      const initialOffset = (this.viewport.offsetWidth / 2) - (cardWidth * 2.5);
      this.strip.style.transform = `translateX(${initialOffset}px)`;
    }
  }

  // Spin sequence
  spin() {
    if (this.isSpinning || this.filteredFoods.length === 0) return;
    this.isSpinning = true;
    this.spinBtn.disabled = true;
    this.spinBtn.innerHTML = `<span>⏳</span> Đang mở hòm...`;

    // 1. Pick the winning food item
    const winner = this.pickWeightedFood();

    // 2. Generate new strip with winner placed at this.targetIndex
    this.strip.innerHTML = "";
    this.strip.style.transition = "none";
    this.strip.style.transform = "translateX(0px)";

    const stripCards = [];
    for (let i = 0; i < this.totalCardsInStrip; i++) {
      let food;
      if (i === this.targetIndex) {
        food = winner;
      } else {
        food = this.filteredFoods[Math.floor(Math.random() * this.filteredFoods.length)];
      }
      const cardEl = this.createCardElement(food);
      this.strip.appendChild(cardEl);
      stripCards.push(cardEl);
    }

    // Force layout reflow
    void this.strip.offsetWidth;

    // 3. Compute precise pixel destination
    const firstCard = stripCards[0];
    const cardWidth = firstCard.offsetWidth || 170;
    const viewportWidth = this.viewport.offsetWidth;
    const centerViewportX = viewportWidth / 2;

    // Sub-card randomized offset (-30% to +30% of card width) for realistic CS suspense
    const maxSubOffset = cardWidth * 0.32;
    const subCardOffset = (Math.random() * (maxSubOffset * 2)) - maxSubOffset;

    const targetCenter = (this.targetIndex * cardWidth) + (cardWidth / 2);
    const targetTranslateX = -(targetCenter - centerViewportX + subCardOffset);

    // 4. Start sound & animation
    soundEngine.playRollStart();

    // Animation via requestAnimationFrame + cubic-bezier easing to dynamically track ticks
    const startTime = performance.now();
    const duration = this.spinDuration;

    // Cubic bezier ease-out approximation: deceleration like CS
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 4);

    let lastCardCrossed = -1;

    const animateSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentX = targetTranslateX * easedProgress;
      this.strip.style.transform = `translateX(${currentX}px)`;

      // Audio tick: calculate which card is currently passing center needle
      const needleCenterOffset = -currentX + centerViewportX;
      const currentCardIdx = Math.floor(needleCenterOffset / cardWidth);

      if (currentCardIdx !== lastCardCrossed && currentCardIdx >= 0 && currentCardIdx < this.totalCardsInStrip) {
        lastCardCrossed = currentCardIdx;
        // Pitch rises slightly near the end
        const pitch = 0.9 + (progress * 0.3);
        soundEngine.playTick(pitch);
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // Animation finished!
        this.strip.style.transform = `translateX(${targetTranslateX}px)`;
        this.onSpinFinished(winner);
      }
    };

    requestAnimationFrame(animateSpin);
  }

  onSpinFinished(winner) {
    this.isSpinning = false;
    this.spinBtn.disabled = false;
    this.spinBtn.innerHTML = `<span>🎲</span> MỞ HÒM (QUAY)`;

    // Play win sound
    soundEngine.playWin(winner.rarity);

    // Save to history
    this.addToHistory(winner);

    // Show result modal
    setTimeout(() => {
      this.showModal(winner);
    }, 450);
  }

  showModal(food) {
    const rarityInfo = RARITY_CONFIG[food.rarity] || RARITY_CONFIG.consumer;

    this.modalEmoji.textContent = food.emoji;
    this.modalRarity.textContent = rarityInfo.label;
    this.modalTitle.textContent = food.name;
    this.modalDesc.textContent = food.description || "Món ngon tuyệt vời cho bữa trưa hôm nay!";

    const modalBox = this.modalBackdrop.querySelector(".result-modal");
    modalBox.style.setProperty("--modal-color", rarityInfo.color);
    modalBox.style.setProperty("--modal-glow", rarityInfo.color + "55");

    this.modalBackdrop.classList.add("show");
  }

  hideModal() {
    this.modalBackdrop.classList.remove("show");
  }

  addToHistory(food) {
    this.history.unshift({
      ...food,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    });

    if (this.history.length > 8) {
      this.history.pop();
    }
    this.saveHistory();
    this.renderHistory();
  }

  renderHistory() {
    this.historyListEl.innerHTML = "";
    if (this.history.length === 0) {
      this.historyListEl.innerHTML = `<div class="history-empty">Chưa có lượt mở hòm nào. Nhấn "MỞ HÒM" để bắt đầu!</div>`;
      return;
    }

    this.history.forEach(item => {
      const rarityInfo = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.consumer;
      const itemEl = document.createElement("div");
      itemEl.className = "history-item";
      itemEl.style.setProperty("--history-color", rarityInfo.color);

      itemEl.innerHTML = `
        <span class="history-emoji">${item.emoji}</span>
        <div class="history-details">
          <span class="history-name" title="${item.name}">${item.name}</span>
          <span class="history-rarity">${item.rarity} • ${item.timestamp || ""}</span>
        </div>
      `;
      this.historyListEl.appendChild(itemEl);
    });
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.renderHistory();
  }

  renderLegend() {
    const legendGrid = document.getElementById("legendGrid");
    if (!legendGrid) return;
    legendGrid.innerHTML = "";

    for (const [key, info] of Object.entries(RARITY_CONFIG)) {
      const div = document.createElement("div");
      div.className = "legend-item";
      div.style.setProperty("--legend-color", info.color);
      div.innerHTML = `
        <div class="legend-dot"></div>
        <div class="legend-info">
          <span class="legend-name">${info.label}</span>
          <span class="legend-prob">Tỉ lệ rơi: ~${info.weight}%</span>
        </div>
      `;
      legendGrid.appendChild(div);
    }
  }

  bindEvents() {
    this.spinBtn.addEventListener("click", () => this.spin());
    this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());
    this.audioToggleBtn.addEventListener("click", () => this.toggleAudio());
    this.clearHistoryBtn.addEventListener("click", () => this.clearHistory());

    // Select-with-search events
    this.foodSearchInput.addEventListener("focus", () => {
      this.openDropdown();
    });

    this.foodSearchInput.addEventListener("click", () => {
      this.openDropdown();
    });

    this.foodSearchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value;
      this.clearSearchBtn.classList.toggle("visible", this.searchQuery.trim().length > 0);
      this.openDropdown();
      this.renderDropdownList();
    });

    this.clearSearchBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.foodSearchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.classList.remove("visible");
      this.foodSearchInput.focus();
      this.renderDropdownList();
    });

    // Close dropdown on click outside
    document.addEventListener("click", (e) => {
      if (!this.customSelectWrapper.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Modal buttons
    this.modalConfirmBtn.addEventListener("click", () => this.hideModal());
    this.modalRerollBtn.addEventListener("click", () => {
      this.hideModal();
      setTimeout(() => this.spin(), 200);
    });

    this.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === this.modalBackdrop) {
        this.hideModal();
      }
    });

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        this.closeDropdown();
      }

      const activeTag = document.activeElement ? document.activeElement.tagName : "";
      if (e.code === "Space" && !this.isSpinning && !["BUTTON", "INPUT", "TEXTAREA"].includes(activeTag)) {
        e.preventDefault();
        this.spin();
      }
    });
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  window.app = new LunchBoxApp();
});
