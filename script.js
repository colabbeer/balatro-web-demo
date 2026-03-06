const suits = [
  { key: "spades", symbol: "♠", color: "black" },
  { key: "hearts", symbol: "♥", color: "red" },
  { key: "clubs", symbol: "♣", color: "black" },
  { key: "diamonds", symbol: "♦", color: "red" },
];

const ranks = [
  { key: "2", value: 2 },
  { key: "3", value: 3 },
  { key: "4", value: 4 },
  { key: "5", value: 5 },
  { key: "6", value: 6 },
  { key: "7", value: 7 },
  { key: "8", value: 8 },
  { key: "9", value: 9 },
  { key: "10", value: 10 },
  { key: "J", value: 10, face: true },
  { key: "Q", value: 10, face: true },
  { key: "K", value: 10, face: true },
  { key: "A", value: 11, ace: true },
];

const HAND_SIZE = 8;
const MAX_SELECTED = 5;
const MAX_JOKERS = 5;
const BASE_HANDS = 4;
const BASE_DISCARDS = 3;

const handDefinitions = [
  { key: "high-card", name: "高牌", chips: 5, mult: 1 },
  { key: "pair", name: "一对", chips: 10, mult: 2 },
  { key: "two-pair", name: "两对", chips: 20, mult: 2 },
  { key: "three-kind", name: "三条", chips: 30, mult: 3 },
  { key: "straight", name: "顺子", chips: 30, mult: 4 },
  { key: "flush", name: "同花", chips: 35, mult: 4 },
  { key: "full-house", name: "葫芦", chips: 40, mult: 4 },
  { key: "four-kind", name: "四条", chips: 60, mult: 7 },
  { key: "straight-flush", name: "同花顺", chips: 100, mult: 8 },
];

const blindRotation = [
  {
    tag: "SMALL BLIND",
    name: "Small Blind",
    reward: 3,
    multiplier: 1,
    applyRoundStart() {
      return { handsDelta: 0, discardsDelta: 0, notes: [] };
    },
    applyScore() {
      return [];
    },
    description: "没有额外限制。适合先观察手牌构筑。 ",
  },
  {
    tag: "BIG BLIND",
    name: "Big Blind",
    reward: 5,
    multiplier: 1.5,
    applyRoundStart() {
      return { handsDelta: 0, discardsDelta: 0, notes: [] };
    },
    applyScore() {
      return [];
    },
    description: "目标分提高。出手前先看好预估分数。 ",
  },
];

const bossBlindPool = [
  {
    tag: "BOSS BLIND",
    name: "The Hook",
    reward: 7,
    multiplier: 2,
    description: "开局少 1 次弃牌。",
    applyRoundStart() {
      return { handsDelta: 0, discardsDelta: -1, notes: ["The Hook 使弃牌 -1"] };
    },
    applyScore() {
      return [];
    },
  },
  {
    tag: "BOSS BLIND",
    name: "The Flint",
    reward: 7,
    multiplier: 2,
    description: "所有出牌筹码降低 25%。",
    applyRoundStart() {
      return { handsDelta: 0, discardsDelta: 0, notes: [] };
    },
    applyScore(context) {
      context.chips = Math.max(1, Math.floor(context.chips * 0.75));
      return ["The Flint 使筹码降低 25%"];
    },
  },
  {
    tag: "BOSS BLIND",
    name: "The Mask",
    reward: 7,
    multiplier: 2,
    description: "每张人头牌使倍率 -0.5。",
    applyRoundStart() {
      return { handsDelta: 0, discardsDelta: 0, notes: [] };
    },
    applyScore(context) {
      const faceCount = context.cards.filter((card) => card.face).length;
      if (faceCount > 0) {
        context.mult = Math.max(1, Math.round((context.mult - faceCount * 0.5) * 10) / 10);
        return [`The Mask 使倍率 -${faceCount * 0.5}`];
      }
      return [];
    },
  },
  {
    tag: "BOSS BLIND",
    name: "The Needle",
    reward: 8,
    multiplier: 2.2,
    description: "只给 1 次出牌，但奖励更高。",
    applyRoundStart() {
      return { handsDelta: -3, discardsDelta: 0, notes: ["The Needle 只保留 1 次出牌"] };
    },
    applyScore() {
      return [];
    },
  },
];

const jokerLibrary = [
  {
    id: "greedy-joker",
    name: "贪婪小丑",
    description: "每张方块牌使倍率 +1。",
    rarity: "Common",
    cost: 4,
    apply(context) {
      const count = context.cards.filter((card) => card.suit.key === "diamonds").length;
      if (count > 0) {
        context.mult += count;
        context.notes.push(`贪婪小丑使倍率 +${count}`);
      }
    },
  },
  {
    id: "lusty-joker",
    name: "欲望小丑",
    description: "每张红桃牌使倍率 +1。",
    rarity: "Common",
    cost: 4,
    apply(context) {
      const count = context.cards.filter((card) => card.suit.key === "hearts").length;
      if (count > 0) {
        context.mult += count;
        context.notes.push(`欲望小丑使倍率 +${count}`);
      }
    },
  },
  {
    id: "smiley-face",
    name: "笑脸",
    description: "每张人头牌提供 +4 倍率。",
    rarity: "Uncommon",
    cost: 6,
    apply(context) {
      const count = context.cards.filter((card) => card.face).length;
      if (count > 0) {
        const bonus = count * 4;
        context.mult += bonus;
        context.notes.push(`笑脸使倍率 +${bonus}`);
      }
    },
  },
  {
    id: "banner",
    name: "旗帜",
    description: "每有 1 次剩余弃牌，筹码 +30。",
    rarity: "Common",
    cost: 5,
    apply(context) {
      const bonus = context.state.discardsLeft * 30;
      if (bonus > 0) {
        context.chips += bonus;
        context.notes.push(`旗帜使筹码 +${bonus}`);
      }
    },
  },
  {
    id: "abstract-joker",
    name: "抽象小丑",
    description: "每张已拥有的小丑使倍率 +2。",
    rarity: "Common",
    cost: 6,
    apply(context) {
      const bonus = context.state.jokers.length * 2;
      if (bonus > 0) {
        context.mult += bonus;
        context.notes.push(`抽象小丑使倍率 +${bonus}`);
      }
    },
  },
  {
    id: "runner",
    name: "奔跑者",
    description: "顺子或同花顺时，筹码 +100。",
    rarity: "Uncommon",
    cost: 7,
    apply(context) {
      if (context.hand.name === "顺子" || context.hand.name === "同花顺") {
        context.chips += 100;
        context.notes.push("奔跑者使筹码 +100");
      }
    },
  },
  {
    id: "half-joker",
    name: "半张小丑",
    description: "如果只打出 3 张或更少牌，倍率 +8。",
    rarity: "Common",
    cost: 5,
    apply(context) {
      if (context.cards.length <= 3) {
        context.mult += 8;
        context.notes.push("半张小丑使倍率 +8");
      }
    },
  },
  {
    id: "photograph",
    name: "照片",
    description: "第一张人头牌触发时，倍率 x2。",
    rarity: "Rare",
    cost: 8,
    apply(context) {
      const hasFace = context.cards.some((card) => card.face);
      if (hasFace) {
        context.mult *= 2;
        context.notes.push("照片使倍率 x2");
      }
    },
  },
];

const ui = {
  body: document.body,
  hand: document.querySelector("#hand"),
  jokerList: document.querySelector("#joker-list"),
  shopPanel: document.querySelector("#shop-panel"),
  shopList: document.querySelector("#shop-list"),
  playButton: document.querySelector("#play-button"),
  discardButton: document.querySelector("#discard-button"),
  sortRankButton: document.querySelector("#sort-rank-button"),
  sortSuitButton: document.querySelector("#sort-suit-button"),
  resetButton: document.querySelector("#reset-button"),
  rerollButton: document.querySelector("#reroll-button"),
  nextRoundButton: document.querySelector("#next-round-button"),
  selectedCount: document.querySelector("#selected-count"),
  totalScore: document.querySelector("#total-score"),
  roundScore: document.querySelector("#round-score"),
  targetScore: document.querySelector("#target-score"),
  blindReward: document.querySelector("#blind-reward"),
  blindTag: document.querySelector("#blind-tag"),
  blindName: document.querySelector("#blind-name"),
  blindDesc: document.querySelector("#blind-desc"),
  handsLeft: document.querySelector("#hands-left"),
  discardsLeft: document.querySelector("#discards-left"),
  deckLeft: document.querySelector("#deck-left"),
  deckLeftDuplicate: document.querySelector("#deck-left-duplicate"),
  anteLevel: document.querySelector("#ante-level"),
  money: document.querySelector("#money"),
  moneyDuplicate: document.querySelector("#money-duplicate"),
  previewHand: document.querySelector("#preview-hand"),
  previewChips: document.querySelector("#preview-chips"),
  previewMult: document.querySelector("#preview-mult"),
  previewScore: document.querySelector("#preview-score"),
  previewNotes: document.querySelector("#preview-notes"),
  handLevelTrigger: document.querySelector("#hand-level-trigger"),
  handLevelPopover: document.querySelector("#hand-level-popover"),
  handLevelName: document.querySelector("#hand-level-name"),
  handLevelDetail: document.querySelector("#hand-level-detail"),
  lastHandName: document.querySelector("#last-hand-name"),
  lastChips: document.querySelector("#last-chips"),
  lastMult: document.querySelector("#last-mult"),
  lastScore: document.querySelector("#last-score"),
  phaseLabel: document.querySelector("#phase-label"),
  log: document.querySelector("#log"),
};

const state = {
  deck: [],
  hand: [],
  selected: new Set(),
  enteringIds: new Set(),
  leavingCards: [],
  actionCards: [],
  jokers: [],
  shop: [],
  ante: 1,
  blindIndex: 0,
  currentBlind: null,
  totalScore: 0,
  roundScore: 0,
  money: 4,
  handsLeft: BASE_HANDS,
  discardsLeft: BASE_DISCARDS,
  handsPlayedThisRound: 0,
  roundActive: true,
  gameOver: false,
  animating: false,
  lastScoredHandKey: null,
  handLevels: Object.fromEntries(
    handDefinitions.map((hand) => [hand.key, { level: 1, extraChips: 0, extraMult: 0 }]),
  ),
  lastResult: {
    handName: "未出牌",
    chips: 0,
    mult: 0,
    score: 0,
  },
};

function createDeck() {
  const deck = [];
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      deck.push({
        id: `${suit.key}-${rank.key}-${Math.random().toString(16).slice(2, 8)}`,
        suit,
        rank,
        face: Boolean(rank.face),
      });
    });
  });
  return shuffle(deck);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cloneJoker(id) {
  const base = jokerLibrary.find((joker) => joker.id === id);
  return base ? { ...base } : null;
}

function pickBlind() {
  if (state.blindIndex < blindRotation.length) {
    return { ...blindRotation[state.blindIndex] };
  }
  const boss = bossBlindPool[(state.ante - 1) % bossBlindPool.length];
  return { ...boss };
}

function drawCards(count) {
  const drawnCards = [];
  for (let index = 0; index < count; index += 1) {
    if (state.deck.length === 0) {
      state.deck = createDeck();
      addLog("牌堆重新洗牌。", "系统");
    }
    const card = state.deck.pop();
    if (card) {
      state.hand.push(card);
      drawnCards.push(card);
    }
  }
  return drawnCards;
}

function fillHand() {
  const missing = HAND_SIZE - state.hand.length;
  if (missing > 0) {
    return drawCards(missing);
  }
  return [];
}

function startGame() {
  state.deck = createDeck();
  state.hand = [];
  state.selected = new Set();
  state.enteringIds = new Set();
  state.leavingCards = [];
  state.actionCards = [];
  state.jokers = [cloneJoker("lusty-joker")];
  state.shop = [];
  state.ante = 1;
  state.blindIndex = 0;
  state.totalScore = 0;
  state.roundScore = 0;
  state.money = 4;
  state.handsLeft = BASE_HANDS;
  state.discardsLeft = BASE_DISCARDS;
  state.handsPlayedThisRound = 0;
  state.roundActive = true;
  state.gameOver = false;
  state.animating = false;
  state.lastScoredHandKey = null;
  state.handLevels = Object.fromEntries(
    handDefinitions.map((hand) => [hand.key, { level: 1, extraChips: 0, extraMult: 0 }]),
  );
  state.lastResult = { handName: "未出牌", chips: 0, mult: 0, score: 0 };
  ui.log.innerHTML = "";
  addLog("新的一局开始。起手赠送 1 张欲望小丑。", "系统");
  void startBlind();
}

async function startBlind() {
  state.roundScore = 0;
  state.handsPlayedThisRound = 0;
  state.hand = [];
  state.selected = new Set();
  state.enteringIds = new Set();
  state.leavingCards = [];
  state.actionCards = [];
  state.roundActive = true;
  state.currentBlind = pickBlind();
  state.handsLeft = BASE_HANDS;
  state.discardsLeft = BASE_DISCARDS;
  const startModifiers = state.currentBlind.applyRoundStart();
  state.handsLeft = Math.max(1, state.handsLeft + startModifiers.handsDelta);
  state.discardsLeft = Math.max(0, state.discardsLeft + startModifiers.discardsDelta);
  sortHandState("rank");
  ui.shopPanel.classList.add("hidden");
  const extraNotes = startModifiers.notes.length > 0 ? ` ${startModifiers.notes.join("，")}` : "";
  addLog(
    `进入 ${state.currentBlind.name}，目标分 ${getTargetScore()}。${extraNotes}`,
    "Blind",
  );
  render();
  await refillHandAnimated();
}

function getTargetScore() {
  const base = 300 + (state.ante - 1) * 220;
  return Math.round(base * state.currentBlind.multiplier);
}

function getHandLevelData(handKey) {
  return state.handLevels[handKey];
}

function getScoringContext(cards) {
  if (cards.length === 0) {
    return null;
  }

  const hand = evaluateHand(cards);
  const handLevel = getHandLevelData(hand.key);
  const rankedChipValue = cards.reduce((sum, card) => sum + card.rank.value, 0);
  const context = {
    hand,
    cards,
    chips: hand.chips + handLevel.extraChips + rankedChipValue,
    mult: hand.mult + handLevel.extraMult,
    notes: [
      `${hand.name} Lv.${handLevel.level} 提供 ${hand.chips + handLevel.extraChips} 筹码 / x${hand.mult + handLevel.extraMult}`,
    ],
    state,
  };

  state.jokers.forEach((joker) => joker.apply(context));
  const blindNotes = state.currentBlind.applyScore(context) || [];
  context.notes.push(...blindNotes);
  context.score = Math.max(1, Math.round(context.chips * context.mult));
  return context;
}

function render() {
  renderHand();
  renderJokers();
  renderShop();
  renderStats();
  renderPreview();
}

function renderHand() {
  ui.hand.innerHTML = "";
  const visibleCards = [...state.hand];
  if (state.leavingCards.length > 0) {
    visibleCards.push(...state.leavingCards);
  }
  if (state.actionCards.length > 0) {
    visibleCards.push(...state.actionCards);
  }

  visibleCards.forEach((card, index) => {
    const cardEl = document.createElement("button");
    const selected = state.selected.has(card.id);
    const entering = state.enteringIds.has(card.id);
    const leaving = state.leavingCards.some((leavingCard) => leavingCard.id === card.id);
    const actionCard = state.actionCards.find((activeCard) => activeCard.id === card.id);
    const actionClass = actionCard ? actionCard.actionClass : "";
    cardEl.className = `card ${card.suit.color} ${selected ? "selected" : ""} ${entering ? "entering" : ""} ${leaving ? "leaving" : ""} ${actionClass}`;
    cardEl.style.setProperty("--delay", `${Math.min(index * 40, 240)}ms`);
    cardEl.innerHTML = `
      <div class="card-corner">
        <div class="card-rank">${card.rank.key}</div>
        <div class="card-suit-mini">${card.suit.symbol}</div>
      </div>
      ${buildCardCenter(card)}
      <div class="card-corner bottom">
        <div class="card-rank">${card.rank.key}</div>
        <div class="card-suit-mini">${card.suit.symbol}</div>
      </div>
      <div class="card-chip">+${card.rank.value}</div>
    `;
    if (!leaving && !actionCard) {
      cardEl.addEventListener("click", () => toggleCard(card.id));
    } else {
      cardEl.disabled = true;
    }
    ui.hand.appendChild(cardEl);
  });
}

function renderJokers() {
  ui.jokerList.innerHTML = "";
  const slots = [...state.jokers];
  while (slots.length < MAX_JOKERS) {
    slots.push(null);
  }

  slots.forEach((joker) => {
    const el = document.createElement("article");
    el.className = "joker-card special-card";
    if (!joker) {
      el.innerHTML = `
        <div class="special-frame empty">
          <div class="special-ribbon">EMPTY</div>
          <div class="special-art">?</div>
          <h3>空槽</h3>
          <p>在商店购买新小丑来填满构筑。</p>
          <div class="joker-badges"><span class="joker-badge">SLOT</span></div>
        </div>
      `;
    } else {
      const visual = getJokerVisual(joker.id);
      el.innerHTML = `
        <div class="special-frame ${visual.theme}">
          <div class="special-ribbon">${joker.rarity}</div>
          <div class="special-art">${visual.glyph}</div>
          <h3>${joker.name}</h3>
          <p>${joker.description}</p>
          <div class="joker-badges">
            <span class="joker-badge">${visual.label}</span>
          </div>
        </div>
      `;
    }
    ui.jokerList.appendChild(el);
  });
}

function renderShop() {
  ui.shopList.innerHTML = "";
  if (ui.shopPanel.classList.contains("hidden")) {
    return;
  }

  if (state.shop.length === 0) {
    ui.shopList.innerHTML = "<article class='shop-card'><h3>售罄</h3><p>没有新货了，直接进入下一个 Blind。</p></article>";
    return;
  }

  state.shop.forEach((joker) => {
    const affordable = state.money >= joker.cost;
    const hasSpace = state.jokers.length < MAX_JOKERS;
    const card = document.createElement("article");
    const visual = getJokerVisual(joker.id);
    card.className = "shop-card special-card";
    card.innerHTML = `
      <div class="special-frame ${visual.theme}">
        <div class="special-ribbon">${joker.rarity}</div>
        <div class="special-art">${visual.glyph}</div>
        <h3>${joker.name}</h3>
        <p>${joker.description}</p>
        <div class="shop-meta">
          <span class="shop-rarity">${visual.label}</span>
          <span class="shop-price">$${joker.cost}</span>
        </div>
      </div>
    `;
    const button = document.createElement("button");
    button.className = affordable && hasSpace ? "primary" : "secondary";
    button.disabled = !affordable || !hasSpace;
    button.textContent = hasSpace ? (affordable ? "购买" : "金币不足") : "小丑槽已满";
    button.addEventListener("click", () => buyJoker(joker.id));
    card.appendChild(button);
    ui.shopList.appendChild(card);
  });
}

function renderStats() {
  ui.body.dataset.scene = state.gameOver ? "gameover" : (state.roundActive ? "run" : "shop");
  ui.selectedCount.textContent = `${state.selected.size}/5`;
  ui.totalScore.textContent = state.totalScore;
  ui.roundScore.textContent = state.roundScore;
  ui.targetScore.textContent = getTargetScore();
  ui.blindReward.textContent = `$${state.currentBlind.reward}`;
  ui.blindTag.textContent = state.currentBlind.tag;
  ui.blindName.textContent = state.currentBlind.name;
  ui.blindDesc.textContent = state.currentBlind.description;
  ui.handsLeft.textContent = state.handsLeft;
  ui.discardsLeft.textContent = state.discardsLeft;
  ui.deckLeft.textContent = state.deck.length;
  ui.deckLeftDuplicate.textContent = state.deck.length;
  ui.anteLevel.textContent = state.ante;
  ui.money.textContent = state.money;
  ui.moneyDuplicate.textContent = `$${state.money}`;
  ui.lastHandName.textContent = state.lastResult.handName;
  ui.lastChips.textContent = state.lastResult.chips;
  ui.lastMult.textContent = state.lastResult.mult;
  ui.lastScore.textContent = state.lastResult.score;
  ui.phaseLabel.textContent = state.gameOver ? "游戏结束" : (state.roundActive ? "回合进行中" : "商店");
  ui.playButton.disabled = state.selected.size === 0 || !state.roundActive || state.gameOver;
  ui.playButton.disabled = ui.playButton.disabled || state.animating;
  ui.discardButton.disabled = state.selected.size === 0 || !state.roundActive || state.gameOver || state.discardsLeft <= 0 || state.animating;
  ui.nextRoundButton.disabled = state.roundActive || state.gameOver || state.animating;
  ui.rerollButton.disabled = state.roundActive || state.gameOver || state.money <= 0 || state.animating;
}

function renderPreview() {
  const selectedCards = getSelectedCards();
  const context = getScoringContext(selectedCards);
  if (!context) {
    ui.previewHand.textContent = "未选择";
    ui.previewChips.textContent = "0";
    ui.previewMult.textContent = "x0";
    ui.previewScore.textContent = "0";
    ui.previewNotes.textContent = "选择牌后会显示小丑与 Blind 修正。";
    ui.handLevelName.textContent = "未选择";
    ui.handLevelDetail.textContent = "选择牌后会显示当前牌型等级、基础筹码和倍率成长。";
    return;
  }

  ui.previewHand.textContent = context.hand.name;
  ui.previewChips.textContent = context.chips;
  ui.previewMult.textContent = `x${formatNumber(context.mult)}`;
  ui.previewScore.textContent = context.score;
  ui.previewNotes.textContent = context.notes.join("，");
  const levelData = getHandLevelData(context.hand.key);
  ui.handLevelName.textContent = `${context.hand.name} Lv.${levelData.level}`;
  ui.handLevelDetail.textContent = `基础 ${context.hand.chips + levelData.extraChips} 筹码，倍率 x${context.hand.mult + levelData.extraMult}。每次用这类牌型过关后继续升级。`;
}

function toggleCard(cardId) {
  if (!state.roundActive || state.gameOver || state.animating) {
    return;
  }
  if (state.selected.has(cardId)) {
    state.selected.delete(cardId);
  } else if (state.selected.size < MAX_SELECTED) {
    state.selected.add(cardId);
  }
  render();
}

function getSelectedCards() {
  return state.hand.filter((card) => state.selected.has(card.id));
}

async function playSelected() {
  const cards = getSelectedCards();
  if (cards.length === 0 || state.animating) {
    return;
  }

  const context = getScoringContext(cards);
  state.roundScore += context.score;
  state.totalScore += context.score;
  state.money += Math.max(1, Math.floor(context.score / 150));
  state.handsLeft -= 1;
  state.handsPlayedThisRound += 1;
  state.lastScoredHandKey = context.hand.key;
  state.lastResult = {
    handName: context.hand.name,
    chips: context.chips,
    mult: formatNumber(context.mult),
    score: context.score,
  };

  await removeCardsAnimated(cards, "played");
  addLog(`${context.hand.name} 打出 ${context.score} 分。${context.notes.join("，")}`, "出牌");

  if (state.roundScore >= getTargetScore()) {
    state.animating = false;
    winBlind();
  } else if (state.handsLeft <= 0) {
    state.animating = false;
    loseRun();
  } else {
    await refillHandAnimated();
  }

  render();
}

async function discardSelected() {
  if (state.discardsLeft <= 0 || state.animating) {
    return;
  }
  const cards = getSelectedCards();
  if (cards.length === 0) {
    return;
  }

  state.discardsLeft -= 1;
  await removeCardsAnimated(cards, "discarded");
  addLog(`弃掉 ${cards.length} 张牌并补满手牌。`, "弃牌");
  await refillHandAnimated();
  render();
}

function removeCards(cards) {
  const ids = new Set(cards.map((card) => card.id));
  state.hand = state.hand.filter((card) => !ids.has(card.id));
}

function buyJoker(id) {
  const index = state.shop.findIndex((joker) => joker.id === id);
  if (index === -1 || state.jokers.length >= MAX_JOKERS) {
    return;
  }
  const joker = state.shop[index];
  if (state.money < joker.cost) {
    return;
  }
  state.money -= joker.cost;
  state.jokers.push({ ...joker });
  state.shop.splice(index, 1);
  addLog(`购买了 ${joker.name}。`, "商店");
  render();
}

function rerollShop() {
  if (state.money <= 0 || state.roundActive || state.gameOver || state.animating) {
    return;
  }
  state.money -= 1;
  populateShop();
  addLog("花费 $1 刷新商店。", "商店");
  render();
}

function populateShop() {
  const available = jokerLibrary.filter(
    (candidate) => !state.jokers.some((joker) => joker.id === candidate.id),
  );
  state.shop = shuffle(available).slice(0, 3).map((joker) => ({ ...joker }));
}

function winBlind() {
  state.roundActive = false;
  const reward = state.currentBlind.reward;
  state.money += reward;
  upgradeLastHand();
  addLog(`击败 ${state.currentBlind.name}，获得 $${reward}。`, "胜利");
  populateShop();
  ui.shopPanel.classList.remove("hidden");
}

function upgradeLastHand() {
  if (!state.lastScoredHandKey) {
    return;
  }
  const data = state.handLevels[state.lastScoredHandKey];
  data.level += 1;
  data.extraChips += 10;
  if (data.level % 2 === 0) {
    data.extraMult += 1;
  }
  const hand = handDefinitions.find((item) => item.key === state.lastScoredHandKey);
  addLog(`${hand.name} 升到 Lv.${data.level}。`, "升级");
}

function loseRun() {
  state.roundActive = false;
  state.gameOver = true;
  ui.shopPanel.classList.add("hidden");
  addLog(`未能击败 ${state.currentBlind.name}，本局结束。`, "失败");
}

function nextBlind() {
  if (state.roundActive || state.gameOver || state.animating) {
    return;
  }

  if (state.blindIndex < blindRotation.length) {
    state.blindIndex += 1;
  } else {
    state.ante += 1;
    state.blindIndex = 0;
  }
  state.shop = [];
  void startBlind();
}

function evaluateHand(cards) {
  const values = cards.map((card) => getRankOrderValue(card.rank.key)).sort((a, b) => a - b);
  const suitsInHand = new Set(cards.map((card) => card.suit.key));
  const counts = Array.from(
    cards.reduce((map, card) => {
      const current = map.get(card.rank.key) || 0;
      map.set(card.rank.key, current + 1);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => b - a);

  const isFlush = cards.length === 5 && suitsInHand.size === 1;
  const isStraight = checkStraight(values);

  if (cards.length === 5 && isFlush && isStraight) {
    return handDefinitions[8];
  }
  if (counts[0] === 4) {
    return handDefinitions[7];
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return handDefinitions[6];
  }
  if (cards.length === 5 && isFlush) {
    return handDefinitions[5];
  }
  if (cards.length === 5 && isStraight) {
    return handDefinitions[4];
  }
  if (counts[0] === 3) {
    return handDefinitions[3];
  }
  if (counts[0] === 2 && counts[1] === 2) {
    return handDefinitions[2];
  }
  if (counts[0] === 2) {
    return handDefinitions[1];
  }
  return handDefinitions[0];
}

function getRankOrderValue(key) {
  const order = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  return order.indexOf(key) + 2;
}

function checkStraight(values) {
  if (values.length !== 5) {
    return false;
  }
  const unique = [...new Set(values)];
  if (unique.length !== 5) {
    return false;
  }
  const regular = unique.every((value, index) => index === 0 || value - unique[index - 1] === 1);
  if (regular) {
    return true;
  }
  const lowAce = unique.map((value) => (value === 14 ? 1 : value)).sort((a, b) => a - b);
  return lowAce.every((value, index) => index === 0 || value - lowAce[index - 1] === 1);
}

function sortHand(mode) {
  sortHandState(mode);
  renderHand();
}

function sortHandState(mode) {
  const suitOrder = ["spades", "hearts", "clubs", "diamonds"];
  state.hand.sort((left, right) => {
    if (mode === "rank") {
      const diff = getRankOrderValue(left.rank.key) - getRankOrderValue(right.rank.key);
      if (diff !== 0) {
        return diff;
      }
      return suitOrder.indexOf(left.suit.key) - suitOrder.indexOf(right.suit.key);
    }
    const suitDiff = suitOrder.indexOf(left.suit.key) - suitOrder.indexOf(right.suit.key);
    if (suitDiff !== 0) {
      return suitDiff;
    }
    return getRankOrderValue(left.rank.key) - getRankOrderValue(right.rank.key);
  });
}

function formatNumber(value) {
  return Number.isInteger(value) ? value : value.toFixed(1);
}

function getJokerVisual(id) {
  const visuals = {
    "greedy-joker": { theme: "gold", glyph: "♦", label: "DIAMOND" },
    "lusty-joker": { theme: "rose", glyph: "♥", label: "HEART" },
    "smiley-face": { theme: "sun", glyph: ":)", label: "FACE" },
    banner: { theme: "teal", glyph: "⚑", label: "BANNER" },
    "abstract-joker": { theme: "violet", glyph: "◎", label: "ABSTRACT" },
    runner: { theme: "green", glyph: "↗", label: "STRAIGHT" },
    "half-joker": { theme: "split", glyph: "◐", label: "HALF" },
    photograph: { theme: "mono", glyph: "▣", label: "PHOTO" },
  };
  return visuals[id] || { theme: "gold", glyph: "J", label: "JOKER" };
}

function buildCardCenter(card) {
  if (card.rank.ace) {
    return `
      <div class="card-center ace-layout">
        <div class="card-suit ace-suit">${card.suit.symbol}</div>
      </div>
    `;
  }

  if (card.face) {
    return `
      <div class="card-center face-layout">
        <div class="face-glyph">${card.rank.key}</div>
        <div class="face-suit">${card.suit.symbol}</div>
      </div>
    `;
  }

  return `
    <div class="card-center pip-layout">
      ${buildPips(card)}
    </div>
  `;
}

function buildPips(card) {
  const pipPositions = {
    "2": [[50, 22, 0], [50, 78, 180]],
    "3": [[50, 18, 0], [50, 50, 0], [50, 82, 180]],
    "4": [[28, 22, 0], [72, 22, 0], [28, 78, 180], [72, 78, 180]],
    "5": [[28, 22, 0], [72, 22, 0], [50, 50, 0], [28, 78, 180], [72, 78, 180]],
    "6": [[28, 18, 0], [72, 18, 0], [28, 50, 0], [72, 50, 0], [28, 82, 180], [72, 82, 180]],
    "7": [[28, 16, 0], [72, 16, 0], [50, 34, 0], [28, 50, 0], [72, 50, 0], [28, 84, 180], [72, 84, 180]],
    "8": [[28, 16, 0], [72, 16, 0], [28, 38, 0], [72, 38, 0], [28, 62, 180], [72, 62, 180], [28, 84, 180], [72, 84, 180]],
    "9": [[28, 14, 0], [72, 14, 0], [28, 34, 0], [72, 34, 0], [50, 50, 0], [28, 66, 180], [72, 66, 180], [28, 86, 180], [72, 86, 180]],
    "10": [[28, 14, 0], [72, 14, 0], [28, 30, 0], [72, 30, 0], [50, 42, 0], [50, 58, 180], [28, 70, 180], [72, 70, 180], [28, 86, 180], [72, 86, 180]],
  };
  return (pipPositions[card.rank.key] || []).map(([left, top, rotate]) => `
    <span class="pip" style="left:${left}%; top:${top}%; transform:translate(-50%, -50%) rotate(${rotate}deg);">${card.suit.symbol}</span>
  `).join("");
}

async function removeCardsAnimated(cards, mode = "discarded") {
  state.animating = true;
  const actionClass = mode === "played" ? "playing" : "discarding";
  state.actionCards = cards.map((card) => ({ ...card, actionClass }));
  removeCards(cards);
  state.selected.clear();
  sortHandState("rank");
  render();
  await wait(mode === "played" ? 360 : 260);
  state.actionCards = [];
  render();
}

async function refillHandAnimated() {
  state.animating = true;
  const drawn = fillHand();
  sortHandState("rank");
  state.enteringIds = new Set(drawn.map((card) => card.id));
  render();
  if (drawn.length > 0) {
    await wait(420);
  }
  state.enteringIds = new Set();
  state.animating = false;
  render();
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function toggleLevelPopover() {
  ui.handLevelPopover.classList.toggle("visible");
}

function hideLevelPopover() {
  ui.handLevelPopover.classList.remove("visible");
}

function addLog(message, label) {
  const entry = document.createElement("article");
  entry.className = "log-entry";
  entry.innerHTML = `
    <small>${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>
    <strong>${label}</strong>
    <div>${message}</div>
  `;
  ui.log.prepend(entry);
  while (ui.log.children.length > 5) {
    ui.log.removeChild(ui.log.lastElementChild);
  }
}

ui.playButton.addEventListener("click", playSelected);
ui.discardButton.addEventListener("click", discardSelected);
ui.sortRankButton.addEventListener("click", () => sortHand("rank"));
ui.sortSuitButton.addEventListener("click", () => sortHand("suit"));
ui.resetButton.addEventListener("click", startGame);
ui.rerollButton.addEventListener("click", rerollShop);
ui.nextRoundButton.addEventListener("click", nextBlind);
ui.handLevelTrigger.addEventListener("click", toggleLevelPopover);
ui.handLevelTrigger.addEventListener("blur", () => {
  window.setTimeout(() => {
    if (!ui.handLevelPopover.matches(":focus")) {
      hideLevelPopover();
    }
  }, 0);
});
ui.handLevelPopover.addEventListener("blur", hideLevelPopover);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".hand-preview-cell")) {
    hideLevelPopover();
  }
});

startGame();
