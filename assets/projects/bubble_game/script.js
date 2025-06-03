let ranHit = 0;
let score = 0;
let timer = 60;
let color;
let bubbleClickSound = new Audio("sounds/tap_bubble.mp3");

function makeBubbles(color){
    let ranNumber = 0;
    let space = "";
    for(let i=1; i<348; i++){
        ranNumber = Math.ceil(Math.random()*10);
        space += `<div class="bubble" style="background-color: ${color};">${ranNumber}</div>`;
    }
    document.querySelector(".bottom-panel").innerHTML = space;
}

function generateNewHit(){
    ranHit = Math.ceil(Math.random()*10);
    document.querySelector("#hitVal").innerHTML = ranHit;
}

function increaseScore(){
    score += 10;
    document.querySelector("#scoreVal").innerHTML  = score; 
}

function listenforClicks(){
    document.querySelector(".bottom-panel").addEventListener("click", function (dets){
            if((Number(dets.target.textContent)) == ranHit){
                increaseScore();
                generateNewHit();
                color = newColor();
                makeBubbles("#" + String(color));

                // play sound
                bubbleClickSound.currentTime = 0;  
                bubbleClickSound.play();
            }
    });
}

function newColor(){
    sixDigitValue = Math.ceil(Math.random()*999999);
    return sixDigitValue;
}
function gameOver() {
    // Create overlay div
    const gameOverScreen = document.createElement("div");
    gameOverScreen.className = "gameover-screen";
    gameOverScreen.style.position = "fixed";
    gameOverScreen.style.top = "0";
    gameOverScreen.style.left = "0";
    gameOverScreen.style.width = "100%";
    gameOverScreen.style.height = "100%";
    gameOverScreen.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    gameOverScreen.style.display = "flex";
    gameOverScreen.style.flexDirection = "column";
    gameOverScreen.style.justifyContent = "center";
    gameOverScreen.style.alignItems = "center";
    gameOverScreen.style.textAlign = "center";
    gameOverScreen.style.zIndex = "1000";

    // Create message
    const gameOverText = document.createElement("p");
    gameOverText.innerHTML = `Game Over<br>Your Score: ${score}`;
    gameOverText.style.color = "green";
    gameOverText.style.fontSize = "50px";
    gameOverText.style.marginBottom = "20px";
    gameOverScreen.appendChild(gameOverText);

    // Create Play Again button
    const btn = document.createElement("button");
    btn.innerText = "Play Again";
    btn.style.padding = "10px 20px";
    btn.style.fontSize = "40px";
    btn.style.borderRadius = "10px";
    btn.style.backgroundColor = "hsl(100, 64%, 70%)";
    btn.style.border = "none";
    btn.style.cursor = "pointer";

    btn.onmouseenter = () => (btn.style.backgroundColor = "hsl(100, 64%, 60%)");
    btn.onmouseleave = () => (btn.style.backgroundColor = "hsl(100, 64%, 70%)");

    btn.onclick = function () {
        // Remove the overlay
        document.body.removeChild(gameOverScreen);

        // Reset variables
        score = 0;
        timer = 60;
        document.querySelector("#scoreVal").innerHTML = score;
        document.querySelector("#timerVal").innerHTML = timer;

        startGame();
    };

    gameOverScreen.appendChild(btn);

    // Append overlay to body
    document.body.appendChild(gameOverScreen);
}

function startGame() {
	score = 0;
	timer = 60;
	document.querySelector("#scoreVal").innerHTML = score;
	document.querySelector("#timerVal").innerHTML = timer;
    color = "#" + newColor();
    makeBubbles(color);
    generateNewHit();
    listenforClicks();

    // Start timer
    interval = setInterval(function(){
        if(timer > 0){        
            timer -= 1;
            document.querySelector("#timerVal").innerHTML = timer;
        } else {
            clearInterval(interval);
            gameOver();
        }
    }, 1000);
}

window.onload = function () {
    const startScreen = document.createElement("div");
    startScreen.className = "start-screen";
    startScreen.style.position = "absolute";
    startScreen.style.top = "0";
    startScreen.style.left = "0";
    startScreen.style.width = "100%";
    startScreen.style.height = "100%";
    startScreen.style.display = "flex";
    startScreen.style.flexDirection = "column";
    startScreen.style.justifyContent = "center";
    startScreen.style.alignItems = "center";
    startScreen.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    startScreen.style.zIndex = "100";

    const title = document.createElement("h1");
    title.innerText = "Bubble Hit Game";
    title.style.fontSize = "50px";
    title.style.color = "#333";
    title.style.padding = "0px 70px";
    title.style.justifyContent = "center";
    title.style.alignItems = "center";

    const subtext = document.createElement("p");
	subtext.innerText = "Click the bubbles that match the target number shown above before the timer runs out! \nTimer is set to 60 seconds. Good Luck!";
	subtext.style.fontSize = "24px";
	subtext.style.color = "#666";
	subtext.style.margin = "0 20px 30px 20px";
	subtext.style.textAlign = "center";

    const btn = document.createElement("button");
    btn.innerText = "Start Game";
    btn.style.padding = "10px 20px";
    btn.style.fontSize = "30px";
    btn.style.borderRadius = "10px";
    btn.style.backgroundColor = "hsl(200, 70%, 70%)";
    btn.style.border = "none";
    btn.style.cursor = "pointer";

    btn.onmouseenter = () => (btn.style.backgroundColor = "hsl(200, 70%, 60%)");
    btn.onmouseleave = () => (btn.style.backgroundColor = "hsl(200, 70%, 70%)");

    btn.onclick = function () {
        document.body.removeChild(startScreen); // Hide the start screen
        startGame();
    };

    startScreen.appendChild(title);
    startScreen.appendChild(subtext);
    startScreen.appendChild(btn);

    document.body.appendChild(startScreen);
};