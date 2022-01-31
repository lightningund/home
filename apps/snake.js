/** @type {number[]} */
let moveQueue = [];

const WIDTH = 800;
const HEIGHT = 800;

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");

// TODO: Add a grace turn

/**
 * @typedef {Object} Vector
 * @property {number} x
 * @property {number} y
 */

const CELLSIZE = 20;
const cellsX = WIDTH / CELLSIZE;
const cellsY = HEIGHT / CELLSIZE;

const segmentsPerFood = 2;

// Time between each movement in ms
const moveTime = 150;

/** @type {Vector[]} */
let player = [{x: 0, y: 0}];

/** @type {Vector} */
let food = {x: 0, y: 0};

let playerDirection = 1;

let numberOfPiecesToAdd = 0;

let updateLoop;

const keydownfunc = e => {
	switch (e.code) {
		case "ArrowUp":
		case "KeyW":
			moveQueue.push(0);
			break;
		case "ArrowRight":
		case "KeyD":
			moveQueue.push(1);
			break;
		case "ArrowDown":
		case "KeyS":
			moveQueue.push(2);
			break;
		case "ArrowLeft":
		case "KeyA":
			moveQueue.push(3);
			break;
	}
}

const bindings = {
	"keydown": keydownfunc
};

const init = () => {
	player = [{x: 0, y: 0}];
	randomizeFood();
	playerDirection = 1;
	numberOfPiecesToAdd = 0;
	moveQueue = [];
}

const randomizeFood = () => {
	let validFoodPos = false;
	do {
		food.x = Math.floor(Math.random() * cellsX);
		food.y = Math.floor(Math.random() * cellsY);
		validFoodPos = checkFoodPos();
	} while(!validFoodPos)
}

const checkFoodPos = () => {
	for(const piece of player) {
		if(piece.x === food.x && piece.y === food.y) {
			return false;
		}
	}
	return true;
}

const movePlayer = (dx, dy) => {
	let tempTail;
	if(numberOfPiecesToAdd > 0) {
		let lastPiece = player[player.length - 1];
		tempTail = {x: lastPiece.x, y: lastPiece.y};
		numberOfPiecesToAdd--;
	}

	for(let i = player.length - 1; i > 0; i--){
		player[i].x = player[i - 1].x;
		player[i].y = player[i - 1].y;
	}

	player[0].x += dx;
	player[0].y += dy;

	if(tempTail) {
		player.push(tempTail);
	}

	wrapPlayer();
	checkCollisions();
}

const wrapPlayer = () => {
	if(player[0].x < 0) player[0].x = cellsX - 1;
	if(player[0].y < 0) player[0].y = cellsY - 1;
	if(player[0].x >= cellsX) player[0].x = 0;
	if(player[0].y >= cellsY) player[0].y = 0;
}

const checkCollisions = () => {
	const head = player[0];
	for(let i = 1; i < player.length; i++) {
		const piece = player[i];
		if(head.x === piece.x && head.y === piece.y) {
			init();
			return;
		}
	}
}

/**
 * @param {number} dir
 * @returns {x: number, y: number}
 */
const getDir = dir => {
	let dx = 0, dy = 0;
	if(dir == 0) dy = -1;
	if(dir == 1) dx = 1;
	if(dir == 2) dy = 1;
	if(dir == 3) dx = -1;
	return {x: dx, y: dy};
}

const update = () => {
	if(moveQueue.length > 0){
		setPlayerDirection(moveQueue.shift());
	}

	const d = getDir(playerDirection);
	movePlayer(d.x, d.y);

	if(player[0].x === food.x && player[0].y === food.y){
		numberOfPiecesToAdd += segmentsPerFood;
		randomizeFood();
	}
}

const render = () => {
	context.fillStyle = "#808080";
	context.fillRect(0, 0, WIDTH, HEIGHT);

	context.fillStyle = "#FFFF00";
	if(player.length === 1) {
		context.fillRect((player[0].x + 0.2) * CELLSIZE, (player[0].y + 0.2) * CELLSIZE, CELLSIZE * 0.6, CELLSIZE * 0.6);
	} else {
		for(let i = 1; i < player.length; i++) {
			const pa = player[i];
			const pb = player[i - 1];
			const xs = pa.x < pb.x ? [pa.x, pb.x] : [pb.x, pa.x];
			const ys = pa.y < pb.y ? [pa.y, pb.y] : [pb.y, pa.y];

			if(xs[1] - xs[0] > 1 || ys[1] - ys[0] > 1) continue;

			const xa = xs[0] + 0.2;
			const xb = xs[1] + 0.8;
			const ya = ys[0] + 0.2;
			const yb = ys[1] + 0.8;
			context.fillRect(xa * CELLSIZE, ya * CELLSIZE, (xb - xa) * CELLSIZE, (yb - ya) * CELLSIZE);
		}
	}
	context.fillStyle = "#FF0000";
	context.fillRect(food.x * CELLSIZE, food.y * CELLSIZE, CELLSIZE, CELLSIZE);
}

/**
 * @param {number} dir 
 */
const setPlayerDirection = dir => {
	if(playerDirection != (dir + 2) % 4) playerDirection = dir;
}

export const run = () => {
	const baseDiv = document.querySelector("#appDiv");
	baseDiv.appendChild(canv);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	init();

	updateLoop = setInterval(() => {
		update();
		render();
	}, moveTime);
};

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}

	clearInterval(updateLoop);
};