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

    function createLanes() {
        const lane1 = document.createElement('div');
        const lane2 = document.createElement('div');
        lane1.classList.add('lane', 'lane1');
        lane2.classList.add('lane', 'lane2');
        gameContainer.appendChild(lane1);
        gameContainer.appendChild(lane2);
    }

    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        const lanes = [25, 125, 225];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        obstacle.style.left = randomLane + 'px';
        obstacle.innerHTML = '<img src="images/blue-car.png" alt="Obstacle Car">';
        gameContainer.appendChild(obstacle);

        let topPosition = -110;
        function animateObstacle() {
            if (isGameOver) return;

            const playerCarRect = playerCar.getBoundingClientRect();
            const obstacleRect = obstacle.getBoundingClientRect();
            
            // 定義一個碰撞緩衝區，數值越大，需要重疊越多才算碰撞
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

    // 玩家車移動函數
    function movePlayerCar(direction) {
        if (isGameOver) return;
    
        // 根據方向更新位置變數
        if (direction === 'left') {
            playerCarPosition -= 100;
        } else if (direction === 'right') {
            playerCarPosition += 100;
        }
    
        // 確保車子不會超出左右邊界
        if (playerCarPosition < 25) {
            playerCarPosition = 25;
        } else if (playerCarPosition > 225) {
            playerCarPosition = 225;
        }
    
        // 將新的位置值應用到 CSS
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

    function spawnObstacles() {
        if (isGameOver) return;
        createObstacle();
        let currentInterval = Math.max(1000, 1500 - (score * 10)); 
        setTimeout(spawnObstacles, currentInterval);
    }

    createLanes();
    spawnObstacles();
});