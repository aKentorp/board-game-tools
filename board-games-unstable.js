let boardGames = [];
let retryAttempt = 0;
let timerInterval;
let startTime;
let playerCount;
let isTimerRunning = false;

let currentPage = 0;
const itemsPerPage = 10;

document.getElementById("searchUserButton").addEventListener("click", function() {
    // Reset currentPage to load from the beginning
    currentPage = 0;

    // Load games
    loadGames(currentPage);
});

function showLoadingSpinner() {
  const box1 = document.getElementById("box1");
  box1.innerHTML = '<div class="spinner"></div><p>Please wait while we load the games list.</p>';
  clearGameDetails();
}

function clearGameDetails() {
  const box2 = document.getElementById("box2");
  box2.innerHTML = '';
}

function loadGames(page) {
  showLoadingSpinner();

  const username = document.getElementById("bgInput").value;
  const apiUrl = `https://bgg-json.azurewebsites.net/collection/${username}`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(jsonData => {
      const message = jsonData.message;
      if (message && (message.includes('Please try again later') || message.includes('Invalid username specified'))) {
        throw new Error(message);
      }

      boardGames = jsonData.map(item => ({
        id: item.gameId,
        name: item.name,
        thumbnail: item.thumbnail
      }));

      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = boardGames.slice(start, end);
      const totalNumberOfPages = Math.ceil(boardGames.length / itemsPerPage);

      const gameContainer = document.createElement('div');
      gameContainer.id = "game-container";

      gameContainer.innerHTML = pageItems.map(game => `
        <div class="game-item" onclick="loadGameDetails('${game.id}')">
          <img src="${game.thumbnail}" alt="${game.name}" />
          <h3>${game.name}</h3>
        </div>
      `).join('');

      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next';
      nextButton.onclick = function() { 
        if (currentPage < totalNumberOfPages - 1) {
          changePage(1); 
        }
      };
      nextButton.classList.add('start-game-button');
      nextButton.disabled = currentPage >= totalNumberOfPages - 1;

      const backButton = document.createElement('button');
      backButton.textContent = 'Back';
      backButton.onclick = function() { changePage(-1); };
      backButton.classList.add('start-game-button');
      
      // Create a container for the buttons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.appendChild(backButton);
      buttonsContainer.appendChild(nextButton);

      const box1 = document.getElementById("box1");
      box1.innerHTML = '';

      // Add buttons to box1
      box1.appendChild(buttonsContainer);

      // Add game items to box1
      box1.appendChild(gameContainer);

      if(boardGames.length === 0){
        document.getElementById("box1").innerHTML = 'User does not exist or has no board games registered';
        const boxOne = document.getElementById("box1");
        boxOne.style.display = "flex";
      } else {
        let headings = document.getElementsByClassName("Heading");
        const boxOne = document.getElementById("box1");
        boxOne.style.display = "flex";
        for (let i = 0; i < headings.length; i++) {
          headings[i].hidden = false;
        }
      }

      retryAttempt = 0;

      return boardGames;
    })
    .catch(error => {
      console.error('Error fetching board games:', error);
      return [];
    });
}

loadGames(currentPage); //initial load

function changePage(delta) {
  currentPage += delta;
  
  // Handle edge cases
  if (currentPage < 0) {
    currentPage = 0; // Can't go before first page
  }

  // Load the new page
  loadGames(currentPage);
}

function loadGameDetails(gameId) {
  const apiUrl = `https://bgg-json.azurewebsites.net/thing/${gameId}`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(jsonData => {
      const item = jsonData;
      const description = item.description;
      const playtime = item.playingTime;
      
      const box2 = document.getElementById("box2");
      box2.innerHTML = `
        <div class="game-details">
          <img id="gameImage" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="[GAME IMAGE]" class="game-thumbnail" />
          <p>${description}</p>
        </div>
        <div class="playtime-details">
          <p>Playtime: ${playtime} minutes</p>
        </div>
        <button class="start-game-button" onclick="startNewGame()">Start New Game</button>

        <div id="game-controls">
          <form id="playerForm">
            <label for="playerCount">Number of Players:</label>
            <input type="number" id="playerCount" min="1" required>
          </form>
        </div>
        
        <div id="timer-container" style="display: none;">
          <h4 id="timer">00:00</h4>
          <button id="timerButton" onclick="toggleTimer()">Start Timer</button>
        </div>
        
        <h4 id="result" style="display: none;"></h4>
      `;

      const boxTwo = document.getElementById("box2");
      boxTwo.style.display = "flex";
      const gameControls = document.getElementById("game-controls");
      gameControls.style.display = "none";

      // Load the actual image
      const actualImage = new Image();
      actualImage.src = item.image;
      actualImage.onload = function() {
        const gameImageElement = document.getElementById("gameImage");
        gameImageElement.src = actualImage.src;
        gameImageElement.alt = item.name; // Replace with actual alt text
      };
    })
    .catch(error => {
      console.error('Error fetching game details:', error);
      clearGameDetails();
    });
}



function startNewGame() {
  // Show the game controls and hide the result
  const gameControls = document.getElementById("game-controls");
  gameControls.style.display = "block";
  document.getElementById("result").style.display = "none";

  // Show the timer container
  const timerContainer = document.getElementById("timer-container");
  timerContainer.style.display = "block";

  console.log('Start new game function');
}

function startTimer() {
  playerCount = parseInt(document.getElementById("playerCount").value);
  if (isNaN(playerCount) || playerCount < 1) {
    alert("Please enter a valid number of players.");
    return;
  }

  const timerButton = document.getElementById("timerButton");
  timerButton.textContent = "Stop Timer";
  timerButton.classList.add("stop");

  document.getElementById("playerForm").style.display = "none";
  document.getElementById("result").style.display = "none";

  startTime = new Date().getTime();
  isTimerRunning = true;
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const currentTime = new Date().getTime();
  const elapsedTime = Math.floor((currentTime - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  document.getElementById("timer").textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function toggleTimer() {
  if (isTimerRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;

  const timerButton = document.getElementById("timerButton");
  timerButton.textContent = "Start Timer";
  timerButton.classList.remove("stop");

  const elapsedTime = Math.floor((new Date().getTime() - startTime) / 1000);
  const result = playerCount * elapsedTime;

  const resultElement = document.getElementById("result");
  const resultElement2 = document.getElementById("playerForm");
  resultElement.textContent = `Points for distribution: ${result}`;
  resultElement.style.display = "block";
  resultElement2.style.display = "block";
}