// 게임 변수
let model, webcam, labelContainer, maxPredictions;
let isModelLoaded = false;
let predictionInterval = null;
let currentAction = "idle"; // 현재 인식된 동작 (idle, up, down, left, right)
let isLoading = false; // 모델 로딩 중 상태

// 예측 임계값 (이 값 이상일 때 해당 동작으로 인식)
const PREDICTION_THRESHOLD = 0.7;

// 모델 URL (Teachable Machine에서 내보낸 URL)
let modelURL = "";

/**
 * URL로 모델 로드 함수
 */
async function loadModelFromURL() {
    if (isLoading) return; // 이미 로딩 중이면 중복 실행 방지

    const modelURLInput = document.getElementById("model-url");
    const modelStatusElement = document.getElementById("model-status");

    // URL 입력 확인
    const url = modelURLInput.value;
    if (!url) {
        modelStatusElement.textContent = "모델 URL을 입력해주세요.";
        modelStatusElement.className = "status-message error";
        return;
    }

    try {
        isLoading = true;
        // 로딩 스피너 추가
        modelStatusElement.innerHTML = "모델 로딩 중... <div class='loading-spinner'></div>";
        modelStatusElement.className = "status-message";

        // URL 형식 확인 및 수정
        modelURL = url;
        if (!url.endsWith('/')) {
            modelURL = url + '/';
        }
        if (!url.endsWith('model.json') && !url.endsWith('/')) {
            modelURL = url + '/model.json';
        } else if (!url.endsWith('model.json')) {
            modelURL = url + 'model.json';
        }

        modelURL = url + 'model.json';
        const metadataURL = url + 'metadata.json';


        try {
            // Teachable Machine 모델 로드
            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();

            // 웹캠 초기화 및 설정
            await initializeWebcam();

            /* labelContainer = document.getElementById('label-container');
            for (let i = 0; i < maxPredictions; i++) { // and class labels
                labelContainer.appendChild(document.createElement('div'));
            } */

            // 모델 로드 성공 메시지
            modelStatusElement.textContent = "모델이 성공적으로 불러와졌습니다!";
            modelStatusElement.className = "status-message success";
            isModelLoaded = true;

            // 테스트 화면으로 전환
            setTimeout(() => {
                document.getElementById("model-upload-screen").classList.add("hidden");
                document.getElementById("model-test-screen").classList.remove("hidden");

                // 예측 시작
                requestAnimationFrame(loop);
            }, 1500);
        } catch (modelError) {
            console.error("모델 로드 오류:", modelError);
            modelStatusElement.textContent = "모델을 로드할 수 없습니다. URL을 확인해주세요.";
            modelStatusElement.className = "status-message error";
        }
    } catch (error) {
        console.error("모델 로드 중 오류 발생:", error);
        modelStatusElement.textContent = "모델 로드 중 오류가 발생했습니다. 다시 시도해주세요.";
        modelStatusElement.className = "status-message error";
    } finally {
        isLoading = false;
    }
}

/**
 * 웹캠 초기화 함수
 */
async function initializeWebcam() {
    // 웹캠 초기화
    const flip = false; // 웹캠 좌우 반전 여부
    webcam = new tmImage.Webcam(400, 400, flip);

    try {
        // 웹캠 설정
        await webcam.setup();
        await webcam.play();

        // 웹캠 요소에 연결
        document.getElementById("webcam").srcObject = webcam.webcam.srcObject;
        
        // 게임 화면의 웹캠 미리보기에도 연결
        const previewVideo = document.getElementById("webcam-preview");
        if (previewVideo) {
            previewVideo.srcObject = webcam.webcam.srcObject;
        }
        
        return true;
    } catch (webcamError) {
        console.error("웹캠 설정 오류:", webcamError);
        throw webcamError;
    }
}

/**
 * Teachable Machine 모델 로드 함수
 */
async function loadTeachableMachineModel(modelURL) {
    try {
        // Teachable Machine 라이브러리를 사용하여 모델 로드
        const loadedModel = await tmImage.load(modelURL);
        return loadedModel;
    } catch (error) {
        console.error('모델 로드 중 오류:', error);
        throw error;
    }
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predictAsync();
    window.requestAnimationFrame(loop);
}

/**
 * 예측 중지 함수
 */
function stopPrediction() {
    if (predictionInterval) {
        clearInterval(predictionInterval);
        predictionInterval = null;
    }
}

/**
 * 예측 수행 함수
 */
// 비동기 예측 함수 - 내부적으로 사용
async function predictAsync() {
    if (!isModelLoaded || !webcam) return "가만히";

    try {
        // 웹캠에서 이미지 가져와서 예측
        const prediction = await model.predict(webcam.canvas);

        // 예측 결과 UI 업데이트
        updatePredictionUI(prediction);

        // 현재 동작 결정 (가장 높은 확률의 클래스)
        let highestProb = 0;
        let highestClass = "";

        for (let i = 0; i < maxPredictions; i++) {
            const className = prediction[i].className;
            const probability = prediction[i].probability;
            
            if (probability > highestProb) {
                highestProb = probability;
                highestClass = className.toLowerCase();
            }
        }

        // 임계값 이상인 경우에만 동작 변경
        if (highestProb >= PREDICTION_THRESHOLD) {
            // 동작 상태 업데이트
            if (highestClass.includes("정지")) {
                currentAction = "가만히";
            } else if (highestClass.includes("상")) {
                currentAction = "위로";
            } else if (highestClass.includes("하")) {
                currentAction = "아래로";
            } else if (highestClass.includes("좌")) {
                currentAction = "왼쪽으로";
            } else if (highestClass.includes("우")) {
                currentAction = "오른쪽으로";
            }

            // 인식된 동작 표시
            const detectedActionElement = document.getElementById("detected-action");
            if (detectedActionElement) {
                detectedActionElement.textContent = currentAction;
            }
        }
        
        return currentAction;
    } catch (error) {
        console.error("예측 중 오류 발생:", error);
        return "가만히";
    }
}

// 동기 함수 - maze.js에서 사용
function predict() {
    // 모델이 로드되지 않았거나 웹캠이 없는 경우 기본값 반환
    if (!isModelLoaded || !webcam) {
        return "가만히";
    }
    
    // 이미 예측된 현재 동작 반환 (비동기 함수에서 업데이트됨)
    return currentAction;
}

/**
 * 예측 결과 UI 업데이트 함수
 */
function updatePredictionUI(prediction) {
    // 각 클래스별 확률 표시
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const classPrediction = prediction[i];
        const percentage = Math.round(classPrediction.probability * 100);

        // 해당 클래스의 프로그레스 바 및 텍스트 업데이트 - 테스트 화면
        if (className.includes("정지")) {
            updateProgressBar("idle", percentage);
        } else if (className.includes("상")) {
            updateProgressBar("up", percentage);
        } else if (className.includes("하")) {
            updateProgressBar("down", percentage);
        } else if (className.includes("좌")) {
            updateProgressBar("left", percentage);
        } else if (className.includes("우")) {
            updateProgressBar("right", percentage);
        }
    }
    
    // 현재 인식된 동작 게임 화면에도 표시
    const previewAction = document.getElementById("preview-action");
    if (previewAction) {
        previewAction.textContent = currentAction;
    }
}

/**
 * 프로그레스 바 업데이트 함수
 */
function updateProgressBar(type, percentage) {
    // 테스트 화면 프로그레스 바 업데이트
    const bar = document.getElementById(`${type}-bar`);
    const prob = document.getElementById(`${type}-probability`);
    if (bar) bar.style.width = `${percentage}%`;
    if (prob) prob.textContent = `${percentage}%`;
    
    // 게임 화면 프로그레스 바 업데이트
    const previewBar = document.getElementById(`preview-${type}-bar`);
    const previewProb = document.getElementById(`preview-${type}-probability`);
    if (previewBar) previewBar.style.width = `${percentage}%`;
    if (previewProb) previewProb.textContent = `${percentage}%`;
}

/**
 * 웹캠 정리 함수
 */
function cleanupWebcam() {
    if (webcam) {
        webcam.stop();
    }
    stopPrediction();
}

/**
 * 현재 인식된 동작 반환 함수 (게임에서 사용)
 */
function getCurrentAction() {
    return currentAction;
}

/**
 * 모델 리셋 함수
 */
function resetModel() {
    cleanupWebcam();
    isModelLoaded = false;
    model = null;
    webcam = null;
    currentAction = "idle";
}
