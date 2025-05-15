let game;

class MazeScene extends Phaser.Scene {
  constructor() {
    super('MazeScene');
    this.player = null;
    this.cursors = null;
    this.map = null;
    this.tileset = null;
    this.wallsLayer = null;
    this.startTile = null;
    this.endTile = null;
    this.startTime = 0;
    this.endTime = 0;
    this.score = 0;
    this.gameTimerText = null;
    this.starRating = 0;
    this.mazeData = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 4, 4, 4, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 4, 4, 4, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 4, 4, 4, 1],
      [1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1],
      [1, 2, 2, 2, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 1, 1, 1, 1],
      [1, 2, 2, 2, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 1, 1, 1, 1],
      [1, 2, 2, 2, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    this.tileColors = { // 타일 색상 (개발자가 수정 가능)ㄴ
      0: 0x808080, // 회색 (바닥 1)
      3: 0xbca690, // 노란색 (바닥 2)
      1: 0x000000, // 검정 (벽 & 테두리)
      2: 0x0000ff, // 파랑 (출발지)
      4: 0xff0000  // 빨강 (도착지)
    };
    this.tileSize = 16; // 타일 크기 (플레이어 스프라이트에 맞춰 조정 필요)
    this.playerSpeed = 100;
    this.playerState = '가만히';
  }

  preload() {
    
    // 기존 방식도 유지 (실제 파일이 있는 경우 사용)
    this.load.image('player_file', 'assets/player.png'); // 플레이어 스프라이트 로드 시도
  }

  create() {
    this.cameras.main.setBackgroundColor('#333333'); // 배경색 설정

    // 맵 생성 - 직접 그래픽으로 그리기
    const graphics = this.add.graphics();
    
    // 미로 크기 계산
    this.mazeWidth = this.mazeData[0].length * this.tileSize;
    this.mazeHeight = this.mazeData.length * this.tileSize;
    
    // 게임 화면 크기 설정
    this.physics.world.setBounds(0, 0, this.mazeWidth, this.mazeHeight);
    
    // 미로 그리기
    for (let y = 0; y < this.mazeData.length; y++) {
      for (let x = 0; x < this.mazeData[y].length; x++) {
        const tileValue = this.mazeData[y][x];
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;
        
        // 타일 색상 설정
        const color = this.tileColors[tileValue];
        graphics.fillStyle(color, 1);
        
        // 타일 그리기
        graphics.fillRect(tileX, tileY, this.tileSize, this.tileSize);
        
        // 시작 지점과 종료 지점 저장
        if (tileValue === 2) { // 시작 지점
          this.startTile = { x: tileX + this.tileSize / 2, y: tileY + this.tileSize / 2 };
        } else if (tileValue === 4) { // 종료 지점
          this.endTile = { x: tileX + this.tileSize / 2, y: tileY + this.tileSize / 2 };
        }
        
        // 벽 타일에 물리 충돌 추가
        if (tileValue === 1) {
          const wall = this.add.rectangle(tileX + this.tileSize / 2, tileY + this.tileSize / 2, this.tileSize, this.tileSize);
          this.physics.add.existing(wall, true); // true = 정적 물체
        }
      }
    }

    // 플레이어 생성
    this.player = this.physics.add.sprite(this.startTile.x, this.startTile.y, 'player');
    this.player.setCollideWorldBounds(true);

    // 벽을 저장할 그룹 생성
    this.wallsGroup = this.physics.add.staticGroup();
    
    // 이미 생성된 모든 정적 물체를 그룹에 추가
    this.children.each(child => {
      if (child.body && child.body.immovable) {
        this.wallsGroup.add(child);
      }
    });
    
    // 플레이어와 벽 충돌 처리
    this.physics.add.collider(this.player, this.wallsGroup);
    
    // 카메라 설정
    this.cameras.main.setBounds(0, 0, this.mazeWidth, this.mazeHeight);
    this.cameras.main.startFollow(this.player);

    // 게임 타이머 시작
    this.startTime = this.time.now;
    this.gameTimerText = this.add.text(16, 16, 'Time: 0.0s', { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);

    // 랭킹 시스템 초기화
    this.loadRankings();
  }

  update(time, delta) {
    if (!this.player || this.hasReachedEnd) {
      return;
    }

    // 상태에 따른 플레이어 이동
    this.player.setVelocity(0);

    // predict 함수가 Promise를 반환하지 않도록 수정한 함수 사용
    this.playerState = predict();
    console.log(`예측 수행함 : ${this.playerState}`)

    switch (this.playerState) {
      case '위로':
        this.player.setVelocityY(-this.playerSpeed);
        console.log("위로 이동함")
        break;
      case '아래로':
        console.log("아래로 이동함")
        this.player.setVelocityY(this.playerSpeed);
        break;
      case '왼쪽으로':
        this.player.setVelocityX(-this.playerSpeed);
        this.player.setFlipX(true); // 스프라이트 반전
        console.log("왼쪽으로 이동함")
        break;
      case '오른쪽으로':
        this.player.setVelocityX(this.playerSpeed);
        this.player.setFlipX(false); // 스프라이트 반전
        console.log("오른쪽으로 이동함")
        break;
      case '가만히':
      default:
        this.player.setVelocity(0);
        break;
    }

    // 게임 시간 업데이트
    const elapsedTime = (this.time.now - this.startTime) / 1000;
    this.gameTimerText.setText('Time: ' + elapsedTime.toFixed(1) + 's');

    // 도착 지점 도달 확인
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.endTile.x, this.endTile.y) < this.tileSize / 2) {
      this.reachedEnd();
    }
  }

  reachedEnd() {
    if (this.hasReachedEnd) {
      return;
    }
    this.hasReachedEnd = true;
    this.endTime = this.time.now;
    const elapsedTime = (this.endTime - this.startTime) / 1000;
    this.calculateScore(elapsedTime);
    this.saveRanking(elapsedTime);
    this.showEndScene(elapsedTime);
  }

  calculateScore(time) {
    if (time <= 60) {
      this.starRating = 3;
    } else if (time <= 90) {
      this.starRating = 2;
    } else {
      this.starRating = 1;
    }
    this.score = this.starRating; // 점수는 별 개수로 설정 (추후 변경 가능)
  }

  saveRanking(time) {
    const rankingData = localStorage.getItem('mazeRankings');
    let rankings = rankingData ? JSON.parse(rankingData) : [];
    rankings.push({ time: time, score: this.score });
    rankings.sort((a, b) => a.time - b.time); // 시간 순으로 정렬
    localStorage.setItem('mazeRankings', JSON.stringify(rankings.slice(0, 10))); // 최대 10개 랭킹 저장
  }

  loadRankings() {
    const rankingData = localStorage.getItem('mazeRankings');
    this.rankings = rankingData ? JSON.parse(rankingData) : [];
    console.log('랭킹 로드:', this.rankings);
  }

  showEndScene(elapsedTime) {
    this.scene.start('EndScene', { time: elapsedTime, score: this.score, starRating: this.starRating, rankings: this.rankings });
  }
}

class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  init(data) {
    this.elapsedTime = data.time;
    this.score = data.score;
    this.starRating = data.starRating;
    this.rankings = data.rankings;
  }

  create() {
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, '탈출 성공!', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `소요 시간: ${this.elapsedTime.toFixed(1)}초`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 30, `획득 별: ${'⭐'.repeat(this.starRating)}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

    let rankingText = '랭킹:\n';
    this.rankings.forEach((rank, index) => {
      rankingText += `${index + 1}. ${rank.time.toFixed(1)}초 (별 ${rank.score})\n`;
    });

    this.add.text(16, this.cameras.main.height - 20 - (this.rankings.length * 20), rankingText, { fontSize: '16px', fill: '#eee' });

    const restartButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 80, '다시 시작', { fontSize: '24px', fill: '#fff', backgroundColor: '#444', padding: 10 })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('MazeScene');
      });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 592, // 초기 게임 화면 크기 (미로 크기에 따라 조정 가능)
  height: 592,
  parent: 'game-container', // 게임이 렌더링될 HTML 요소
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MazeScene, EndScene]
};

// 게임 초기화 함수 - 전역으로 사용할 수 있도록 window에 할당
window.initMazeGame = function() {
  // 기존 게임 인스턴스가 있으면 제거
  if (game) {
    game.destroy(true);
  }

  // 새 게임 인스턴스 생성
  game = new Phaser.Game(config);
  console.log('미로 게임이 시작되었습니다.');
};