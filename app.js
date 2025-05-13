
// DOM
const modelUploadScreen = document.getElementById("model-upload-screen");
const modelTestScreen = document.getElementById("model-test-screen");
const gameMainScreen = document.getElementById("game-main-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");
// 입력
const studentIdInput = document.getElementById("student-id");
const playerNameInput = document.getElementById("player-name");


// 이벤트 리스너
document.addEventListener("DOMContentLoaded", initApp);

/**
 * 초기화 함수
 */
function initApp() {
    // 로컬 스토리지에서 최고 점수 가져와서 표시
    updateHighScoreDisplay();
    // 버튼
    const loadURLBtn = document.getElementById("load-url-btn");
    const testYesBtn = document.getElementById("test-yes-btn");
    const testNoBtn = document.getElementById("test-no-btn");
    const startGameBtn = document.getElementById("start-game-btn");
    const restartBtn = document.getElementById("restart-btn");



    // 버튼 이벤트 리스너
    loadURLBtn.addEventListener("click", loadModelFromURL);
    testYesBtn.addEventListener("click", handleModelTestSuccess);
    testNoBtn.addEventListener("click", handleModelTestFailure);
    startGameBtn.addEventListener("click", handleGameStart);
    restartBtn.addEventListener("click", handleRestart);

    // localStorage에서 플레이어 정보 불러오기
    const savedStudentId = localStorage.getItem("studentId");
    const savedPlayerName = localStorage.getItem("playerName");

    if (savedStudentId) {
        studentIdInput.value = savedStudentId;
    }

    if (savedPlayerName) {
        playerNameInput.value = savedPlayerName;
    }

    // 게임 오버 함수를 전역으로
    window.showGameOverScreen = showGameOverScreen;
}

/**
 * 최고 점수 표시 업데이트 함수
 */
function updateHighScoreDisplay() {
    const highScore = parseInt(localStorage.getItem("highScore") || '0', 10);
    document.getElementById("high-score").textContent = highScore;
}

/**
 * 모델 테스트 성공 처리 함수
 */
function handleModelTestSuccess() {
    // 테스트 화면에서 게임 메인 화면으로 전환
    modelTestScreen.classList.add("hidden");
    gameMainScreen.classList.remove("hidden");

    // 예측은 계속 실행 (게임에서 사용)
}

/**
 * 모델 테스트 실패 처리 함수
 */
function handleModelTestFailure() {
    // 웹캠 및 예측 정리
    cleanupWebcam();

    // 모델 업로드 화면으로 돌아가기
    modelTestScreen.classList.add("hidden");
    modelUploadScreen.classList.remove("hidden");

    // 상태 메시지 초기화
    document.getElementById("model-status").textContent = "다른 모델 파일을 선택해주세요.";
    document.getElementById("model-status").className = "status-message";

    // 파일 입력 초기화
    document.getElementById("model-file").value = "";
}

/**
 * 게임 시작 처리 함수
 */
function handleGameStart() {
    // 학번과 이름 가져오기
    const studentId = studentIdInput.value.trim();
    const playerName = playerNameInput.value.trim();

    // 입력 검증
    if (!studentId || !playerName) {
        alert("학번과 이름을 모두 입력해주세요.");
        return;
    }

    // 로컬 스토리지에 저장
    localStorage.setItem("studentId", studentId);
    localStorage.setItem("playerName", playerName);

    // 게임 메인 화면에서 게임 화면으로 전환
    gameMainScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    // 카운트다운 시작
    startCountdown();
}

/**
 * 카운트다운 함수
 */
function startCountdown() {
    const countdownElement = document.getElementById("countdown");
    countdownElement.classList.remove("hidden");

    let count = 5;
    countdownElement.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = count;

        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownElement.classList.add("hidden");

            // 게임 시작
            startGame();
        }
    }, 1000);
}

/**
 * 게임 오버 화면 표시 함수
 */
function showGameOverScreen() {
    // 게임 화면에서 게임 오버 화면으로 전환
    gameScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");

    // 최종 점수 표시
    document.querySelector("#final-score span").textContent = score;

    // 최고 점수 표시
    const highScore = localStorage.getItem("highScore") || 0;
    document.querySelector("#best-score span").textContent = highScore;

    // 랭킹 표시
    displayRanking();
}

/**
 * 랭킹 표시 함수
 */
function displayRanking() {
    const rankingList = document.getElementById("ranking-list");
    rankingList.innerHTML = "";

    // 로컬 스토리지에서 랭킹 정보 가져오기
    const rankings = JSON.parse(localStorage.getItem("rankings") || "[]");

    if (rankings.length === 0) {
        rankingList.innerHTML = "<li>랭킹 정보가 없습니다.</li>";
        return;
    }

    // 랭킹 목록 생성
    rankings.forEach((ranking, index) => {
        const rankingItem = document.createElement("li");
        rankingItem.innerHTML = `
            <span>${index + 1}. ${ranking.studentId} ${ranking.playerName}</span>
            <span>${ranking.score}점</span>
        `;

        // 현재 플레이어의 랭킹 강조
        const currentStudentId = localStorage.getItem("studentId");
        if (ranking.studentId === currentStudentId) {
            rankingItem.style.fontWeight = "bold";
            rankingItem.style.backgroundColor = "#f0f8ff";
        }

        rankingList.appendChild(rankingItem);
    });
}

/**
 * 재시작 처리 함수
 */
function handleRestart() {
    // 게임 종료
    endGame();

    // 모델 리셋
    resetModel();

    // 첫 화면으로 돌아가기
    gameOverScreen.classList.add("hidden");
    modelUploadScreen.classList.remove("hidden");

    // 상태 메시지 초기화
    document.getElementById("model-status").textContent = "";
    document.getElementById("model-status").className = "status-message";

    // 파일 입력 초기화
    document.getElementById("model-file").value = "";
}
