let ranHit = 0;
let score = 0;
let timer = 60;
let color;
let bubbleClickSound = new Audio("Sounds/tap_bubble.mp3");

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

let interval = setInterval(function(){
    if(timer>0){        
        timer -= 1;
        document.querySelector("#timerVal").innerHTML = timer;
    }
    else{
        clearInterval(interval);
        gameOver();
    }
},1000);

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

function gameOver(){
    let panel = document.querySelector(".panel");
    panel.innerHTML = "";
    panel.style.display = "flex";
    panel.style.justifyContent = "center";
    panel.style.textAlign = "center";
    panel.style.alignItems = "center";
    
    const gameOverText = document.createElement('p');
    gameOverText.innerHTML =    `Game Over<br>Your Score: ${score}`;
    gameOverText.innerHTML += "<br>";
    gameOverText.style.color = "green";
    gameOverText.style.fontSize = "50px";
    panel.appendChild(gameOverText);
    
    const btn = document.createElement('button');
    btn.innerHTML = "Play Again";
    btn.style.padding = "0px 10px"
    btn.style.fontSize = '40px';
    btn.style.borderRadius = '10px';
    btn.style.backgroundColor = "hsl(100, 64%, 70%)";
    gameOverText.appendChild(btn);

    btn.onmouseenter = function(){
        btn.style.cursor = "pointer";
        btn.style.backgroundColor = "hsl(100, 64%, 60%)";
    }

    btn.onmouseleave = function(){
        btn.style.backgroundColor = "hsl(100, 64%, 70%)";
    }

    btn.onclick = function() {
        location.reload(true);
    };
}

makeBubbles();
generateNewHit();
listenforClicks()
