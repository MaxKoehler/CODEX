const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayCopy = document.getElementById('overlay-copy');
const startBtn = document.getElementById('start-btn');

const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

const bestKey = 'neon-dodge-best';
let bestScore = Number(localStorage.getItem(bestKey) || 0);
bestEl.textContent = bestScore;

const game = {
  running: false,
  lastTime: 0,
  score: 0,
  speed: 220,
  spawnTimer: 0,
  spawnEvery: 0.65,
  player: {
    x: canvas.width / 2 - 22,
    y: canvas.height - 68,
    w: 44,
    h: 44,
    speed: 330,
  },
  moveLeft: false,
  moveRight: false,
  obstacles: [],
};

function resetGame() {
  game.score = 0;
  game.speed = 220;
  game.spawnTimer = 0;
  game.spawnEvery = 0.65;
  game.lastTime = 0;
  game.player.x = canvas.width / 2 - game.player.w / 2;
  game.obstacles = [];
  scoreEl.textContent = '0';
}

function randomObstacle() {
  const width = 36 + Math.random() * 52;
  return {
    x: Math.random() * (canvas.width - width),
    y: -40,
    w: width,
    h: 24 + Math.random() * 26,
    vy: game.speed + Math.random() * 100,
  };
}

function drawPlayer() {
  const p = game.player;
  ctx.fillStyle = '#57f6ff';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, p.h, 10);
  ctx.fill();

  ctx.fillStyle = '#b8fdff';
  ctx.fillRect(p.x + 10, p.y + 9, p.w - 20, 6);
}

function drawObstacle(ob) {
  ctx.fillStyle = '#ff4f86';
  ctx.beginPath();
  ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 8);
  ctx.fill();
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  const p = game.player;
  const delta = dt / 1000;

  if (game.moveLeft) p.x -= p.speed * delta;
  if (game.moveRight) p.x += p.speed * delta;
  p.x = Math.max(0, Math.min(canvas.width - p.w, p.x));

  game.spawnTimer += delta;
  if (game.spawnTimer >= game.spawnEvery) {
    game.spawnTimer = 0;
    game.obstacles.push(randomObstacle());
  }

  for (const ob of game.obstacles) {
    ob.y += ob.vy * delta;
    if (intersects(p, ob)) {
      endGame();
      return;
    }
  }

  game.obstacles = game.obstacles.filter((ob) => ob.y < canvas.height + ob.h);

  game.score += delta * 10;
  scoreEl.textContent = Math.floor(game.score);

  game.speed += delta * 3;
  game.spawnEvery = Math.max(0.32, game.spawnEvery - delta * 0.012);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(87, 246, 255, 0.2)';
  ctx.lineWidth = 1;
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function draw() {
  drawBackground();
  drawPlayer();
  game.obstacles.forEach(drawObstacle);
}

function frame(time) {
  if (!game.running) return;

  if (!game.lastTime) game.lastTime = time;
  const dt = Math.min(34, time - game.lastTime);
  game.lastTime = time;

  update(dt);
  draw();

  if (game.running) requestAnimationFrame(frame);
}

function startGame() {
  resetGame();
  overlay.classList.add('hidden');
  game.running = true;
  requestAnimationFrame(frame);
}

function endGame() {
  game.running = false;
  const finalScore = Math.floor(game.score);

  if (finalScore > bestScore) {
    bestScore = finalScore;
    localStorage.setItem(bestKey, String(bestScore));
    bestEl.textContent = String(bestScore);
  }

  overlayTitle.textContent = 'Game Over';
  overlayCopy.textContent = `You scored ${finalScore}. Ready for another run?`;
  startBtn.textContent = 'Play Again';
  overlay.classList.remove('hidden');
}

startBtn.addEventListener('click', () => {
  overlayTitle.textContent = 'Neon Dodge';
  overlayCopy.textContent = 'Move left or right and survive as long as possible.';
  startBtn.textContent = 'Start Game';
  startGame();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') game.moveLeft = true;
  if (event.key === 'ArrowRight') game.moveRight = true;
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') game.moveLeft = false;
  if (event.key === 'ArrowRight') game.moveRight = false;
});

function holdButton(button, setter) {
  button.addEventListener('pointerdown', () => setter(true));
  button.addEventListener('pointerup', () => setter(false));
  button.addEventListener('pointerleave', () => setter(false));
  button.addEventListener('pointercancel', () => setter(false));
}

holdButton(leftBtn, (state) => {
  game.moveLeft = state;
});

holdButton(rightBtn, (state) => {
  game.moveRight = state;
});

draw();
