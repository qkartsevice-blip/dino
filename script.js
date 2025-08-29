document.addEventListener('DOMContentLoaded', () => {

    const gameContainer = document.getElementById('game-container');
    const playerCar = document.getElementById('player-car');
    const scoreDisplay = document.getElementById('score');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    let score = 0;
    let baseSpeed = 5;
    let speed = baseSpeed;
    let speedIncrement = 0.5;
    let speedInterval = 10;
    let isGameOver = false;

    // 玩家車子的初始位置變數，確保程式能正確追蹤它的位置
    let playerCarPosition = 115;
    playerCar.style.left = playerCarPosition + 'px';

    // 用來追蹤每個車道的物件
    let laneStatus = {
        '25': null,
        '125': null,
        '225': null
    };

    function createLanes() {
        const lane1 = document.createElement('div');
        const lane2 = document.createElement('div');
        lane1.classList.add('lane', 'lane1');
        lane2.classList.add('lane', 'lane2');
        gameContainer.appendChild(lane1);
        gameContainer.appendChild(lane2);
    }

    // 尋找一個隨機且可用的車道
    function getRandomAvailableLane() {
        const availableLanes = Object.keys(laneStatus).filter(lane => laneStatus[lane] === null);
        if (availableLanes.length === 0) {
            return null; // 如果沒有可用的車道
        }
        const randomLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        return randomLane;
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
                isGameOver = true;
                alert("遊戲結束! 你的分數是: " + score);
                location.reload();
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

    // 玩家車移動函數
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

    // 鍵盤控制
    document.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft') {
            movePlayerCar('left');
        } else if (e.code === 'ArrowRight') {
            movePlayerCar('right');
        }
    });

    // 虛擬按鍵控制
    leftBtn.addEventListener('click', () => {
        movePlayerCar('left');
    });

    rightBtn.addEventListener('click', () => {
        movePlayerCar('right');
    });

    // 隨機生成物件（障礙物或金幣）
    function spawnRandomObject() {
        if (isGameOver) return;

        // 隨機決定生成障礙物或金幣 (例如 70% 機率生成障礙物)
        if (Math.random() > 0.3) {
            createObstacle();
        } else {
            createCoin();
        }

        const nextSpawnInterval = Math.max(800, 1500 - (score * 10));
        setTimeout(spawnRandomObject, nextSpawnInterval);
    }

    createLanes();
    spawnRandomObject();
});
