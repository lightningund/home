import { Button, Vector2 as Vector, logb } from "https://lightningund.github.io/Mathlib/mathlib.js";

const UP_KEYS = ["KeyW", "ArrowUp"];
const RIGHT_KEYS = ["KeyD", "ArrowRight"];
const DOWN_KEYS = ["KeyS", "ArrowDown"];
const LEFT_KEYS = ["KeyA", "ArrowLeft"];
const WIDTH = 500;
const HEIGHT = 500;

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

		this.update_pos = () => {
			this.vel.add(this.acc);
			this.pos.add(this.vel);
		}
	}
}

class Player extends Rect {
	constructor() {
		super();

		this.pos = new Vector(WIDTH / 2, HEIGHT - 20);

		this.wall_limit = new Vector(WIDTH, HEIGHT).sub(this.size);

		this.bound_check = () => {
			this.vel = vector_limit(this.vel, new Vector(-this.SPD), new Vector(this.SPD));
			this.vel.scale(this.FRICTION);
			this.pos = vector_limit(this.pos, {x : 0, y : 0}, this.wall_limit);
		};

		this.update = () => {
			this.mover();
			this.update_pos();
			this.bound_check();
		};

		this.mover = () => {
			this.acc.x = 0;
			this.acc.y = 0;
			if (check_keylist(UP_KEYS)) this.acc.y = -this.ACC;
			if (check_keylist(DOWN_KEYS)) this.acc.y = this.ACC;
			if (check_keylist(LEFT_KEYS)) this.acc.x = -this.ACC;
			if (check_keylist(RIGHT_KEYS)) this.acc.x = this.ACC;
		};
	}
}

class Enemy extends Rect {
	constructor(enem_num, diff) {
		super();

		this.enem_pos_inc = (WIDTH - 40) / 2;
		this.BASE_REPEL_FORCE = 5000;

		this.pos = new Vector(this.enem_pos_inc * enem_num, 20);
		this.speedup = 1;

		this.update = (target, enems) => {
			this.acc.x = 0;
			this.acc.y = 0;
			this.vel.scale(0.9);
			this.mover(target);
			this.repel(enems);
			this.update_pos();
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
		this.randomize_pos = () => {
			this.pos = new Vector(
				Math.random() * (WIDTH - 40),
				Math.random() * (HEIGHT - 40)
			);
		};
	}
}

// Array for what keys are currently being pressed
let keys = [];

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");
context.textAlign = "center";
context.font = "Bold 50px Consolas";

const BS = 100; // Button Size

// Background and button colors for the different difficulties
const diff_cols = ["#00FF00", "#FF8000", "#FF0000"];

/**
 * The buttons to start the game at any given difficulty
 * @type {Button[]}
 */
let buttons = [];

/** @type {Player} */
let player;

/** @type {Goal} */
let goal_rect;

/** @type {Enemy[]} */
let enemies = [];

let on_menu = false;
let best_scores = [0, 0, 0];
let score = 0;
let dead = true;
let diff = 0;

/** @type {number} */
let update_loop;

for (let i = 0; i < 3; i++) {
	const x = (WIDTH * (i * 2 + 1)) / 6 - BS / 2;
	const y = (HEIGHT * 3) / 4 - BS / 2;
	buttons[i] = new Button(() => start(i + 1), x, y, BS, BS);
}

const keydownfunc = e => {
	keys[e.code] = true;
	if (dead && e.code === "KeyE") {
		diff++;
		diff %= 3;
		console.log(diff);
	}
}

const keyupfunc = e => delete keys[e.code];

const bindings = {
	"keydown": keydownfunc,
	"keyup": keyupfunc
};

const check_keylist = keylist => {
	return keylist.some(key => keys[key]);
}

const limit = (limitee, min, max) => {
	if (limitee < min) return min;
	if (limitee > max) return max;
	return limitee;
}

/**
 * Returns a new vector limited by the given bounds
 * @param {Vector} limitee
 * @param {Vector} min
 * @param {Vector} max
 * @return {Vector}
 */
const vector_limit = (limitee, min, max) => {
	return new Vector(limit(limitee.x, min.x, max.x), limit(limitee.y, min.y, max.y));
};

/**
 * @param {Rect} a
 * @param {Rect} b
 * @returns {boolean}
 */
const overlap = (a, b) => {
	const x_overlap = a.pos.x < b.pos.x + b.size.x && b.pos.x < a.pos.x + a.size.x;
	const y_overlap = a.pos.y < b.pos.y + b.size.y && b.pos.y < a.pos.y + a.size.y;
	return x_overlap && y_overlap;
}

/**
 * @param {HTMLCanvasElement} canv
 * @param {MouseEvent} event
 */
const get_mouse_pos = (canv, event) => {
	const rect = canv.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
};

/**
 * @param {number} difficulty
 */
const start = difficulty => {
	if (dead) {
		enemies = [];
		for (let i = 0; i < difficulty; i++) {
			enemies[i] = new Enemy(i, difficulty);
		}

		player = new Player();
		goal_rect = new Goal();
		goal_rect.randomize_pos();
		diff = difficulty - 1;
		dead = false;
		score = 0;
		on_menu = false;
		context.fillStyle = diff_cols[diff];
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
	if (overlap(player, goal_rect)) process_good();
};

const render = () => {
	// Background
	context.fillStyle = diff_cols[diff] + "50";
	context.fillRect(0, 0, WIDTH, HEIGHT);
	// Player
	context.fillStyle = "black";
	context.fillRect(player.pos.x, player.pos.y, player.size.x, player.size.y);
	// Goal
	context.fillStyle = "purple";
	context.fillRect(goal_rect.pos.x, goal_rect.pos.y, goal_rect.size.x, goal_rect.size.y);
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

const process_good = () => {
	score++;
	goal_rect.randomize_pos();
};

const gameOver = () => {
	context.fillStyle = "#FFFFFF";
	context.fillRect(0, HEIGHT / 2, WIDTH, HEIGHT / 2);

	for (let i = 0; i < buttons.length; i++) {
		context.fillStyle = diff_cols[i];
		if (i === diff) {
			context.strokeRect(buttons[i].pos.x, buttons[i].pos.y, buttons[i].size.x, buttons[i].size.y);
		} else {
			context.fillRect(buttons[i].pos.x, buttons[i].pos.y, buttons[i].size.x, buttons[i].size.y);
		}
	}

	if (keys[32]) start((diff % 3) + 1);

	if (!on_menu) {
		context.fillStyle = "black";
		on_menu = true;
		dead = true;
		context.clearRect(0, 0, WIDTH, HEIGHT);
		context.fillText("High Score: " + best_scores[diff], WIDTH / 2, 100);
		context.fillText("Last Score: " + score, WIDTH / 2, 200);

		best_scores[diff] = score > best_scores[diff] ? score : best_scores[diff];
	}
};

export const run = () => {
	const base_div = document.querySelector("#appDiv");

	canv.addEventListener("click", e => {
		if (dead) {
			const mousePos = get_mouse_pos(canv, e);

			for (const button of buttons) {
				if (button.wasClicked(mousePos)) {
					button.onClick();
				}
			}
		}
	}, false);

	base_div.appendChild(canv);

	for (const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	update_loop = setInterval(() => {
		if (!dead) {
			update();
			render();
		} else gameOver();
	}, 1000 / 30);
};

export const stop = () => {
	for (const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}

	clearInterval(update_loop);
}
