import { Button, Vector2 as Vector, logb } from "https://lightningund.github.io/Methlib/methlib.js";

class Rect {
	constructor() {
		this.SPD = 20;
		this.ACC = 7;
		this.FRICTION = 0.8;

		/** @type {Vector} */
		this.pos = new Vector();

		/** @type {Vector} */
		this.vel = new Vector();

		/** @type {Vector} */
		this.acc = new Vector();

		/** @type {Vector} */
		this.size = new Vector(20, 20);

		this.updatePos = () => {
			this.vel.add(this.acc);
			this.pos.add(this.vel);
		}
	}
}

class Player extends Rect {
	constructor() {
		super();

		this.pos = new Vector(WIDTH / 2, HEIGHT - 20);

		this.wallLimit = new Vector(WIDTH, HEIGHT).sub(this.size);

		this.boundCheck = () => {
			vectorLimit(this.vel, {x : -this.SPD, y : -this.SPD}, {x : this.SPD, y : this.SPD});
			this.vel.scale(this.FRICTION);
			vectorLimit(this.pos, {x : 0, y : 0}, this.wallLimit);
		};

		this.update = () => {
			this.mover();
			this.updatePos();
			this.boundCheck();
		};

		this.mover = () => {
			this.acc.x = 0;
			this.acc.y = 0;
			if (keys["KeyW"] || keys["ArrowUp"]) this.acc.y = -this.ACC;
			if (keys["KeyS"] || keys["ArrowDown"]) this.acc.y = this.ACC;
			if (keys["KeyA"] || keys["ArrowLeft"]) this.acc.x = -this.ACC;
			if (keys["KeyD"] || keys["ArrowRight"]) this.acc.x = this.ACC;
		};
	}
}

class Enemy extends Rect {
	constructor(enemNum, diff) {
		super();

		this.enemPosInc = (WIDTH - 40) / 2;
		this.BASE_REPEL_FORCE = 5000;

		this.pos = new Vector(this.enemPosInc * enemNum, 20);
		this.speedup = 1;

		this.update = (target, enems) => {
			this.acc.x = 0;
			this.acc.y = 0;
			this.vel.scale(0.9);
			this.mover(target);
			this.repel(enems);
			this.updatePos();
			this.speedup *= 1.0001;
		};

		// Move function for enemies
		this.mover = target => {
			let dx = Vector.sub(target.pos, this.pos);
			let divisor = 1;

			if (diff === 1) divisor = 100;
			else if (diff === 2) divisor = 50;
			else if (diff === 3) divisor = 25;

			divisor /= this.speedup;

			this.acc = dx.scale(1 / divisor);
		};

		this.repel = enems => {
			for(const enem of enems) {
				if(enem !== this) {
					const repulsion = Vector.sub(this.pos, enem.pos);
					const dist = repulsion.squareLength();
					repulsion.normalize();
					repulsion.scale(this.BASE_REPEL_FORCE / dist);
					this.vel.add(repulsion);
				}
			}
		};
	}
}

class Goal extends Rect {
	constructor() {
		super();

		this.size = new Vector(40, 40);

		// Randomize the position of the goal Rect
		this.randomizePos = () => {
			this.pos = new Vector(
				Math.random() * (WIDTH - 40),
				Math.random() * (HEIGHT - 40)
			);
		};
	}
}

// Array for what keys are currently being pressed
let keys = [];

const WIDTH = 800;
const HEIGHT = 800;

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");
context.textAlign = "center";
context.font = "Bold 50px Consolas";

const BS = 100; // Button Size

// Background and button colors for the different difficulties
const diffCols = ["#00FF00", "#FF8000", "#FF0000"];

// The buttons to start the game at any given difficulty
let buttons = [];

let player;
let goalRect;
let enemies = [];

let onMenu = false;
let bestScores = [0, 0, 0];
let score = 0;
let dead = true;
let diff = 0;

let updateLoop;

for (let i = 0; i < 3; i ++) {
	const x = (WIDTH * (i * 2 + 1)) / 6 - BS / 2;
	const y = (HEIGHT * 3) / 4 - BS / 2;
	buttons[i] = new Button(() => start(i + 1), x, y, BS, BS);
}

const keydownfunc = e => {
	keys[e.code] = true;
	if (dead && e.code === "KeyE") {
		diff ++;
		diff %= 3;
		console.log(diff);
	}
}

const keyupfunc = e => delete keys[e.code];

const bindings = {
	"keydown": keydownfunc,
	"keyup": keyupfunc
};

const limit = (limitee, min, max) => {
	if(limitee < min) return min;
	if(limitee > max) return max;
	return limitee;
}

/**
 * @param {Vector} limitee
 * @param {Vector} min
 * @param {Vector} max
 * @return {Vector}
 */
const vectorLimit = (limitee, min, max) => {
	limitee.x = limit(limitee.x, min.x, max.x);
	limitee.y = limit(limitee.y, min.y, max.y);
	return limitee;
};

/**
 * @param {Rect} a
 * @param {Rect} b
 * @returns {boolean}
 */
const overlap = (a, b) => {
	const xOverlap = a.pos.x < b.pos.x + b.size.x && b.pos.x < a.pos.x + a.size.x;
	const yOverlap = a.pos.y < b.pos.y + b.size.y && b.pos.y < a.pos.y + a.size.y;
	return xOverlap && yOverlap;
}

const getMousePos = (canv, event) => {
	const rect = canv.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
};

const start = difficulty => {
	if (dead) {
		enemies = [];
		for (let i = 0; i < difficulty; i ++) {
			enemies[i] = new Enemy(i, difficulty);
		}

		player = new Player();
		goalRect = new Goal();
		goalRect.randomizePos();
		diff = difficulty - 1;
		dead = false;
		score = 0;
		onMenu = false;
		context.fillStyle = diffCols[diff];
		context.fillRect(0, 0, WIDTH, HEIGHT);
	}
};

const update = () => {
	// Calling players built-in move function and built-in boundary check function
	player.update();

	// Using enemies built-in move function to move them
	for (const enem of enemies) {
		enem.update(player, enemies);
		if (overlap(player, enem)) {
			dead = true;
			break;
		}
	}
	// Check if player and the goal Rect collide
	if (overlap(player, goalRect)) processGood();
};

const render = () => {
	// Background
	context.fillStyle = diffCols[diff] + "50";
	context.fillRect(0, 0, WIDTH, HEIGHT);
	// Player
	context.fillStyle = "black";
	context.fillRect(player.pos.x, player.pos.y, player.size.x, player.size.y);
	// Goal
	context.fillStyle = "purple";
	context.fillRect(goalRect.pos.x, goalRect.pos.y, goalRect.size.x, goalRect.size.y);
	// Enemies
	context.fillStyle = "blue";
	for (const enem of enemies) {
		context.fillRect(enem.pos.x, enem.pos.y, enem.size.x, enem.size.y);
	}
	// Score
	let x = 35 + Math.floor(logb(score, 10)) * 14;

	context.fillStyle = "black";
	context.fillText(score.toString(10), x, 50);
};

const processGood = () => {
	score ++;
	goalRect.randomizePos();
};

const gameOver = () => {
	context.fillStyle = "#FFFFFF";
	context.fillRect(0, HEIGHT / 2, WIDTH, HEIGHT / 2);

	for (let i = 0; i < buttons.length; i++) {
		context.fillStyle = diffCols[i];
		if (i === diff) {
			context.strokeRect(buttons[i].pos.x, buttons[i].pos.y, buttons[i].size.x, buttons[i].size.y);
		} else {
			context.fillRect(buttons[i].pos.x, buttons[i].pos.y, buttons[i].size.x, buttons[i].size.y);
		}
	}

	if (keys[32]) start((diff % 3) + 1);

	if (!onMenu) {
		context.fillStyle = "black";
		onMenu = true;
		dead = true;
		context.clearRect(0, 0, WIDTH, HEIGHT);
		context.fillText("High Score: " + bestScores[diff], WIDTH / 2, 100);
		context.fillText("Last Score: " + score, WIDTH / 2, 200);

		bestScores[diff] = score > bestScores[diff] ? score : bestScores[diff];
	}
};

export const run = () => {
	const baseDiv = document.querySelector("#appDiv");

	canv.addEventListener("click", e => {
		if (dead) {
			const mousePos = getMousePos(canv, e);

			for (const button of buttons) {
				if (button.wasClicked(mousePos)) {
					button.onClick();
				}
			}
		}
	}, false);

	baseDiv.appendChild(canv);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	updateLoop = setInterval(() => {
		if (!dead) {
			update();
			render();
		} else gameOver();
	}, 1000 / 30);
};

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}

	clearInterval(updateLoop);
}