
// 게임 설정
const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// 게임 상태 관리 클래스
class GameState {
  constructor() {
    this.score = 0;
    this.scoreDecreaseInterval = 100; // 점수 감소 간격 (ms)
    this.playerSpeed = 150;
  }

  reset() {
    this.score = 1000;
  }
}

// 게임 변수
let game;
let player;
let background;
let scoreText;
let gameState = new GameState(); // 게임 상태 객체
let walls;
let goal;
let startPosition = { x: 50, y: 50 }; // 시작 좌표
let goalPosition = { x: 750, y: 350 }; // 도착 좌표
const cellSize = 32; // 미로 셀 크기
let action = ''

// 랜덤 미로 생성 함수
function generateMaze(width, height, cellSize) {
  const gridWidth = Math.floor(width / cellSize);
  const gridHeight = Math.floor(height / cellSize);
  const maze = [];

  // 모든 셀을 벽으로 초기화
  for (let y = 0; y < gridHeight; y++) {
    maze[y] = [];
    for (let x = 0; x < gridWidth; x++) {
      maze[y][x] = 1; // 1은 벽
    }
  }

  function carvePath(x, y) {
    maze[y][x] = 0; // 0은 길
    const directions = [{ dx: 0, dy: -2 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 }, { dx: 2, dy: 0 }]
      .sort(() => Math.random() - 0.5); // 무작위 순서

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (nx > 0 && nx < gridWidth - 1 && ny > 0 && ny < gridHeight - 1 && maze[ny][nx] === 1) {
        maze[y + dir.dy / 2][x + dir.dx / 2] = 0;
        carvePath(nx, ny);
      }
    }
  }

  // 시작 셀에서부터 길을 만들기 시작
  const startX = Math.floor(Math.random() * Math.floor(gridWidth / 2)) * 2 + 1;
  const startY = Math.floor(Math.random() * Math.floor(gridHeight / 2)) * 2 + 1;
  carvePath(startX, startY);

  return maze;
}

// 이미지 로드
function preload() {
  this.load.image('background', 'assets/background.png'); // 배경 이미지
  this.load.image('player', 'assets/player.png'); // 플레이어 이미지
  this.load.image('wall', 'assets/wall.png'); // 벽 이미지
  this.load.image('goal', 'assets/goal.png'); // 도착 지점 이미지
}

function create() {
  // 배경 추가
  background = this.add.image(gameConfig.width / 2, gameConfig.height / 2, 'background');

  // 미로 생성
  const mazeData = generateMaze(gameConfig.width, gameConfig.height, cellSize);
  const gridWidth = mazeData[0].length;
  const gridHeight = mazeData.length;

  // 그룹 생성
  walls = this.physics.add.staticGroup();

  // 미로 배치
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (mazeData[y][x] === 1) {
        walls.create(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'wall');
      }
    }
  }

  // 플레이어 생성 및 초기 위치 설정
  player = this.physics.add.sprite(startPosition.x, startPosition.y, 'player');
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, walls);

  // 도착 지점 생성 및 위치 설정
  goal = this.physics.add.sprite(goalPosition.x, goalPosition.y, 'goal');
  this.physics.add.overlap(player, goal, () => {
    alert('미로 탈출 성공!');
    startGame(); // 게임 재시작
  }, null, this);

  // 점수 텍스트 생성 및 초기화
  gameState.score = 1000;
  scoreText = this.add.text(16, 16, 'Score: ' + gameState.score, { fontSize: '20px', fill: '#fff' });

  // 점수 감소 인터벌 설정
  this.time.addEvent({
    delay: gameState.scoreDecreaseInterval,
    callback: () => {
      gameState.score -= 1;
      scoreText.setText('Score: ' + gameState.score);
    },
    callbackScope: this,
    loop: true
  });
}

function update() {
  player.setVelocity(0);

  action = predict();

  // 티처블 머신 예측 결과에 따른 플레이어 이동
  if (action === 'up') {
    player.setVelocityY(-gameState.playerSpeed);
  } else if (action === 'down') {
    player.setVelocityY(gameState.playerSpeed);
  } else if (action === 'left') {
    player.setVelocityX(-gameState.playerSpeed);
  } else if (action === 'right') {
    player.setVelocityX(gameState.playerSpeed);
  }
}

function startGame() {
  // 기존 게임 인스턴스가 있으면 제거
  if (game) {
    game.destroy(true);
  }

  // 게임 변수 초기화
  gameState.reset();

  // 새 게임 인스턴스 생성
  game = new Phaser.Game(gameConfig);
}