
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
            debug: true
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
        this.gameOver = false;
        this.jumping = false;
        this.sliding = false;
        this.lastObstacleTime = 0;
        this.obstacleInterval = 1500; // 장애물 생성 간격 (ms)
        this.gameSpeed = 300; // 게임 속도
        this.scoreIncreaseInterval = 100; // 점수 증가 간격 (ms)
        this.lastScoreTime = 0;
        this.playerSpeed = 150;
        this.difficulty = 1; // 난이도 레벨 (1-5)
        this.obstaclePatterns = [
            'single', 'double', 'triple', 'mixed', 'sequence'
        ]; // 장애물 패턴 유형
        this.currentPattern = 'single'; // 현재 사용 중인 패턴
    }

    reset() {
        this.score = 0;
        this.gameOver = false;
        this.jumping = false;
        this.sliding = false;
        this.lastObstacleTime = 0;
        this.obstacleInterval = 1500;
        this.gameSpeed = 300;
        this.lastScoreTime = 0;
        this.difficulty = 1;
        this.currentPattern = 'single';
    }

    // 난이도에 따른 장애물 패턴 선택
    selectObstaclePattern() {
        // 점수에 따라 난이도 조정
        if (this.score > 500) this.difficulty = 5;
        else if (this.score > 300) this.difficulty = 4;
        else if (this.score > 200) this.difficulty = 3;
        else if (this.score > 100) this.difficulty = 2;
        
        // 난이도에 따라 사용 가능한 패턴 결정
        let availablePatterns;
        switch(this.difficulty) {
            case 1: availablePatterns = ['single']; break;
            case 2: availablePatterns = ['single', 'double']; break;
            case 3: availablePatterns = ['single', 'double', 'triple']; break;
            case 4: availablePatterns = ['single', 'double', 'triple', 'mixed']; break;
            case 5: availablePatterns = this.obstaclePatterns; break;
            default: availablePatterns = ['single'];
        }
        
        // 랜덤하게 패턴 선택
        const randomIndex = Math.floor(Math.random() * availablePatterns.length);
        this.currentPattern = availablePatterns[randomIndex];
        return this.currentPattern;
    }
}

// 게임 변수
let game;
let player;
let obstacles;
let slideObstacles; // 슬라이드 장애물을 위한 별도 그룹
let ground;
let background;
let scoreText;
let gameState = new GameState(); // 게임 상태 객체

// 게임 시작 함수
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

// 게임 리소스 로드
function preload() {
    // 이미지 로드
    this.load.image('background', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/sky1.png');
    this.load.image('ground', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/platform.png');
    this.load.image('obstacle', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/block.png');
    
    // 추가 장애물 이미지 로드
    this.load.image('obstacle-spike', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/diamond.png');
    this.load.image('obstacle-fire', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/fireball.png');
    this.load.image('obstacle-moving', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/mushroom.png');

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
    player.setFlipX(true); // 캐릭터가 오른쪽을 바라보도록 설정

    // 플레이어 애니메이션
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'jump',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 10
    });

    this.anims.create({
        key: 'slide',
        frames: [{ key: 'player', frame: 2 }],
        frameRate: 10
    });

    // 장애물 그룹 생성
    obstacles = this.physics.add.group();
    
    // 슬라이드 장애물을 위한 별도 그룹 생성
    slideObstacles = this.physics.add.group();

    // 충돌 설정
    this.physics.add.collider(player, ground, null, function() {
        // 슬라이딩 상태에서 플레이어가 바닥을 통과하지 않도록 함
        if (gameState.sliding) {
            return player.body.velocity.y >= 0;
        }
        return true;
    }, this);
    this.physics.add.collider(obstacles, ground);

    // 플레이어와 장애물 충돌 처리
    this.physics.add.overlap(player, obstacles, hitObstacle, null, this);
    
    // 플레이어와 슬라이드 장애물 충돌 처리
    this.physics.add.overlap(player, slideObstacles, hitSlideObstacle, null, this);
    

    // 점수 텍스트
    scoreText = this.add.text(16, 16, '점수: 0', { fontSize: '24px', fill: '#000' });
    scoreText.setScrollFactor(0);

    // 게임 시작 시 플레이어 애니메이션 실행
    player.anims.play('idle', true);
}

// 게임 업데이트 (매 프레임)
function update(time, delta) {
    if (gameState.gameOver) return;

    // 배경 스크롤
    background.tilePositionX += gameState.gameSpeed * delta / 1000;

    // 장애물 생성
    if (time > gameState.lastObstacleTime + gameState.obstacleInterval) {
        createObstacle(this);
        gameState.lastObstacleTime = time;

        // 게임 난이도 증가 (시간이 지날수록 장애물 간격 감소, 속도 증가)
        if (gameState.obstacleInterval > 800) {
            gameState.obstacleInterval -= 10;
        }
        if (gameState.gameSpeed < 500) {
            gameState.gameSpeed += 2;
        }
    }

    // 점수 증가
    if (time > gameState.lastScoreTime + gameState.scoreIncreaseInterval) {
        gameState.score += 1;
        scoreText.setText('점수: ' + gameState.score);
        gameState.lastScoreTime = time;
    }

    // Teachable Machine 모델에서 동작 가져오기
    let action = 'idle';
    try {
        action = getCurrentAction();
    } catch (error) {
        console.warn('getCurrentAction 함수를 찾을 수 없습니다:', error);
    }

    // 플레이어 동작 처리
    if (action === 'jump' && player.body.touching.down && !gameState.jumping) {
        // 점프
        player.setVelocityY(-500);
        player.anims.play('jump');
        gameState.jumping = true;
        gameState.sliding = false;
    } else if (action === 'slide' && player.body.touching.down && !gameState.sliding) {
        // 슬라이드
        player.anims.play('slide');
        player.body.setSize(20, 24); // 슬라이드 시 충돌 박스 크기 줄임
        gameState.sliding = true;
        gameState.jumping = false;
    } else if (action === 'idle' && (gameState.jumping || gameState.sliding)) {
        // 기본 상태로 복귀
        if (player.body.touching.down) {
            player.anims.play('idle', true);
            player.body.setSize(20, 48); // 기본 충돌 박스 크기로 복원
            // 슬라이드 상태에서 기본 상태로 전환 시 위치 조정
            if (gameState.sliding) {
                player.y -= 12; // 바닥을 뚫고 내려가는 것 방지
            }
            gameState.jumping = false;
            gameState.sliding = false;
        }
    }

    // 점프 후 착지 감지
    if (gameState.jumping && player.body.touching.down) {
        gameState.jumping = false;
        player.anims.play('idle', true);
    }
}

// 장애물 생성 함수
function createObstacle(scene) {
    // 패턴 선택
    const pattern = gameState.selectObstaclePattern();
    
    // 장애물 생성 위치
    const x = gameConfig.width + 100;
    
    // 패턴에 따라 장애물 생성
    switch(pattern) {
        case 'single':
            createSingleObstacle(scene, x);
            break;
        case 'double':
            createDoubleObstacles(scene, x);
            break;
        case 'triple':
            createTripleObstacles(scene, x);
            break;
        case 'mixed':
            createMixedObstacles(scene, x);
            break;
        case 'sequence':
            createSequenceObstacles(scene, x);
            break;
        default:
            createSingleObstacle(scene, x);
    }
}

// 단일 장애물 생성 (기존 코드 기반)
function createSingleObstacle(scene, x) {
    // 장애물 유형 랜덤 선택 (0-4: 다양한 장애물 유형)
    const obstacleType = Phaser.Math.Between(0, 4);
    
    // 장애물 생성 위치
    let y;
    let scale;
    let obstacleKey = 'obstacle'; // 기본 장애물 이미지
    
    // 장애물 유형에 따라 설정
    switch(obstacleType) {
        case 0: // 낮은 장애물
            y = 0;
            scale = 0.5;
            break;
        case 1: // 높은 장애물
            y = 0;
            scale = 0.7;
            break;
        case 2: // 슬라이드 장애물
            createSlideObstacle(scene, x);
            return;
        case 3: // 가시 장애물
            y = 0;
            scale = 0.4;
            obstacleKey = 'obstacle-spike';
            break;
        case 4: // 불 장애물
            y = 0;
            scale = 0.5;
            obstacleKey = 'obstacle-fire';
            break;
    }
    
    // 장애물 생성 및 설정
    const obstacle = obstacles.create(x, y, obstacleKey);
    obstacle.setOrigin(0, 0);
    obstacle.setScale(scale);
    obstacle.setData('type', obstacleType === 0 ? 'low' : 'high');
    
    // 장애물 이동 속도 설정
    obstacle.setVelocityX(-gameState.gameSpeed);
    
    // 화면 밖으로 나가면 제거
    obstacle.checkWorldBounds = true;
    obstacle.outOfBoundsKill = true;
}

// 이중 장애물 생성 (연속된 두 개의 장애물)
function createDoubleObstacles(scene, x) {
    createSingleObstacle(scene, x);
    createSingleObstacle(scene, x + 200);
}

// 삼중 장애물 생성 (연속된 세 개의 장애물)
function createTripleObstacles(scene, x) {
    createSingleObstacle(scene, x);
    createSingleObstacle(scene, x + 200);
    createSingleObstacle(scene, x + 400);
}

// 혼합 장애물 생성 (점프와 슬라이드 장애물 혼합)
function createMixedObstacles(scene, x) {
    createSingleObstacle(scene, x);
    createSlideObstacle(scene, x + 250);
}

// 시퀀스 장애물 생성 (특정 패턴의 장애물)
function createSequenceObstacles(scene, x) {
    // 예: 낮은 장애물 - 슬라이드 장애물 - 높은 장애물
    const obstacle1 = obstacles.create(x, 0, 'obstacle');
    obstacle1.setOrigin(0, 0);
    obstacle1.setScale(0.5);
    obstacle1.setData('type', 'low');
    obstacle1.setVelocityX(-gameState.gameSpeed);
    obstacle1.checkWorldBounds = true;
    obstacle1.outOfBoundsKill = true;
    
    createSlideObstacle(scene, x + 250);
    
    const obstacle3 = obstacles.create(x + 500, 0, 'obstacle');
    obstacle3.setOrigin(0, 0);
    obstacle3.setScale(0.7);
    obstacle3.setData('type', 'high');
    obstacle3.setVelocityX(-gameState.gameSpeed);
    obstacle3.checkWorldBounds = true;
    obstacle3.outOfBoundsKill = true;
}

// 슬라이드 장애물 생성 함수
function createSlideObstacle(scene, x) {
    try {
        // 슬라이드 장애물 위치 계산 (플레이어가 슬라이드했을 때 통과할 수 있는 높이)
        const y = 200;
        const scale = 0.4;
        
        // 슬라이드 장애물 생성 (랜덤하게 다른 이미지 사용)
        const obstacleKeys = ['obstacle', 'obstacle-moving'];
        const randomKey = obstacleKeys[Phaser.Math.Between(0, 1)];
        
        // 슬라이드 장애물 생성
        const slideObstacle = slideObstacles.create(x, y, randomKey);
        slideObstacle.setOrigin(0, 0); // 위에서부터 시작
        slideObstacle.setScale(scale);
        slideObstacle.setData('type', 'slide');
        
        // 중력 영향 없음
        slideObstacle.body.setGravityY(0);
        slideObstacle.body.setAllowGravity(false);
        slideObstacle.setImmovable(true);
        
        // 장애물 이동 속도 설정
        slideObstacle.setVelocityX(-gameState.gameSpeed);
        
        // 화면 밖으로 나가면 제거
        slideObstacle.checkWorldBounds = true;
        slideObstacle.outOfBoundsKill = true;
        
        // 슬라이드 장애물의 높이를 시각적으로 표시 (디버깅용)
        if (gameConfig.physics.arcade.debug) {
            const debugText = scene.add.text(x, y, '슬라이드 장애물', { fontSize: '12px', fill: '#ff0000' });
            scene.tweens.add({
                targets: debugText,
                x: -100,
                duration: (gameConfig.width + 100 + x) / gameState.gameSpeed * 1000,
                ease: 'Linear',
                onComplete: function() {
                    debugText.destroy();
                }
            });
        }
    } catch (error) {
        console.error('createSlideObstacle 함수 실행 중 오류:', error);
    }
}

// 장애물 충돌 처리 함수
function hitObstacle() {
    try {
        // 게임 오버 처리
        this.physics.pause();
        player.setTint(0xff0000);
        gameState.gameOver = true;

        // 최고 점수 업데이트
        try {
            updateHighScore(gameState.score);
        } catch (error) {
            console.warn('updateHighScore 함수 실행 중 오류:', error);
            // 로컬 스토리지에 직접 저장 시도
            try {
                const highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
                if (gameState.score > highScore) {
                    localStorage.setItem('highScore', gameState.score.toString());
                }
            } catch (e) {
                console.warn('로컬 스토리지 접근 오류:', e);
            }
        }

        // 1초 후 게임 오버 화면 표시
        setTimeout(() => {
            try {
                if (typeof showGameOverScreen === 'function') {
                    showGameOverScreen();
                } else {
                    console.warn('showGameOverScreen 함수를 찾을 수 없습니다');
                }
            } catch (error) {
                console.error('게임 오버 화면 표시 중 오류:', error);
            }
        }, 1000);
    } catch (error) {
        console.error('hitObstacle 함수 실행 중 오류:', error);
    }
}

// 슬라이드 장애물 충돌 처리 함수
function hitSlideObstacle() {
    try {
        // 슬라이딩 중이면 충돌 무시
        if (gameState.sliding) {
            return;
        }
        
        // 게임 오버 처리
        this.physics.pause();
        player.setTint(0xff0000);
        gameState.gameOver = true;

        // 최고 점수 업데이트
        try {
            updateHighScore(gameState.score);
        } catch (error) {
            console.warn('updateHighScore 함수 실행 중 오류:', error);
            // 로컬 스토리지에 직접 저장 시도
            try {
                const highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
                if (gameState.score > highScore) {
                    localStorage.setItem('highScore', gameState.score.toString());
                }
            } catch (e) {
                console.warn('로컬 스토리지 접근 오류:', e);
            }
        }

        // 1초 후 게임 오버 화면 표시
        setTimeout(() => {
            try {
                if (typeof showGameOverScreen === 'function') {
                    showGameOverScreen();
                } else {
                    console.warn('showGameOverScreen 함수를 찾을 수 없습니다');
                }
            } catch (error) {
                console.error('게임 오버 화면 표시 중 오류:', error);
            }
        }, 1000);
    } catch (error) {
        console.error('hitSlideObstacle 함수 실행 중 오류:', error);
    }
}


// 최고 점수 업데이트 함수
function updateHighScore(score) {
    try {
        // 로컬 스토리지에서 최고 점수 가져오기
        const highScore = parseInt(localStorage.getItem('highScore') || '0', 10);

        // 현재 점수가 최고 점수보다 높으면 업데이트
        if (score > highScore) {
            localStorage.setItem('highScore', score.toString());

            // 플레이어 정보 가져오기
            const studentId = localStorage.getItem('studentId') || '익명';
            const playerName = localStorage.getItem('playerName') || '플레이어';

            // 랭킹 정보 업데이트
            try {
                updateRanking(studentId, playerName, gameState.score);
            } catch (error) {
                console.warn('랭킹 업데이트 중 오류:', error);
            }
        }
    } catch (error) {
        console.warn('최고 점수 업데이트 중 오류:', error);
    }
}

// 랭킹 업데이트 함수
function updateRanking(studentId, playerName, score) {
    try {
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
    } catch (error) {
        console.warn('랭킹 업데이트 중 오류:', error);
    }
}

// 게임 종료 함수
function endGame() {
    try {
        if (game) {
            game.destroy(true);
            game = null;
        }
    } catch (error) {
        console.error('게임 종료 중 오류:', error);
    }
}
