import { Button, Vector2 as Vector, logb } from "https://lightningund.github.io/Methlib/methlib.js";

/**
 * @typedef {Object} Box
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

// Wrap the entire program in an anonymous function that is instantly executed
// This allows to us to have constants that don't bleed outside the scope of this app
(() => {
	class Cube {
		constructor(state, diff) {
			const enemPosInc = (WIDTH - 40) / 2;
			const SPD = 20;
			const ACC = 7;
			const FRICTION = 0.8;
			const BASE_REPEL_FORCE = 5000;

			/** @type {Vector} */
			this.pos = new Vector();

			/** @type {Vector} */
			this.vel = new Vector();

			/** @type {Vector} */
			this.acc = new Vector();

			/** @type {Vector} */
			this.size = new Vector(20, 20);

			this.wallLimit = new Vector(WIDTH, HEIGHT).sub(this.size);

			this.updatePos = () => {
				this.vel.add(this.acc);
				this.pos.add(this.vel);
			}

			//checks if state is equal to zero (meaning it is a player)
			if (state === 0) {
				this.pos = new Vector(WIDTH / 2, HEIGHT - 20);

				this.boundCheck = () => {
					vectorLimit(this.vel, {x:-SPD, y:-SPD}, {x:SPD, y:SPD});
					this.vel.scale(FRICTION);
					vectorLimit(this.pos, {x:0, y:0}, this.wallLimit);
				};

				this.update = () => {
					this.mover();
					this.updatePos();
					this.boundCheck();
				};

				this.mover = () => {
					this.acc.x = 0;
					this.acc.y = 0;
					if (keys["KeyW"] || keys["ArrowUp"]) this.acc.y = -ACC;
					if (keys["KeyS"] || keys["ArrowDown"]) this.acc.y = ACC;
					if (keys["KeyA"] || keys["ArrowLeft"]) this.acc.x = -ACC;
					if (keys["KeyD"] || keys["ArrowRight"]) this.acc.x = ACC;
				};
			}

			//state equaling 1 means goal cube
			if (state === 1) {
				this.size = new Vector(40, 40);

				//Randomize the position of the goal cube
				this.randomizePos = () => {
					this.pos = new Vector(
						Math.random() * (WIDTH - 40),
						Math.random() * (HEIGHT - 40)
					);
				};
			}

			//this checks if it is an enemy (2, 3, or 4)
			if (state === 2 || state === 3 || state === 4) {
				this.pos = new Vector(enemPosInc * (state - 2), 20);
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

				//move function for enemies
				this.mover = target => {
					let dx = Vector.sub(target.pos, this.pos);
					let divisor = 1;

					if (diff == 1) divisor = 100;
					else if (diff == 2) divisor = 50;
					else if (diff == 3) divisor = 25;

					divisor /= this.speedup;

					this.acc = dx.scale(1 / divisor);
				};

				this.repel = enems => {
					for(const enem of enems) {
						if(enem !== this) {
							const repulsion = Vector.sub(this.pos, enem.pos);
							const dist = repulsion.squareLength();
							repulsion.normalize();
							repulsion.scale(BASE_REPEL_FORCE / dist);
							this.vel.add(repulsion);
						}
					}
				};
			}
		}
	}

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
	};

	/**
	 * @param {Cube} a 
	 * @param {Cube} b 
	 * @returns {boolean}
	 */
	const overlap = (a, b) => {
		const xOverlap = a.pos.x < b.pos.x + b.size.x && b.pos.x < a.pos.x + a.size.x;
		const yOverlap = a.pos.y < b.pos.y + b.size.y && b.pos.y < a.pos.y + a.size.y;
		return xOverlap && yOverlap;
	}

	const baseDiv = document.querySelector("#appDiv");

	const WIDTH = 800;
	const HEIGHT = 800;

	const canv = document.createElement("canvas");
	canv.width = WIDTH;
	canv.height = HEIGHT;
	const context = canv.getContext("2d");
	context.textAlign = "center";
	context.font = "Bold 50px Consolas";

	baseDiv.appendChild(canv);

	const BS = 100; //Button Size

	//Background and button colors for the different difficulties
	const diffCols = ["#00FF00", "#FF8000", "#FF0000"];

	//The buttons to start the game at any given difficulty
	let buttons = [];

	for (let i = 0; i < 3; i++) {
		const x = (WIDTH * (i * 2 + 1)) / 6 - BS / 2;
		const y = (HEIGHT * 3) / 4 - BS / 2;
		buttons[i] = new Button(() => start(i + 1), x, y, BS, BS);
	}

	//Array for what keys are currently being pressed
	let keys = [];

	let player;
	let cubeGood;
	let enemies = [];

	let onMenu = false;
	let bestScores = [0, 0, 0];
	let score = 0;
	let dead = true;
	let diff = 0;

	window.addEventListener("keydown", e => {
		keys[e.code] = true;
		if (dead && e.code == "KeyE") {
			diff++;
			diff %= 3;
			console.log(diff);
		}
	}, false);
	
	window.addEventListener("keyup", e => delete keys[e.code], false);

	//Binding the click event on the canv
	canv.addEventListener("click", e => {
		if (dead) {
			let mousePos = getMousePos(canv, e);

			for (let button of buttons) {
				if (button.wasClicked(mousePos)) {
					button.onClick();
				}
			}
		}
	}, false);

	//Get the mouse position
	const getMousePos = (canv, event) => {
		var rect = canv.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,y: event.clientY - rect.top
		};
	};

	const start = difficulty => {
		if (dead) {
			enemies = [];
			for (let i = 0; i < difficulty; i++) {
				enemies[i] = new Cube(i + 2, difficulty);
			}

			player = new Cube(0);
			cubeGood = new Cube(1);
			cubeGood.randomizePos();
			diff = difficulty - 1;
			dead = false;
			score = 0;
			onMenu = false;
			context.fillStyle = diffCols[diff];
			context.fillRect(0, 0, WIDTH, HEIGHT);
		}
	};

	const update = () => {
		//calling players built-in move function and built-in boundary check function
		player.update();

		//using enemies built-in move function to move them
		for (const enem of enemies) {
			enem.update(player, enemies);
			if (overlap(player, enem)) {
				dead = true;
				break;
			}
		}
		//check if player and the goal cube collide
		if (overlap(player, cubeGood)) processGood();
	};

	const render = () => {
		//background
		context.fillStyle = diffCols[diff] + "50";
		context.fillRect(0, 0, WIDTH, HEIGHT);
		//player
		context.fillStyle = "black";
		context.fillRect(player.pos.x, player.pos.y, player.size.x, player.size.y);
		//goal cube
		context.fillStyle = "purple";
		context.fillRect(cubeGood.pos.x, cubeGood.pos.y, cubeGood.size.x, cubeGood.size.y);
		//enemies
		context.fillStyle = "blue";
		for (const enem of enemies) {
			context.fillRect(enem.pos.x,enem.pos.y,enem.size.x,enem.size.y);
		}
		//score
		let x = 35 + Math.floor(logb(score, 10)) * 14;

		context.fillStyle = "black";
		context.fillText(score.toString(10), x, 50);
	};

	const processGood = () => {
		score++;
		cubeGood.randomizePos();
	};

	const gameOver = () => {
		context.fillStyle = "#FFFFFF";
		context.fillRect(0, HEIGHT / 2, WIDTH, HEIGHT / 2);

		for (let i = 0; i < buttons.length; i++) {
			context.fillStyle = diffCols[i];
			if (i == diff) {
				context.strokeRect(buttons[i].pos.x,buttons[i].pos.y,buttons[i].size.x,buttons[i].size.y);
			} else {
				context.fillRect(buttons[i].pos.x,buttons[i].pos.y,buttons[i].size.x,buttons[i].size.y);
			}
		}
		if (keys[32]) {
			start((diff % 3) + 1);
		}

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

	setInterval(() => {
		if (!dead) {
			update();
			render();
		} else gameOver();
	}, 1000 / 30);
})();
