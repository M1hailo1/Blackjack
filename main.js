const startGameButton = document.querySelector(".js-start-game-button");
const resetGameButton = document.querySelector(".js-reset-button");
const hitButton = document.querySelector(".js-hit-button");
const standButton = document.querySelector(".js-stand-button");
const betButton = document.querySelector(".js-bet-button");
const muteButton = document.querySelector(".js-mute-button");

const resultDisplay = document.querySelector(".js-result-text");
const balanceDisplay = document.querySelector(".js-balance-value");

const dealerCardsDisplay = document.querySelector(".js-cards-dealer");
const playerCardsDisplay = document.querySelector(".js-cards-player");

const dealerValueDisplay = document.querySelector(".js-score-value-dealer");
const playerValueDisplay = document.querySelector(".js-score-value-player");

const betDisplay = document.querySelector(".js-bet-display");
const betAmountDisplay = document.querySelector(".js-bet-amount");
const chipHundred = document.querySelector(".js-chip-one-hundred");
const chipTwoHundred = document.querySelector(".js-chip-two-hundred");
const chipFiveHundred = document.querySelector(".js-chip-five-hundred");

let gameStarted = false;
let roundStarted = false;
let canHit = false;
let stand = false;
let revealDealerCard = false;

let bet = 0;
let balance = 5000;
let turnCounter = 0;

let rotateChipValue = 0;
let rotateChipValue200 = 0;
let rotateChipValue500 = 0;

let chipCount100 = 0;
let chipCount200 = 0;
let chipCount500 = 0;

let playerValue;
let dealerValue;

let playerHand = [];
let dealerHand = [];
let deck = [];

let opacityTimeout1 = null;
let opacityTimeout2 = null;
let opacityTimeout3 = null;

let actionPending = false;
const gameTimeouts = new Set();

function scheduleGameAction(callback, delay) {
  const timeout = setTimeout(() => {
    gameTimeouts.delete(timeout);
    callback();
  }, delay);
  gameTimeouts.add(timeout);
  return timeout;
}

function cancelGameAction(timeout) {
  clearTimeout(timeout);
  gameTimeouts.delete(timeout);
}

function clearGameTimeouts() {
  gameTimeouts.forEach(clearTimeout);
  gameTimeouts.clear();
}

const buttonClickAudio = new Audio("Audios/buttonClick.mp3");
const chipClickAudio = new Audio("Audios/chipClick.mp3");
const winAudio = new Audio("Audios/win.mp3");
const loseAudio = new Audio("Audios/lose.mp3");
const gameSounds = [buttonClickAudio, chipClickAudio, winAudio, loseAudio];
let soundMuted = false;
try {
  soundMuted = localStorage.getItem("blackjack.soundMuted") === "true";
} catch {}

function updateSoundState() {
  gameSounds.forEach((sound) => {
    sound.muted = soundMuted;
    if (soundMuted) {
      sound.pause();
      sound.currentTime = 0;
    }
  });
  muteButton.textContent = soundMuted ? "Sound: Off" : "Sound: On";
  muteButton.setAttribute("aria-pressed", String(soundMuted));
  muteButton.setAttribute(
    "aria-label",
    soundMuted ? "Unmute game sounds" : "Mute game sounds",
  );
}

muteButton.addEventListener("click", () => {
  soundMuted = !soundMuted;
  updateSoundState();
  try {
    localStorage.setItem("blackjack.soundMuted", String(soundMuted));
  } catch {}
});
updateSoundState();

function playSound(sound, volume, startTime = 0) {
  if (soundMuted) return;
  sound.volume = volume;
  sound.currentTime = startTime;
  sound.play().catch(() => {});
}

function buildDeckArray() {
  deck = [];
  const types = ["hearts", "diamonds", "clubs", "spades"];
  const values = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "jack",
    "queen",
    "king",
    "ace",
  ];
  for (let i = 0; i < types.length; i++) {
    for (let j = 0; j < values.length; j++) {
      deck.push(types[i] + "_" + values[j]);
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    let temp = deck[i];
    deck[i] = deck[randomIndex];
    deck[randomIndex] = temp;
  }
}

function startGame() {
  if (gameStarted === false) {
    playButtonSound();
    gameStarted = true;
    resultDisplay.textContent = "";
    balanceDisplay.textContent = balance;
    buildDeckArray();
    shuffleDeck();
    resultDisplay.textContent = "Game started! Place your bet and hit BET";
  }
}

function renderHands() {
  renderHand(dealerHand, dealerCardsDisplay, true);
  renderHand(playerHand, playerCardsDisplay, false);

  if (revealDealerCard) {
    dealerValueDisplay.textContent = dealerValue;
  } else {
    dealerValueDisplay.textContent = calculateHandValue(dealerHand.slice(1));
  }

  playerValueDisplay.textContent = playerValue;
}

function renderHand(hand, container, isDealer) {
  const wasHidden = container.dataset.revealed !== "true";
  container.dataset.revealed = String(isDealer && revealDealerCard);
  container.style.setProperty("--hand-size", Math.max(1, hand.length));
  const existingCards = Array.from(container.querySelectorAll(".playing-card"));
  const sameHand =
    existingCards.length <= hand.length &&
    existingCards.every((image, index) => image.dataset.card === hand[index]);
  if (!sameHand || existingCards.length === 0) container.replaceChildren();
  hand.forEach((card, index) => {
    const existingImage = sameHand ? existingCards[index] : null;
    const image = existingImage || document.createElement("img");
    image.dataset.card = card;
    const hidden = isDealer && index === 0 && !revealDealerCard;
    const source = hidden
      ? "Images/svg_playing_cards/backs/blue.svg"
      : `Images/svg_playing_cards/fronts/${card}.svg`;
    if (image.getAttribute("src") !== source) image.src = source;
    image.alt = hidden ? "Hidden dealer card" : card.replace("_", " ");
    image.classList.add("playing-card");
    image.style.setProperty("--card-index", index);
    image.style.setProperty(
      "--card-rotation",
      index % 2 === 0 ? "2deg" : "-2deg",
    );
    if (isDealer && index === 0 && revealDealerCard && wasHidden) {
      image.classList.add("covered-card-animate");
    } else if (!existingImage) {
      image.classList.add(
        isDealer ? "card-animate-dealer" : "card-animate-player",
      );
    }
    if (!existingImage) {
      image.addEventListener("animationend", () => {
        image.classList.remove(
          "card-animate-dealer",
          "card-animate-player",
          "covered-card-animate",
        );
      });
      container.appendChild(image);
    }
  });
}

function calculateHandValue(hand) {
  let total = 0;
  let aces = 0;
  hand.forEach((card) => {
    const value = card.split("_")[1];
    if (value === "ace") {
      total += 11;
      aces++;
    } else if (["jack", "queen", "king"].includes(value)) {
      total += 10;
    } else {
      total += Number(value);
    }
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function loadValue() {
  playerValue = calculateHandValue(playerHand);
  dealerValue = calculateHandValue(dealerHand);
}

function dealCard() {
  if (deck.length < 4) {
    buildDeckArray();
    shuffleDeck();
  }
  if (turnCounter === 0) {
    return deck.splice(0, 2);
  } else {
    return deck.pop();
  }
}

function hitFunction() {
  if (!roundStarted || !canHit || actionPending) return;
  actionPending = true;
  resultDisplay.textContent = "You can hit or stand.";
  turnCounter++;
  playerHand.push(dealCard());
  loadValue();
  renderHands();
  scheduleGameAction(() => {
    actionPending = false;
    resultHandler();
  }, 800);
}

function resetVariables() {
  roundStarted = false;
  canHit = false;
  stand = false;
  turnCounter = 0;
  bet = 0;
  betAmountDisplay.textContent = bet;
  Array.from(betDisplay.children).forEach((child) => {
    child.classList.add("chip-animation-gone");
  });
  const settledChips = Array.from(betDisplay.children);
  scheduleGameAction(() => {
    settledChips.forEach((chip) => chip.remove());
  }, 280);
}

function resultHandler() {
  if (!roundStarted) return;
  if (playerValue === 21 && !stand) {
    standFunction();
    return;
  }
  if (playerValue <= 21 && !stand) return;

  revealDealerCard = true;
  let payout = 0;
  if (playerValue > 21) {
    resultDisplay.textContent = "You busted! Dealer wins.";
    playLoseSound();
  } else if (dealerValue > 21 || playerValue > dealerValue) {
    resultDisplay.textContent =
      dealerValue > 21 ? "Dealer busted! You win!" : "You win!";
    if (playerValue === 21 && playerHand.length === 2) {
      resultDisplay.textContent += " Blackjack!";
    }
    payout = bet * 2;
    playWinSound();
  } else if (dealerValue === playerValue) {
    resultDisplay.textContent = "It's a tie!";
    payout = bet;
  } else {
    resultDisplay.textContent = "Dealer wins!";
    playLoseSound();
  }
  balance += payout;
  balanceDisplay.textContent = balance;
  resetVariables();
  renderHands();
  opacitySetter();
}

function standFunction() {
  if (!roundStarted || !canHit || actionPending) return;
  actionPending = true;
  canHit = false;
  stand = true;
  revealDealerCard = true;
  turnCounter++;

  while (dealerValue < 17) {
    dealerHand.push(dealCard());
    loadValue();
  }
  renderHands();
  scheduleGameAction(() => {
    actionPending = false;
    resultHandler();
  }, 800);
}

function opacitySetter() {
  cancelGameAction(opacityTimeout1);
  cancelGameAction(opacityTimeout2);
  cancelGameAction(opacityTimeout3);

  opacityTimeout1 = scheduleGameAction(() => {
    dealerCardsDisplay.style.opacity = "0.6";
    playerCardsDisplay.style.opacity = "0.6";
  }, 2000);

  opacityTimeout2 = scheduleGameAction(() => {
    dealerValueDisplay.style.opacity = "0";
    playerValueDisplay.style.opacity = "0";
  }, 5000);

  opacityTimeout3 = scheduleGameAction(() => {
    dealerValueDisplay.textContent = "Place your bets!";
    playerValueDisplay.textContent = "Never give up!";
    dealerValueDisplay.style.opacity = "1";
    playerValueDisplay.style.opacity = "1";
  }, 8000);
}

function playButtonSound() {
  playSound(buttonClickAudio, 0.4);
}

function playChipSound() {
  playSound(chipClickAudio, 0.4, 1.1);
}

function playWinSound() {
  playSound(winAudio, 0.25);
}

function playLoseSound() {
  playSound(loseAudio, 0.4);
}

function chipButtonFunction(value, rotateValue, leftPosition, chipCount) {
  if (!roundStarted && gameStarted) {
    playChipSound();
    if (balance >= value) {
      balance -= value;
      bet += value;
      betAmountDisplay.textContent = bet;
      balanceDisplay.textContent = balance;
      const betChip = document.createElement("div");
      betChip.classList.add("chip");
      betChip.dataset.value = value;
      betChip.style.position = "absolute";
      betChip.style.left = `${leftPosition}`;
      betChip.style.transform = `rotate(${rotateValue}deg)`;
      betChip.textContent = `${value} ${chipCount}x`;
      betDisplay.appendChild(betChip);

      betChip.classList.add("chip-animation");

      enableChipDrag(betChip, document.querySelector(".chips-player"));
      let refunded = false;
      betChip.addEventListener("click", () => {
        if (
          gameStarted &&
          !roundStarted &&
          !refunded &&
          betChip.isConnected &&
          !betChip.classList.contains("chip-animation-gone")
        ) {
          refunded = true;
          playChipSound();
          betChip.classList.add("chip-animation-down");
          balance += value;
          bet -= value;
          betAmountDisplay.textContent = bet;
          balanceDisplay.textContent = balance;
          betChip.style.pointerEvents = "none";
          scheduleGameAction(() => betChip.remove(), 280);
        }
      });
    } else {
      alert("Not enough balance!");
    }
  }
}

let chipDrag = null;

function cancelChipDrag() {
  if (!chipDrag) return;
  chipDrag.ghost?.remove();
  chipDrag.source.classList.remove("chip-drag-source");
  chipDrag.target.classList.remove(
    "bet-drop-active",
    "bet-drop-hover",
    "chip-return-target",
  );
  if (chipDrag.source.hasPointerCapture(chipDrag.pointerId)) {
    chipDrag.source.releasePointerCapture(chipDrag.pointerId);
  }
  chipDrag = null;
}

function isOverDropTarget(target, x, y) {
  const area = target.getBoundingClientRect();
  return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
}

function enableChipDrag(source, target = betDisplay) {
  let suppressClick = false;
  source.addEventListener(
    "click",
    (event) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }
    },
    true,
  );
  source.addEventListener("pointerdown", (event) => {
    suppressClick = false;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !gameStarted ||
      roundStarted ||
      source.classList.contains("chip-animation-gone") ||
      source.classList.contains("chip-animation-down")
    )
      return;
    cancelChipDrag();
    chipDrag = {
      source,
      target,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      ghost: null,
    };
    source.setPointerCapture(event.pointerId);
  });
  source.addEventListener("pointermove", (event) => {
    if (
      !chipDrag ||
      chipDrag.source !== source ||
      chipDrag.pointerId !== event.pointerId
    )
      return;
    if (
      !chipDrag.ghost &&
      Math.hypot(event.clientX - chipDrag.x, event.clientY - chipDrag.y) < 7
    )
      return;
    if (!chipDrag.ghost) {
      suppressClick = true;
      chipDrag.ghost = document.createElement("div");
      chipDrag.ghost.className = "chip chip-drag-ghost";
      chipDrag.ghost.textContent = source.textContent;
      chipDrag.ghost.setAttribute("aria-hidden", "true");
      document.body.appendChild(chipDrag.ghost);
      source.classList.add("chip-drag-source");
      target.classList.add("bet-drop-active");
      if (target !== betDisplay) target.classList.add("chip-return-target");
    }
    chipDrag.ghost.style.left = `${event.clientX}px`;
    chipDrag.ghost.style.top = `${event.clientY}px`;
    target.classList.toggle(
      "bet-drop-hover",
      isOverDropTarget(target, event.clientX, event.clientY),
    );
  });
  source.addEventListener("pointerup", (event) => {
    if (
      !chipDrag ||
      chipDrag.source !== source ||
      chipDrag.pointerId !== event.pointerId
    )
      return;
    const validDrop =
      chipDrag.ghost && isOverDropTarget(target, event.clientX, event.clientY);
    cancelChipDrag();
    if (validDrop && gameStarted && !roundStarted) source.click();
  });
  source.addEventListener("pointercancel", cancelChipDrag);
  source.addEventListener("lostpointercapture", cancelChipDrag);
}

[chipHundred, chipTwoHundred, chipFiveHundred].forEach((chip) =>
  enableChipDrag(chip),
);

chipHundred.addEventListener("click", () => {
  if (!betDisplay.querySelector(".chip[data-value='100']")) {
    rotateChipValue = 0;
    chipCount100 = 0;
  }
  chipCount100++;
  chipButtonFunction(100, rotateChipValue, "7%", chipCount100);
  rotateChipValue += 15;
});

chipTwoHundred.addEventListener("click", () => {
  if (!betDisplay.querySelector(".chip[data-value='200']")) {
    rotateChipValue200 = 0;
    chipCount200 = 0;
  }
  chipCount200++;
  chipButtonFunction(200, rotateChipValue200, "38%", chipCount200);
  rotateChipValue200 += 15;
});

chipFiveHundred.addEventListener("click", () => {
  if (!betDisplay.querySelector(".chip[data-value='500']")) {
    rotateChipValue500 = 0;
    chipCount500 = 0;
  }
  chipCount500++;
  chipButtonFunction(500, rotateChipValue500, "69%", chipCount500);
  rotateChipValue500 += 15;
});

startGameButton.addEventListener("click", () => {
  startGame();
});

hitButton.addEventListener("click", () => {
  if (turnCounter > 0 && canHit) {
    playButtonSound();
    hitFunction();
  }
});

standButton.addEventListener("click", () => {
  if (turnCounter > 0) {
    playButtonSound();
    standFunction();
  }
});

resetGameButton.addEventListener("click", () => {
  cancelChipDrag();
  playButtonSound();
  clearGameTimeouts();
  actionPending = false;
  playerValue = 0;
  dealerValue = 0;
  gameStarted = false;
  roundStarted = false;
  canHit = false;
  stand = false;
  revealDealerCard = false;
  turnCounter = 0;

  cancelGameAction(opacityTimeout1);
  cancelGameAction(opacityTimeout2);
  cancelGameAction(opacityTimeout3);

  playerHand = [];
  dealerHand = [];
  deck = [];

  bet = 0;
  betAmountDisplay.textContent = bet;
  rotateChipValue = 0;
  rotateChipValue200 = 0;
  rotateChipValue500 = 0;

  betDisplay.innerHTML = "";

  dealerCardsDisplay.style.opacity = "1";
  playerCardsDisplay.style.opacity = "1";

  dealerCardsDisplay.innerHTML = `
                <img
                  class='logo-image-one'
                  src='Images/svg_playing_cards/fronts/spades_jack.svg'
                  alt='logo'
                />
                <img
                  class='logo-image-two'
                  src='Images/svg_playing_cards/fronts/hearts_ace.svg'
                  alt='logo'
                />
                <h1 class='logo-title'>BLACKJACK</h1>`;
  playerCardsDisplay.innerHTML = `                <h2 class="how-to">
                  <span>How to Play:</span><br />Press Start Game<br />Choose
                  bet amount<br />Click bet<br />
                  <a
                    class="rules-link"
                    target="_blank"
                    href="https://www.blackjackapprenticeship.com/how-to-play-blackjack/"
                    >RULES</a
                  >
                </h2>`;
  dealerValueDisplay.style.opacity = "1";
  playerValueDisplay.style.opacity = "1";
  dealerValueDisplay.textContent = "";
  playerValueDisplay.textContent = "";
  resultDisplay.textContent = "Game reset! Click Start Game to play again.";

  balance = 5000;
  balanceDisplay.textContent = balance;
});

betButton.addEventListener("click", () => {
  if (gameStarted === true) {
    if (roundStarted === false) {
      cancelChipDrag();
      playButtonSound();
      if (bet === 0) {
        if (balance === 0) {
          resultDisplay.textContent =
            "No balance left. Game Over! Press Reset to start over.";
          return;
        } else {
          chipButtonFunction(100, rotateChipValue, "7%", 1);
          rotateChipValue = 0;
        }
      }
      cancelGameAction(opacityTimeout1);
      cancelGameAction(opacityTimeout2);
      cancelGameAction(opacityTimeout3);
      dealerHand = [];
      playerHand = [];
      playerValue = 0;
      dealerValue = 0;
      dealerCardsDisplay.style.opacity = "1";
      playerCardsDisplay.style.opacity = "1";
      dealerCardsDisplay.innerHTML = "";
      playerCardsDisplay.innerHTML = "";
      dealerValueDisplay.style.opacity = "1";
      playerValueDisplay.style.opacity = "1";
      dealerValueDisplay.textContent = "";
      playerValueDisplay.textContent = "";
      resultDisplay.textContent = "";
      renderHands();
      balanceDisplay.textContent = balance;
      canHit = false;
      actionPending = true;
      revealDealerCard = false;
      roundStarted = true;
      resultDisplay.textContent = "Dealing cards...";
      turnCounter = 0;
      scheduleGameAction(() => {
        dealerHand = dealCard();
        playerHand = dealCard();
        loadValue();
        actionPending = false;
        canHit = true;
        resultDisplay.textContent = "Game started! You can hit or stand.";
        renderHands();
        turnCounter++;
        resultHandler();
      }, 1200);
    }
  }
});
