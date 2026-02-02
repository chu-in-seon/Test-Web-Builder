document.addEventListener('DOMContentLoaded', () => {
  // --- Tetris Game & Lobby Logic ---
  const screens = {
    login: document.getElementById('login-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen')
  };

  const nicknameInput = document.getElementById('nickname-input');
  const joinBtn = document.getElementById('join-btn');
  const playerList = document.getElementById('player-list');
  const readyBtn = document.getElementById('ready-btn');
  const forceStartBtn = document.getElementById('force-start-btn');
  const readyStatusMsg = document.getElementById('ready-status-msg');

  let myNickname = '';
  let isReady = false;
  let players = []; // Simulating connected players

  // helper to switch screens
  function showScreen(name) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[name].classList.remove('hidden');
  }

  function renderPlayerList() {
    playerList.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      li.className = 'player-item';
      li.innerHTML = `
        <span>${p.name} ${p.isMe ? '(You)' : ''}</span>
        <span class="${p.ready ? 'status-ready' : 'status-waiting'}">
          ${p.ready ? 'READY' : 'WAITING'}
        </span>
      `;
      playerList.appendChild(li);
    });

    // Check if everyone is ready (min 2 players)
    const allReady = players.length >= 2 && players.every(p => p.ready);
    if (allReady) {
      readyStatusMsg.textContent = "All players ready! Game starting in 3 seconds...";
      setTimeout(startGame, 3000);
    }
  }

  // 1. Join Room
  if(joinBtn) {
    joinBtn.addEventListener('click', () => {
      const name = nicknameInput.value.trim();
      if (!name) return alert('Please enter a nickname');
      
      myNickname = name;
      // Add myself
      players.push({ name: myNickname, ready: false, isMe: true });
      
      // Simulate other players joining (Mock Data for UI testing)
      setTimeout(() => {
        players.push({ name: 'Player 2', ready: false, isMe: false });
        renderPlayerList();
      }, 1000);

      setTimeout(() => {
          players.push({ name: 'Player 3', ready: false, isMe: false });
          renderPlayerList();
        }, 2500);

      showScreen('lobby');
      renderPlayerList();
    });
  }

  // 2. Toggle Ready
  if(readyBtn) {
    readyBtn.addEventListener('click', () => {
      isReady = !isReady;
      // Update my status
      const me = players.find(p => p.isMe);
      if(me) me.ready = isReady;

      readyBtn.textContent = isReady ? 'CANCEL READY' : 'READY';
      readyBtn.classList.toggle('btn-success');
      readyBtn.classList.toggle('btn-danger');

      renderPlayerList();

      // Simulate others getting ready automatically after a delay
      if(isReady) {
          setTimeout(() => {
              players.forEach(p => { if(!p.isMe) p.ready = true; });
              renderPlayerList();
          }, 1500);
      }
    });
  }

  // 3. Force Start (For Testing)
  if(forceStartBtn) {
    forceStartBtn.addEventListener('click', () => {
      startGame();
    });
  }

  function startGame() {
    showScreen('game');
    const tetris = new Tetris('tetris', (finalScore) => {
        alert('Game Over! Your Score: ' + finalScore);
        location.reload(); 
    });
    tetris.start();
  }
});
