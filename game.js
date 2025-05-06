/**
 * game.js - Phaser 게임 로직 구현
 */

// 게임 설정
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 게임 변수
let game;
let player;
let obstacles;
let ground;
let background;
let scoreText;
let score = 0;
let gameOver = false;
let jumping = false;
let sliding = false;
let lastObstacleTime = 0;
let obstacleInterval = 1500; // 장애물 생성 간격 (ms)
let gameSpeed = 300; // 게임 속도
let scoreIncreaseInterval = 100; // 점수 증가 간격 (ms)
let lastScoreTime = 0;

// 게임 시작 함수
function startGame() {
    // 기존 게임 인스턴스가 있으면 제거
    if (game) {
        game.destroy(true);
    }
    
    // 게임 변수 초기화
    score = 0;
    gameOver = false;
    jumping = false;
    sliding = false;
    
    // 새 게임 인스턴스 생성
    game = new Phaser.Game(gameConfig);
}

// 게임 리소스 로드
function preload() {
    // 이미지 로드
    this.load.image('background', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/sky1.png');
    this.load.image('ground', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/platform.png');
    this.load.image('obstacle', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/block.png');
    
    // 스프라이트시트 로드
    this.load.spritesheet('player', 
        'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
}

// 게임 생성
function create() {
    // 배경 생성
    background = this.add.tileSprite(0, 0, gameConfig.width, gameConfig.height, 'background')
        .setOrigin(0, 0)
        .setScrollFactor(0);
    
    // 땅 생성
    ground = this.physics.add.staticGroup();
    ground.create(400, 390, 'ground').setScale(2).refreshBody();
    
    // 플레이어 생성
    player = this.physics.add.sprite(100, 300, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setSize(20, 48); // 기본 충돌 박스 크기
    
    // 플레이어 애니메이션
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'jump',
        frames: [ { key: 'player', frame: 4 } ],
        frameRate: 10
    });
    
    this.anims.create({
        key: 'slide',
        frames: [ { key: 'player', frame: 2 } ],
        frameRate: 10
    });
    
    // 장애물 그룹 생성
    obstacles = this.physics.add.group();
    
    // 충돌 설정
    this.physics.add.collider(player, ground);
    this.physics.add.collider(obstacles, ground);
    
    // 플레이어와 장애물 충돌 처리
    this.physics.add.overlap(player, obstacles, hitObstacle, null, this);
    
    // 점수 텍스트
    scoreText = this.add.text(16, 16, '점수: 0', { fontSize: '24px', fill: '#000' });
    scoreText.setScrollFactor(0);
    
    // 게임 시작 시 플레이어 애니메이션 실행
    player.anims.play('idle', true);
}

// 게임 업데이트 (매 프레임)
function update(time, delta) {
    if (gameOver) return;
    
    // 배경 스크롤
    background.tilePositionX += gameSpeed * delta / 1000;
    
    // 장애물 생성
    if (time > lastObstacleTime + obstacleInterval) {
        createObstacle(this);
        lastObstacleTime = time;
        
        // 게임 난이도 증가 (시간이 지날수록 장애물 간격 감소, 속도 증가)
        if (obstacleInterval > 800) {
            obstacleInterval -= 10;
        }
        if (gameSpeed < 500) {
            gameSpeed += 2;
        }
    }
    
    // 점수 증가
    if (time > lastScoreTime + scoreIncreaseInterval) {
        score += 1;
        scoreText.setText('점수: ' + score);
        lastScoreTime = time;
    }
    
    // Teachable Machine 모델에서 동작 가져오기
    const action = getCurrentAction();
    
    // 플레이어 동작 처리
    if (action === 'jump' && player.body.touching.down && !jumping) {
        // 점프
        player.setVelocityY(-500);
        player.anims.play('jump');
        jumping = true;
        sliding = false;
    } else if (action === 'slide' && player.body.touching.down && !sliding) {
        // 슬라이드
        player.anims.play('slide');
        player.body.setSize(20, 24); // 슬라이드 시 충돌 박스 크기 줄임
        sliding = true;
        jumping = false;
    } else if (action === 'idle' && (jumping || sliding)) {
        // 기본 상태로 복귀
        if (player.body.touching.down) {
            player.anims.play('idle', true);
            player.body.setSize(20, 48); // 기본 충돌 박스 크기로 복원
            jumping = false;
            sliding = false;
        }
    }
    
    // 점프 후 착지 감지
    if (jumping && player.body.touching.down) {
        jumping = false;
        player.anims.play('idle', true);
    }
}

// 장애물 생성 함수
function createObstacle(scene) {
    // 장애물 유형 랜덤 선택 (0: 낮은 장애물, 1: 높은 장애물)
    const obstacleType = Phaser.Math.Between(0, 1);
    
    // 장애물 생성 위치
    const x = gameConfig.width + 100;
    let y;
    let scale;
    
    if (obstacleType === 0) {
        // 낮은 장애물 (슬라이드로 피해야 함)
        y = 350;
        scale = 0.5;
    } else {
        // 높은 장애물 (점프로 피해야 함)
        y = 320;
        scale = 0.7;
    }
    
    // 장애물 생성 및 설정
    const obstacle = obstacles.create(x, y, 'obstacle');
    obstacle.setOrigin(0, 1);
    obstacle.setScale(scale);
    obstacle.setImmovable(true);
    
    // 장애물 이동 속도 설정
    obstacle.setVelocityX(-gameSpeed);
    
    // 화면 밖으로 나가면 제거
    obstacle.checkWorldBounds = true;
    obstacle.outOfBoundsKill = true;
}

// 장애물 충돌 처리 함수
function hitObstacle() {
    // 게임 오버 처리
    this.physics.pause();
    player.setTint(0xff0000);
    gameOver = true;
    
    // 최고 점수 업데이트
    updateHighScore(score);
    
    // 1초 후 게임 오버 화면 표시
    setTimeout(() => {
        showGameOverScreen();
    }, 1000);
}

// 최고 점수 업데이트 함수
function updateHighScore(currentScore) {
    // 로컬 스토리지에서 최고 점수 가져오기
    const highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
    
    // 현재 점수가 최고 점수보다 높으면 업데이트
    if (currentScore > highScore) {
        localStorage.setItem('highScore', currentScore.toString());
        
        // 플레이어 정보 가져오기
        const studentId = localStorage.getItem('studentId') || '익명';
        const playerName = localStorage.getItem('playerName') || '플레이어';
        
        // 랭킹 정보 업데이트
        updateRanking(studentId, playerName, currentScore);
    }
}

// 랭킹 업데이트 함수
function updateRanking(studentId, playerName, score) {
    // 로컬 스토리지에서 랭킹 정보 가져오기
    let rankings = JSON.parse(localStorage.getItem('rankings') || '[]');
    
    // 새 랭킹 정보 추가
    const newRanking = {
        studentId: studentId,
        playerName: playerName,
        score: score,
        date: new Date().toISOString()
    };
    
    // 기존 랭킹에 동일한 학번이 있는지 확인
    const existingIndex = rankings.findIndex(r => r.studentId === studentId);
    
    if (existingIndex >= 0) {
        // 기존 기록이 있고, 새 점수가 더 높으면 업데이트
        if (rankings[existingIndex].score < score) {
            rankings[existingIndex] = newRanking;
        }
    } else {
        // 기존 기록이 없으면 추가
        rankings.push(newRanking);
    }
    
    // 점수 기준 내림차순 정렬
    rankings.sort((a, b) => b.score - a.score);
    
    // 상위 10개만 유지
    if (rankings.length > 10) {
        rankings = rankings.slice(0, 10);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('rankings', JSON.stringify(rankings));
}

// 게임 종료 함수
function endGame() {
    if (game) {
        game.destroy(true);
        game = null;
    }
}
