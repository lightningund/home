const bindings = {
	"keydown": e => keys[e.code] = true,
	"keyup": e => delete keys[e.code]
};

const WIDTH = 800;
const HEIGHT = 800;

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");

let speed = 15;

const ballSize = 20;
const paddleSize = 100;
const paddleWidth = 20;

const aiX = paddleWidth * 2;
const playerX = WIDTH - paddleWidth * 3;

let score = 0;
let keys = [];
let gameOver = true;

let ball = {
	x: WIDTH / 2 - 10,
	y: HEIGHT / 2 - 10,
	vx: 0,
	vy: 0
}

let playerY = 0;
let aiY = 0;

let updateLoop;

const update = () => {
	ball.x += ball.vx;
	ball.y += ball.vy;

	if(keys["KeyW"] || keys["ArrowUp"]) playerY -= speed;
	if(keys["KeyS"] || keys["ArrowDown"]) playerY += speed;

	aiY = ball.y - paddleSize / 2;

	if(aiY < 0) aiY = 0;
	if(aiY > HEIGHT - paddleSize) aiY = HEIGHT - paddleSize;

	if(playerY < 0) playerY = 0;
	if(playerY > HEIGHT - paddleSize) playerY = HEIGHT - paddleSize;

	if(ball.y < 0 || ball.y > HEIGHT - ballSize) ball.vy *= -1;

	if(ball.x + ballSize > playerX && ball.y > playerY && ball.y < playerY + paddleSize) {
		score ++;
		ball.vx = -Math.abs(ball.vx);
	}

	if(ball.x < aiX + paddleWidth && ball.y > aiY && ball.y < aiY + paddleSize) {
		ball.vx = Math.abs(ball.vx);
	}

	if(ball.x > WIDTH) gameOver = true;
}

const render = () => {
	context.fillStyle = "rgba(0,0,0,0.7)";
	//context.fillStyle = "black";
	context.fillRect(0, 0, WIDTH, HEIGHT);
	context.fillStyle = "white";
	context.fillRect(playerX, playerY, paddleWidth, paddleSize);
	context.fillRect(ball.x, ball.y, ballSize, ballSize);
	context.fillRect(aiX, aiY, paddleWidth, paddleSize);
}

const reset = () => {
	score = 0;
	ball.x = WIDTH/2;
	ball.y = HEIGHT/2;
	ball.vx = -10;
	ball.vy = Math.floor(Math.random() * 20) - 10;
	gameOver = false;
}

export const run = (() => {
	const baseDiv = document.querySelector("#appDiv");
	baseDiv.appendChild(canv);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	updateLoop = setInterval(() => {
		if(!gameOver){
			update();
			render();
			ball.vx *= 1.0003;
			ball.vy *= 1.0008;
		} else {
			context.clearRect(0, 0, WIDTH, HEIGHT);
			context.fillStyle = "black";
			context.font = "Bold 30px Helvetica";
			context.fillText("Score: " + score, WIDTH / 2 - 70, HEIGHT / 2 - 10);
			if(keys["Space"]) reset();
		}
	}, 1000/30);
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}

	clearInterval(updateLoop);
};
