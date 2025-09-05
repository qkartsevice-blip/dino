// 🏆🏆🏆 你從 Firebase 複製的設定程式碼 🏆🏆🏆
const firebaseConfig = {
  apiKey: "AIzaSyDdU5ur3-Y_N18C-XowZYOtMBW5tMkywBQ",
  authDomain: "cargameleaderboard-c5420.firebaseapp.com",
  projectId: "cargameleaderboard-c5420",
  storageBucket: "cargameleaderboard-c5420.firebasestorage.app",
  messagingSenderId: "1084071115619",
  appId: "1:1084071115619:web:630750143f56546e65f156",
  measurementId: "G-2CES65P4N3"
};

// 初始化 Firebase 和 Firestore
if (typeof firebase !== 'undefined' && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
} else {
    var db = null;
}

document.addEventListener('DOMContentLoaded', () => {
    
    const gameContainer = document.getElementById('game-container');
    const playerCar = document.getElementById('player-car'); // 修正：移除多餘的 document =
    const scoreDisplay = document.getElementById('score');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const introOverlay = document.getElementById('intro-overlay');
    const startBtn = document.getElementById('start-btn');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoresList = document.getElementById('high-scores-list');
    const restartBtn = document.getElementById('restart-btn');
    const usernameInput = document.getElementById('username');
    const loadingSpinner = document.getElementById('loading-spinner');
    const couponScreen = document.getElementById('coupon-screen');
    const couponDoneBtn = document.getElementById('coupon-done-btn');
    const couponTitle = document.getElementById('coupon-title');
    const couponMessage = document.getElementById('coupon-message');
    const couponOfferScreen = document.getElementById('coupon-offer-screen');
    const getCouponBtn = document.getElementById('get-coupon-btn');
    const declineCouponBtn = document.getElementById('decline-coupon-btn');

    let score = 0;
    let baseSpeed = 5;
    let speed = baseSpeed;
    let speedIncrement = 0.5;
    let speedInterval = 10;
    let isGameOver = false;

    let playerCarPosition = 115;
    playerCar.style.left = playerCarPosition + 'px';

    let laneStatus = {
        '25': null,
        '125': null,
        '225': null
    };

    // 處理最高分數的函式
    async function saveScoreToDB(currentScore, username) {
        if (!db) {
            console.error("Firebase 資料庫未初始化。無法儲存分數。");
            return;
        }
        try {
            await db.collection("highScores").add({
                name: username || '匿名玩家',
                score: currentScore,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("分數已成功上傳！");
        } catch (e) {
            console.error("上傳分數時發生錯誤: ", e);
        }
    }

    async function getHighScoresFromDB() {
        if (!db) {
            console.error("Firebase 資料庫未初始化。無法讀取排行榜。");
            return [];
        }
        try {
            loadingSpinner.classList.remove('hidden');
            const scoresRef = db.collection("highScores").orderBy("score", "desc").limit(7);
            const snapshot = await scoresRef.get();
            const scores = snapshot.docs.map(doc => doc.data());
            loadingSpinner.classList.add('hidden');
            return scores;
        } catch (e) {
            console.error("讀取排行榜時發生錯誤: ", e);
            loadingSpinner.classList.add('hidden');
            return [];
        }
    }

    async function displayHighScores() {
        const scores = await getHighScoresFromDB();
        highScoresList.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const li = document.createElement('li');

            if (scores[i]) {
                const trophy = document.createElement('span');
                trophy.classList.add('trophy');

                if (i === 0) {
                    trophy.textContent = '🥇';
                } else if (i === 1) {
                    trophy.textContent = '🥈';
                } else if (i === 2) {
                    trophy.textContent = '🥉';
                }

                if (i < 3) {
                    li.appendChild(trophy);
                }
                const textNode = document.createTextNode(`${i + 1}. ${scores[i].name}: ${scores[i].score}`);
                li.appendChild(textNode);
            } else {
                li.textContent = `${i + 1}. --`;
            }

            highScoresList.appendChild(li);
        }
    }

    // 新增：取得獨一無二的優惠券編號
    async function getUniqueCouponCode() {
        if (!db) {
            couponTitle.textContent = "無法取得優惠碼";
            couponMessage.textContent = "請檢查連線或稍後再試";
            return;
        }
        
        const counterRef = db.collection('counters').doc('coupon');
        try {
            const newCouponNumber = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(counterRef);
                const couponLimit = 100; // 優惠券發放上限

                if (!doc.exists) {
                    transaction.set(counterRef, { couponNumber: 1 });
                    return 1;
                }
                
                const currentNumber = doc.data().couponNumber;
                if (currentNumber >= couponLimit) {
                    return null;
                }

                const newNumber = currentNumber + 1;
                transaction.update(counterRef, { couponNumber: newNumber });
                return newNumber;
            });
            
            if (newCouponNumber !== null) {
                const formattedNumber = newCouponNumber.toString().padStart(2, '0');
                couponTitle.textContent = "恭喜你獲得折價券！";
                couponMessage.innerHTML = `優惠碼: <span class="coupon-code">Q-Kart-${formattedNumber}</span><br>憑此畫面截圖享體驗價100！<br>使用期限至2025/12/31`;
            } else {
                couponTitle.textContent = "優惠券已全數發放完畢";
                couponMessage.textContent = "請下次再來挑戰！";
            }
        } catch (e) {
            console.error("生成優惠券編號時發生錯誤: ", e);
            couponTitle.textContent = "無法取得優惠碼";
            couponMessage.textContent = "請檢查連線或稍後再試";
        }
    }

    function endGame() {
        isGameOver = true;
        
        introOverlay.classList.add('hidden');
        
        if (score >= 150) {
            couponOfferScreen.classList.remove('hidden');
        } else {
            gameOverScreen.classList.remove('hidden');
            finalScoreDisplay.textContent = score;
            const username = usernameInput.value;
            saveScoreToDB(score, username);
            displayHighScores();
        }
    }
    
    function createLanes() {
        const lane1 = document.createElement('div');
        const lane2 = document.createElement('div');
        lane1.classList.add('lane', 'lane1');
        lane2.classList.add('lane', 'lane2');
        gameContainer.appendChild(lane1);
        gameContainer.appendChild(lane2);
    }
    
    function getRandomAvailableLane() {
        const availableLanes = Object.keys(laneStatus).filter(lane => laneStatus[lane] === null);
        if (availableLanes.length === 0) {
            return null;
        }
        const randomLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        return randomLane;
    }
    
    function showScoreFeedback(value, type) {
        const feedback = document.createElement('div');
        feedback.textContent = (value > 0 ? '+' : '') + value;
        feedback.classList.add('score-feedback', type === 'positive' ? 'positive' : 'negative');

        feedback.style.left = (playerCar.offsetLeft + playerCar.offsetWidth / 2 - feedback.offsetWidth / 2) + 'px';
        feedback.style.top = (playerCar.offsetTop - 30) + 'px';

        gameContainer.appendChild(feedback);

        feedback.addEventListener('animationend', () => {
            feedback.remove();
        });
    }

    function shakeScreen() {
        gameContainer.classList.add('shake-animation');
        gameContainer.addEventListener('animationend', () => {
            gameContainer.classList.remove('shake-animation');
        }, { once: true });
    }
    
    // 修正：新增測試模式邏輯
    function spawnRandomObject() {
        if (isGameOver || !introOverlay.classList.contains('hidden')) return;

        const username = usernameInput.value.toLowerCase();
        if (username === '測試測試a') {
            // 只生成金幣
            createCoin();
        } else {
            // 正常遊戲模式
            const randomNumber = Math.random();
            if (randomNumber < 0.6) {
                createObstacle();
            } else if (randomNumber < 0.8) {
                createCoin();
            } else {
                createPothole();
            }
        }
        const nextSpawnInterval = Math.max(800, 1500 - (score * 10));
        setTimeout(spawnRandomObject, nextSpawnInterval);
    }
    
    function createObstacle() {
        const lane = getRandomAvailableLane();
        if (!lane) return;

        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        obstacle.style.left = lane + 'px';
        obstacle.innerHTML = '<img src="images/blue-car.png" alt="Obstacle Car">';
        gameContainer.appendChild(obstacle);

        laneStatus[lane] = 'obstacle';

        let topPosition = -110;
        function animateObstacle() {
            if (isGameOver) return;

            const playerCarRect = playerCar.getBoundingClientRect();
            const obstacleRect = obstacle.getBoundingClientRect();
            
            const collisionPadding = 20;

            if (
                playerCarRect.left < obstacleRect.right - collisionPadding &&
                playerCarRect.right > obstacleRect.left + collisionPadding &&
                playerCarRect.top < obstacleRect.bottom - collisionPadding &&
                playerCarRect.bottom > obstacleRect.top + collisionPadding
            ) {
                endGame();
                return;
            }

            if (topPosition > 500) {
                obstacle.remove();
                laneStatus[lane] = null;
                score++;
                scoreDisplay.textContent = score;

                if (score % speedInterval === 0 && score !== 0) {
                    speed += speedIncrement;
                }
                return;
            }
            
            topPosition += speed;
            obstacle.style.top = topPosition + 'px';

            requestAnimationFrame(animateObstacle);
        }
        animateObstacle();
    }

    function createCoin() {
        const lane = getRandomAvailableLane();
        if (!lane) return;

        const coin = document.createElement('div');
        coin.classList.add('coin');
        coin.style.left = lane + 'px';
        gameContainer.appendChild(coin);

        laneStatus[lane] = 'coin';

        let topPosition = -30;
        function animateCoin() {
            if (isGameOver) return;

            const playerCarRect = playerCar.getBoundingClientRect();
            const coinRect = coin.getBoundingClientRect();

            if (
                playerCarRect.left < coinRect.right &&
                playerCarRect.right > coinRect.left &&
                playerCarRect.top < coinRect.bottom &&
                playerCarRect.bottom > coinRect.top
            ) {
                coin.remove();
                laneStatus[lane] = null;
                score += 5;
                scoreDisplay.textContent = score;
                showScoreFeedback(5, 'positive');
                return;
            }

            if (topPosition > 500) {
                coin.remove();
                laneStatus[lane] = null;
                return;
            }

            topPosition += speed;
            coin.style.top = topPosition + 'px';

            requestAnimationFrame(animateCoin);
        }
        animateCoin();
    }

    function createPothole() {
        const lane = getRandomAvailableLane();
        if (!lane) return;

        const pothole = document.createElement('div');
        pothole.classList.add('pothole');
        pothole.style.left = lane + 'px';
        gameContainer.appendChild(pothole);

        laneStatus[lane] = 'pothole';

        let topPosition = -40;
        function animatePothole() {
            if (isGameOver) return;

            const playerCarRect = playerCar.getBoundingClientRect();
            const potholeRect = pothole.getBoundingClientRect();

            if (
                playerCarRect.left < potholeRect.right &&
                playerCarRect.right > potholeRect.left &&
                playerCarRect.top < potholeRect.bottom &&
                playerCarRect.bottom > potholeRect.top
            ) {
                pothole.remove();
                laneStatus[lane] = null;
                score -= 5;
                scoreDisplay.textContent = score;
                showScoreFeedback(-5, 'negative');
                shakeScreen();
                
                if (score < 0) {
                    endGame();
                    return;
                }
                return;
            }

            if (topPosition > 500) {
                pothole.remove();
                laneStatus[lane] = null;
                return;
            }
            
            topPosition += speed;
            pothole.style.top = topPosition + 'px';

            requestAnimationFrame(animatePothole);
        }
        animatePothole();
    }

    function movePlayerCar(direction) {
        if (isGameOver) return;
    
        if (direction === 'left') {
            playerCarPosition -= 100;
        } else if (direction === 'right') {
            playerCarPosition += 100;
        }
    
        if (playerCarPosition < 25) {
            playerCarPosition = 25;
        } else if (playerCarPosition > 225) {
            playerCarPosition = 225;
        }
    
        playerCar.style.left = playerCarPosition + 'px';
    }

    document.addEventListener('keydown', (e) => {
        if (!isGameOver && introOverlay.classList.contains('hidden')) {
            if (e.code === 'ArrowLeft') {
                movePlayerCar('left');
            } else if (e.code === 'ArrowRight') {
                movePlayerCar('right');
            }
        }
    });

    leftBtn.addEventListener('click', () => {
        if (!isGameOver && introOverlay.classList.contains('hidden')) {
            movePlayerCar('left');
        }
    });

    rightBtn.addEventListener('click', () => {
        if (!isGameOver && introOverlay.classList.contains('hidden')) {
            movePlayerCar('right');
        }
    });

    function startGame() {
        introOverlay.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        couponScreen.classList.add('hidden');
        couponOfferScreen.classList.add('hidden');
        createLanes();
        spawnRandomObject();
    }

    startBtn.addEventListener('click', () => {
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });
    
    getCouponBtn.addEventListener('click', () => {
        couponOfferScreen.classList.add('hidden');
        couponScreen.classList.remove('hidden');
        const username = usernameInput.value;
        saveScoreToDB(score, username);
        getUniqueCouponCode();
    });

    declineCouponBtn.addEventListener('click', () => {
        couponOfferScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = score;
        const username = usernameInput.value;
        saveScoreToDB(score, username);
        displayHighScores();
    });

    couponDoneBtn.addEventListener('click', () => {
        couponScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = score;
        displayHighScores();
    });

    createLanes();
});
