const startGameButton = document.querySelector(".js-start-game-button");
const resetGameButton = document.querySelector(".js-reset-button");
const hitButton = document.querySelector(".js-hit-button");
const standButton = document.querySelector(".js-stand-button");
const betButton = document.querySelector(".js-bet-button");

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
let standFunctionCalled = false;
let revealDealerCard = false;

let bet = 0;
let balance = 5000;
let turnCounter = 0;
let rotateChipValue = 0;
let rotateChipValue200 = 0;
let rotateChipValue500 = 0;

let playerValue;
let dealerValue;

let playerHand = [];
let dealerHand = [];
let deck = [];

let opacityTimeout1 = null;
let opacityTimeout2 = null;
let opacityTimeout3 = null;

const buttonClickAudio = new Audio("Audios/buttonClick.mp3");

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
  for (let i = 0; i < deck.length; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
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
  dealerCardsDisplay.innerHTML = "";
  playerCardsDisplay.innerHTML = "";
  let pixelOffset = 25;
  let pixelOffsetY = 0;
  let pixelRotation = 0;

  dealerHand.forEach((card, index) => {
    const cardDealerElement = document.createElement("img");
    cardDealerElement.style.position = "absolute";
    pixelOffset += 50;
    if (index % 2 === 0) {
      pixelOffsetY = 0;
      pixelRotation = 2;
    } else {
      pixelOffsetY += 10;
      pixelRotation = -2;
    }
    cardDealerElement.style.left = `${pixelOffset}px`;
    cardDealerElement.style.top = `${pixelOffsetY}px`;
    cardDealerElement.style.transform = `rotate(${pixelRotation}deg)`;

    if (index === 0 && !revealDealerCard) {
      cardDealerElement.src = "Images/svg_playing_cards/backs/blue.svg";
    } else {
      cardDealerElement.src = `Images/svg_playing_cards/fronts/${card}.svg`;
    }

    dealerCardsDisplay.appendChild(cardDealerElement);
  });

  pixelOffset = 25;
  pixelOffsetY = 0;
  pixelRotation = 0;

  playerHand.forEach((card, index) => {
    const cardPlayerElement = document.createElement("img");
    cardPlayerElement.src = `Images/svg_playing_cards/fronts/${card}.svg`;
    cardPlayerElement.style.position = "absolute";
    pixelOffset += 50;
    if (index % 2 === 0) {
      pixelOffsetY = 0;
      pixelRotation = 2;
    } else {
      pixelOffsetY += 10;
      pixelRotation = -2;
    }
    cardPlayerElement.style.left = `${pixelOffset}px`;
    cardPlayerElement.style.top = `${pixelOffsetY}px`;
    cardPlayerElement.style.transform = `rotate(${pixelRotation}deg)`;
    playerCardsDisplay.appendChild(cardPlayerElement);
  });

  if (revealDealerCard) {
    dealerValueDisplay.textContent = dealerValue;
  } else {
    let hiddenValue = 0;
    dealerHand.slice(1).forEach((card) => {
      let value = card.split("_")[1];
      if (value === "jack" || value === "queen" || value === "king") {
        hiddenValue += 10;
      } else if (value === "ace") {
        hiddenValue += 11;
      } else if (!isNaN(value)) {
        hiddenValue += parseInt(value);
      }
    });
    dealerValueDisplay.textContent = hiddenValue;
  }

  playerValueDisplay.textContent = playerValue;
}

function loadValue() {
  playerValue = 0;
  dealerValue = 0;

  dealerHand.forEach((card) => {
    let value = card.split("_")[1];
    if (value === "jack" || value === "queen" || value === "king") {
      dealerValue += 10;
    } else if (value === "ace") {
      dealerValue += 11;
    } else if (!isNaN(value)) {
      dealerValue += parseInt(value);
    }
  });

  playerHand.forEach((card) => {
    let value = card.split("_")[1];
    if (value === "jack" || value === "queen" || value === "king") {
      playerValue += 10;
    } else if (value === "ace") {
      playerValue += 11;
    } else if (!isNaN(value)) {
      playerValue += parseInt(value);
    }
  });
}

function dealCard() {
  if (deck.length === 0) {
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
  resultDisplay.textContent = "You can hit or stand.";
  if (canHit) {
    turnCounter++;
    playerHand.push(dealCard());
    loadValue();
    renderHands();
    handleAces();
  }
  resultHandler();
}

function handleAces() {
  if (playerValue > 21) {
    playerHand.forEach((card) => {
      if (card.split("_")[1] === "ace" && playerValue > 21) {
        playerValue -= 10;
      }
    });
  }

  if (dealerValue > 21) {
    dealerHand.forEach((card) => {
      if (card.split("_")[1] === "ace" && dealerValue > 21) {
        dealerValue -= 10;
      }
    });
  }
  renderHands();
}

function resetVariables() {
  roundStarted = false;
  standFunctionCalled = false;
  canHit = false;
  stand = false;
  revealDealerCard = false;
  turnCounter = 0;
  bet = 0;
  betAmountDisplay.textContent = bet;
  betDisplay.innerHTML = "";
}

function resultHandler() {
  if (playerValue === 21 && standFunctionCalled === false) {
    standFunctionCalled = true;
    standFunction();
  }

  if (playerValue > 21) {
    resultDisplay.textContent = "You busted! Dealer wins.";
    canHit = false;
    revealDealerCard = true;
    turnCounter = 0;
    resetVariables();
    renderHands();
    opacitySetter();
  } else if (dealerValue > 21 && playerValue <= 21) {
    resultDisplay.textContent = "Dealer busted! You win!";
    balance = balance + bet * 2;
    balanceDisplay.textContent = balance;
    opacitySetter();
    if (playerValue === 21 && playerHand.length === 2) {
      resultDisplay.textContent += " Blackjack!";
    }
    resetVariables();
  } else if (dealerValue > playerValue && stand) {
    resultDisplay.textContent = "Dealer wins!";
    resetVariables();
    opacitySetter();
  } else if (dealerValue < playerValue && stand) {
    resultDisplay.textContent = "You win!";
    balance = balance + bet * 2;
    balanceDisplay.textContent = balance;
    opacitySetter();
    if (playerValue === 21 && playerHand.length === 2) {
      resultDisplay.textContent += " Blackjack!";
    }
    resetVariables();
    return;
  }

  if (dealerValue === playerValue && playerValue === 21) {
    resultDisplay.textContent = "It's a tie!";
    balance = balance + bet;
    balanceDisplay.textContent = balance;
    resetVariables();
    opacitySetter();
  } else if (dealerValue === playerValue && stand) {
    resultDisplay.textContent = "It's a tie!";
    balance = balance + bet;
    balanceDisplay.textContent = balance;
    resetVariables();
    opacitySetter();
  }
}

function standFunction() {
  canHit = false;
  stand = true;
  revealDealerCard = true;
  turnCounter++;

  while (dealerValue < 17) {
    dealerHand.push(dealCard());
    loadValue();
    handleAces();
    renderHands();
  }

  renderHands();
  resultHandler();
}

function opacitySetter() {
  clearTimeout(opacityTimeout1);
  clearTimeout(opacityTimeout2);
  clearTimeout(opacityTimeout3);

  opacityTimeout1 = setTimeout(() => {
    dealerCardsDisplay.style.opacity = "0.5";
    playerCardsDisplay.style.opacity = "0.5";

    opacityTimeout2 = setTimeout(() => {
      dealerValueDisplay.style.opacity = "0";
      playerValueDisplay.style.opacity = "0";
    }, 5000);

    opacityTimeout3 = setTimeout(() => {
      dealerValueDisplay.textContent = "Place your bets!";
      playerValueDisplay.textContent = "Never give up!";
      dealerValueDisplay.style.opacity = "1";
      playerValueDisplay.style.opacity = "1";
    }, 8000);
  }, 100);
}

function playButtonSound() {
  buttonClickAudio.volume = 0.4;
  buttonClickAudio.currentTime = 0;
  buttonClickAudio.play();
}

function chipButtonFunction(value, rotateValue, leftPosition) {
  if (!roundStarted && gameStarted) {
    playButtonSound();
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
      betChip.textContent = `${value}`;
      betDisplay.appendChild(betChip);

      betChip.addEventListener("click", () => {
        if (!roundStarted) {
          playButtonSound();
          betChip.remove();
          balance += value;
          bet -= value;
          betAmountDisplay.textContent = bet;
          balanceDisplay.textContent = balance;
          rotateValue -= 15;
        }
      });
    } else {
      alert("Not enough balance!");
    }
  }
}

chipHundred.addEventListener("click", () => {
  if (!betDisplay.querySelector(".chip[data-value='100']")) {
    rotateChipValue = 0;
  }
  chipButtonFunction(100, rotateChipValue, "7%");
  rotateChipValue += 15;
});

chipTwoHundred.addEventListener("click", () => {
  if (!betDisplay.querySelector(".chip[data-value='200']")) {
    rotateChipValue200 = 0;
  }
  chipButtonFunction(200, rotateChipValue200, "38%");
  rotateChipValue200 += 15;
});

chipFiveHundred.addEventListener("click", () => {
  if (!betDisplay.querySelector(".chip[data-value='500']")) {
    rotateChipValue500 = 0;
  }
  chipButtonFunction(500, rotateChipValue500, "69%");
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
  playButtonSound();
  gameStarted = false;
  roundStarted = false;
  canHit = false;
  stand = false;
  standFunctionCalled = false;
  revealDealerCard = false;
  turnCounter = 0;

  clearTimeout(opacityTimeout1);
  clearTimeout(opacityTimeout2);
  clearTimeout(opacityTimeout3);

  playerHand = [];
  dealerHand = [];
  deck = [];

  bet = 0;
  betAmountDisplay.textContent = bet;
  rotateChipValue = 0;
  rotateChipValue200 = 0;
  rotateChipValue500 = 0;

  betDisplay.innerHTML = "";

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
  dealerValueDisplay.textContent = "";
  playerValueDisplay.textContent = "";
  resultDisplay.textContent = "Game reset! Click Start Game to play again.";

  balance = 5000;
  balanceDisplay.textContent = balance;
});

betButton.addEventListener("click", () => {
  if (gameStarted === true) {
    if (roundStarted === false) {
      playButtonSound();
      if (bet === 0) {
        if (balance === 0) {
          resultDisplay.textContent =
            "No balance left. Game Over! Press Reset to start over.";
          return;
        } else {
          chipButtonFunction(100, rotateChipValue, "7%");
          rotateChipValue += 15;
        }
      }
      clearTimeout(opacityTimeout1);
      clearTimeout(opacityTimeout2);
      clearTimeout(opacityTimeout3);
      dealerHand = [];
      playerHand = [];
      playerValue = 0;
      dealerValue = 0;
      dealerCardsDisplay.style.opacity = "1";
      playerCardsDisplay.style.opacity = "1";
      dealerCardsDisplay.innerHTML = "";
      playerCardsDisplay.innerHTML = "";
      dealerValueDisplay.textContent = "";
      playerValueDisplay.textContent = "";
      resultDisplay.textContent = "";
      renderHands();
      balanceDisplay.textContent = balance;
      canHit = true;
      revealDealerCard = false;
      roundStarted = true;
      resultDisplay.textContent = "Dealing cards...";
      setTimeout(() => {
        dealerHand = dealCard();
        playerHand = dealCard();
        loadValue();
        handleAces();
        resultDisplay.textContent = "Game started! You can hit or stand.";
        renderHands();
        turnCounter++;
        resultHandler();
      }, 1200);
    }
  }
});

// dodaj audio na button clicks, audio za chips i audio na results

// dodaj count chipova na stacku

// stavi before ili after element na ono umesto bordera

// dodaj funckije da uklonis redudanstonst

// napravi animaciju za izvlacenje karti

// dodaj animaciju za chips

// media queries napravi

// mozda da napraviš da se hidden karta okrene
