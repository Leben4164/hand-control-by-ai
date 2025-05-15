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
    this.mazeData = [ // 임의의 미로 맵 (개발자가 수정 가능)
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 4, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 2, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    this.tileColors = { // 타일 색상 (개발자가 수정 가능)
      0: 0x808080, // 회색 (바닥 1)
      3: 0xffff00, // 노란색 (바닥 2)
      1: 0x000000, // 검정 (벽 & 테두리)
      2: 0x0000ff, // 파랑 (출발지)
      4: 0xff0000  // 빨강 (도착지)
    };
    this.tileSize = 32; // 타일 크기 (플레이어 스프라이트에 맞춰 조정 필요)
    this.playerSpeed = 100;
    this.playerState = '가만히';
  }

  preload() {
    this.load.image('player', 'assets/player.png'); // 플레이어 스프라이트 로드 (assets 폴더에 player.png 파일 필요)
  }

  create() {
    this.cameras.main.setBackgroundColor('#333333'); // 배경색 설정

    // 맵 생성
    this.map = this.make.tilemap({ data: this.mazeData, tileWidth: this.tileSize, tileHeight: this.tileSize });
    this.tileset = this.map.addTilesetImage(null, null, this.tileSize, this.tileSize, 0, 0); // 이미지 없이 색상으로 타일 생성

    this.wallsLayer = this.map.createBlankLayer('walls', 0, 0, this.map.width, this.map.height);
    this.floorLayer1 = this.map.createBlankLayer('floor1', 0, 0, this.map.width, this.map.height);
    this.floorLayer2 = this.map.createBlankLayer('floor2', 0, 0, this.map.width, this.map.height);
    this.startLayer = this.map.createBlankLayer('start', 0, 0, this.map.width, this.map.height);
    this.endLayer = this.map.createBlankLayer('end', 0, 0, this.map.width, this.map.height);

    for (let y = 0; y < this.mazeData.length; y++) {
      for (let x = 0; x < this.mazeData[y].length; x++) {
        const tileValue = this.mazeData[y][x];
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;

        switch (tileValue) {
          case 1:
            this.wallsLayer.fill(this.tileColors[tileValue], x, y, 1, 1);
            break;
          case 0:
            this.floorLayer1.fill(this.tileColors[tileValue], x, y, 1, 1);
            break;
          case 3:
            this.floorLayer2.fill(this.tileColors[tileValue], x, y, 1, 1);
            break;
          case 2:
            this.startLayer.fill(this.tileColors[tileValue], x, y, 1, 1);
            this.startTile = { x: tileX + this.tileSize / 2, y: tileY + this.tileSize / 2 };
            break;
          case 4:
            this.endLayer.fill(this.tileColors[tileValue], x, y, 1, 1);
            this.endTile = { x: tileX + this.tileSize / 2, y: tileY + this.tileSize / 2 };
            break;
        }
      }
    }

    // 플레이어 생성
    this.player = this.physics.add.sprite(this.startTile.x, this.startTile.y, 'player');
    this.player.setCollideWorldBounds(true);

    // 물리 엔진 활성화 (벽 레이어와 충돌 처리)
    this.physics.add.collider(this.player, this.wallsLayer);

    // 카메라 설정
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
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

    this.playerState = predict();

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
  width: 320, // 초기 게임 화면 크기 (미로 크기에 따라 조정 가능)
  height: 320,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MazeScene, EndScene]
};

// 게임 시작 함수
function startGame() {
  // 기존 게임 인스턴스가 있으면 제거
  if (game) {
    game.destroy(true);
  }

  // 새 게임 인스턴스 생성
  game = new Phaser.Game(config);
}