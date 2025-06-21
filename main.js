const startGameButton = document.querySelector(".js-start-game-button");
const resetgameButton = document.querySelector(".js-reset-button");
const hitButton = document.querySelector(".js-hit-button");
const standButton = document.querySelector(".js-stand-button");
const betButton = document.querySelector(".js-bet-button");

const resultDisplay = document.querySelector(".js-result-text");
const balanceDisplay = document.querySelector(".js-balance-value");

const dealerCardsDisplay = document.querySelector(".js-cards-dealer");
const playerCardsDisplay = document.querySelector(".js-cards-player");

const dealerValueDisplay = document.querySelector(".js-score-value-dealer");
const playerValueDisplay = document.querySelector(".js-score-value-player");

const chipHundred = document.querySelector(".js-chip-one-hundred");
const chipTwoHundred = document.querySelector(".js-chip-two-hundred");
const chipFiveHundred = document.querySelector(".js-chip-five-hundred");

let canHit = false;
let stand = false;
let standFunctionCalled = false;

let balance = 5000;
let turnCounter = 0;

let playerValue;
let dealerValue;

let playerHand = [];
let dealerHand = [];
let deck = [];

function buildDeckArray() {
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
  resultDisplay.textContent = "";
  balanceDisplay.textContent = balance;
  buildDeckArray();
  shuffleDeck();
  dealerHand = dealCard();
  playerHand = dealCard();
  loadValue();
  renderHands();
  turnCounter++;
  canHit = true;
  resultDisplay.textContent = "Game started! You can hit or stand.";
  resultHandler();
}

function renderHands() {
  dealerCardsDisplay.innerHTML = "";
  playerCardsDisplay.innerHTML = "";
  let pixelOffset = 0;

  dealerHand.forEach((card) => {
    const cardDealerElement = document.createElement("img");
    cardDealerElement.src = `Images/svg_playing_cards/fronts/${card}.svg`;
    cardDealerElement.style.position = "absolute";
    pixelOffset += 50;
    cardDealerElement.style.left = `${pixelOffset}px`;
    dealerCardsDisplay.appendChild(cardDealerElement);
  });

  pixelOffset = 0;

  playerHand.forEach((card) => {
    const cardPlayerElement = document.createElement("img");
    cardPlayerElement.src = `Images/svg_playing_cards/fronts/${card}.svg`;
    cardPlayerElement.style.position = "absolute";
    pixelOffset += 50;
    cardPlayerElement.style.left = `${pixelOffset}px`;
    playerCardsDisplay.appendChild(cardPlayerElement);
  });

  dealerValueDisplay.textContent = dealerValue;
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
  if (canHit) {
    playerHand.push(dealCard());
    loadValue();
    renderHands();
  }
  resultHandler();
}

function resultHandler() {
  if (playerValue === 21 && standFunctionCalled === false) {
    standFunctionCalled = true;
    standFunction();
  }
  if (dealerValue >= 17 && dealerValue < playerValue) {
    resultDisplay.textContent = "You win!";
    canHit = false;
    turnCounter = 0;
  }
  if (playerValue > 21) {
    resultDisplay.textContent = "You busted! Dealer wins.";
    canHit = false;
    turnCounter = 0;
  }
  if (dealerValue > 21) {
    resultDisplay.textContent = "Dealer busted! You win!";
    if (playerValue === 21 && playerHand.length === 2) {
      resultDisplay.textContent += " Blackjack!";
    }
  } else if (dealerValue > playerValue && stand) {
    resultDisplay.textContent = "Dealer wins!";
  } else if (dealerValue < playerValue && stand) {
    resultDisplay.textContent = "You win!";
    if (playerValue === 21 && playerHand.length === 2) {
      resultDisplay.textContent += " Blackjack!";
    }
  }
  if (dealerValue === playerValue && playerValue === 21) {
    resultDisplay.textContent = "It's a tie!";
  } else if (dealerValue === playerValue && stand) {
    resultDisplay.textContent = "It's a tie!";
  }
}

function standFunction() {
  canHit = false;
  stand = true;

  while (dealerValue < 17) {
    dealerHand.push(dealCard());
    loadValue();
    renderHands();
  }

  resultHandler();
}

startGameButton.addEventListener("click", () => {
  startGame();
});

hitButton.addEventListener("click", () => {
  if (turnCounter > 0 && canHit) {
    hitFunction();
  }
});

standButton.addEventListener("click", () => {
  if (turnCounter > 0) {
    standFunction();
  }
});

//napravi hidden card za dilera
//reset game napravi
//rad sa balansom napravi
//chips da oduzimaju
//napravi da ace bude 1 ili 11

//stavi before ili after element na ono umesto bordera
//media queries napravi
//napravi animaciju za izvlacenje karti i to
//mozda da napraviš da se kartice okreću
//mozda hover effect na celu stranu
//vrv redesign da uradis
