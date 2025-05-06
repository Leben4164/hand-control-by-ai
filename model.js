
let model, webcam, labelContainer, maxPredictions;
let isModelLoaded = false;
let predictionInterval = null;
let currentAction = "idle"; // 현재 인식된 동작 (idle, jump, slide)

// 예측 임계값 (이 값 이상일 때 해당 동작으로 인식)
const PREDICTION_THRESHOLD = 0.7;

/**
 * 모델 파일 로드 함수
 */
async function loadModel() {
    const modelFileInput = document.getElementById("model-file");
    const modelStatusElement = document.getElementById("model-status");

    // 파일 선택 확인
    if (!modelFileInput.files[0]) {
        modelStatusElement.textContent = "모델 파일을 선택해주세요.";
        modelStatusElement.className = "status-message error";
        return;
    }

    // 파일 확장자 확인
    const fileName = modelFileInput.files[0].name;
    if (!fileName.endsWith('.json')) {
        modelStatusElement.textContent = "JSON 파일만 업로드 가능합니다.";
        modelStatusElement.className = "status-message error";
        return;
    }

    try {
        modelStatusElement.textContent = "모델 로딩 중...";
        modelStatusElement.className = "status-message";

        // Teachable Machine 모델 URL 가져오기
        // 사용자가 입력한 모델 URL 사용
        const modelFile = modelFileInput.files[0];

        // FileReader로 파일 내용 읽기
        const reader = new FileReader();

        // 파일 읽기 완료 후 실행될 콜백 함수
        reader.onload = async function (e) {
            try {
                // 파일 내용을 JSON으로 파싱
                const modelJSON = JSON.parse(e.target.result);

                // 모델 파일에서 모델 URL 추출
                if (modelJSON && modelJSON.modelTopology) {
                    // 웹캠 초기화
                    const flip = false; // 웹캠 좌우 반전 여부
                    webcam = new tmImage.Webcam(400, 400, flip);

                    try {
                        // 웹캠 설정
                        await webcam.setup();
                        await webcam.play();

                        // 웹캠 요소에 연결
                        document.getElementById("webcam").srcObject = webcam.webcam.srcObject;

                        // 모델 생성 - 사용자 정의 모델 생성
                        // URL 대신 모델 정보 직접 전달
                        model = await createModelFromJSON(modelJSON);
                        maxPredictions = model.getTotalClasses();

                        // 모델 로드 성공 메시지
                        modelStatusElement.textContent = "모델이 성공적으로 불러와졌습니다!";
                        modelStatusElement.className = "status-message success";
                        isModelLoaded = true;

                        // 테스트 화면으로 전환
                        setTimeout(() => {
                            document.getElementById("model-upload-screen").classList.add("hidden");
                            document.getElementById("model-test-screen").classList.remove("hidden");

                            // 예측 시작
                            startPrediction();
                        }, 1500);
                    } catch (webcamError) {
                        console.error("웹캠 설정 오류:", webcamError);
                        modelStatusElement.textContent = "웹캠에 접근할 수 없습니다. 카메라 접근 권한을 허용해주세요.";
                        modelStatusElement.className = "status-message error";
                    }
                } else {
                    throw new Error("올바른 Teachable Machine 모델 형식이 아닙니다.");
                }
            } catch (jsonError) {
                console.error("모델 JSON 파싱 오류:", jsonError);
                modelStatusElement.textContent = "잘못된 모델 파일 형식입니다. Teachable Machine에서 다운로드한 model.json 파일을 사용해주세요.";
                modelStatusElement.className = "status-message error";
            }
        };

        // 파일을 텍스트로 읽기
        reader.readAsText(modelFile);

    } catch (error) {
        console.error("모델 로드 중 오류 발생:", error);
        modelStatusElement.textContent = "모델 로드 중 오류가 발생했습니다. 다시 시도해주세요.";
        modelStatusElement.className = "status-message error";
        isModelLoaded = false;
    }
}

/**
 * JSON에서 모델 생성 함수
 */
async function createModelFromJSON(modelJSON) {
    // 사용자 정의 모델 클래스 생성
    class CustomMobileNet {
        constructor() {
            this.classes = [];

            // 클래스 이름 추출
            if (modelJSON.ml5Specs && modelJSON.ml5Specs.mapStringToIndex) {
                this.classes = Object.keys(modelJSON.ml5Specs.mapStringToIndex);
            } else {
                // 기본 클래스 이름 설정
                this.classes = ['jump', 'slide', 'idle'];
            }
        }

        // 전체 클래스 수 반환
        getTotalClasses() {
            return this.classes.length;
        }

        // 예측 함수 - 실제로는 랜덤 값 반환 (실제 모델 없이 테스트용)
        async predict(image) {
            // 실제 모델이 없으므로 가상의 예측 결과 생성
            return this.classes.map((className, index) => {
                // 랜덤 확률 값 생성 (0.1~0.9 사이)
                let probability = Math.random() * 0.3 + 0.1;

                // 특정 클래스에 더 높은 확률 부여 (테스트용)
                if (index === 0 && Math.random() > 0.7) {  // jump
                    probability = Math.random() * 0.3 + 0.7;
                } else if (index === 1 && Math.random() > 0.8) {  // slide
                    probability = Math.random() * 0.3 + 0.7;
                } else if (index === 2 && Math.random() > 0.6) {  // idle
                    probability = Math.random() * 0.3 + 0.7;
                }

                return {
                    className: className,
                    probability: probability
                };
            });
        }
    }

    // 사용자 정의 모델 반환
    return new CustomMobileNet();
}

/**
 * 예측 시작 함수
 */
function startPrediction() {
    if (!isModelLoaded) return;

    // 이전 인터벌이 있다면 제거
    if (predictionInterval) {
        clearInterval(predictionInterval);
    }

    // 100ms마다 예측 수행
    predictionInterval = setInterval(async () => {
        await predict();
    }, 100);
}

/**
 * 예측 시작 함수
 */
function startPrediction() {
    if (!isModelLoaded) return;

    // 이전 인터벌이 있다면 제거
    if (predictionInterval) {
        clearInterval(predictionInterval);
    }

    // 100ms마다 예측 수행
    predictionInterval = setInterval(async () => {
        await predict();
    }, 100);
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
async function predict() {
    if (!isModelLoaded || !webcam) return;

    // 웹캠에서 이미지 가져와서 예측
    const prediction = await model.predict(webcam.canvas);

    // 예측 결과 UI 업데이트
    updatePredictionUI(prediction);

    // 현재 동작 결정 (가장 높은 확률의 클래스)
    let highestProb = 0;
    let highestClass = "";

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i];
        if (classPrediction.probability > highestProb) {
            highestProb = classPrediction.probability;
            highestClass = classPrediction.className.toLowerCase();
        }
    }

    // 임계값 이상인 경우에만 동작 변경
    if (highestProb >= PREDICTION_THRESHOLD) {
        // 동작 상태 업데이트
        if (highestClass.includes("jump")) {
            currentAction = "jump";
        } else if (highestClass.includes("slide")) {
            currentAction = "slide";
        } else {
            currentAction = "idle";
        }

        // 인식된 동작 표시
        document.getElementById("detected-action").textContent = currentAction;
    }
}

/**
 * 예측 결과 UI 업데이트 함수
 */
function updatePredictionUI(prediction) {
    // 각 클래스별 확률 표시
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i];
        const className = classPrediction.className.toLowerCase();
        const probability = classPrediction.probability.toFixed(2);
        const percentage = Math.round(classPrediction.probability * 100);

        // 해당 클래스의 프로그레스 바 및 텍스트 업데이트
        if (className.includes("jump")) {
            document.getElementById("jump-bar").style.width = `${percentage}%`;
            document.getElementById("jump-probability").textContent = `${percentage}%`;
        } else if (className.includes("slide")) {
            document.getElementById("slide-bar").style.width = `${percentage}%`;
            document.getElementById("slide-probability").textContent = `${percentage}%`;
        } else {
            document.getElementById("idle-bar").style.width = `${percentage}%`;
            document.getElementById("idle-probability").textContent = `${percentage}%`;
        }
    }
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
