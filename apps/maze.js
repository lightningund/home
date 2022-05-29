const bindings = {};

class Cell {
	constructor(i, j) {
		/** @type {number} */
		this.x = i;

		/** @type {number} */
		this.y = j;

		/** @type {number} */
		this.visited = -1;

		/** @type {boolean[]} */
		this.walls = [true, true, true, true];

		this.checkNext = () => {
			let neighbors = [];

			if (this.x > 0) neighbors.push(cells[this.x - 1][this.y]);
			if (this.y > 0) neighbors.push(cells[this.x][this.y - 1]);
			if (this.x < (WIDTH / cellSize) - 1) neighbors.push(cells[this.x + 1][this.y]);
			if (this.y < (HEIGHT / cellSize) - 1) neighbors.push(cells[this.x][this.y + 1]);

			neighbors = neighbors.filter(elem => (elem.visited === -1));

			if(neighbors.length === 0) return false;

			const r = Math.floor(Math.random() * neighbors.length);
			const chosenCell = neighbors[r];

			this.removeWalls(chosenCell);

			cellStack.push(this);

			return chosenCell;
		};

		this.removeWalls = movingTo => {
			const dx = this.x - movingTo.x;
			const dy = this.y - movingTo.y;

			let wallToRemove;

			if (dx === 1) wallToRemove = 1;
			else if (dx === -1) wallToRemove = 3;
			else if (dy === 1) wallToRemove = 0;
			else if (dy === -1) wallToRemove = 2;

			this.walls[wallToRemove] = false;
			movingTo.walls[(wallToRemove + 2) % 4] = false;
		};
	}
}

const WIDTH = 800;
const HEIGHT = 800;

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");

const cellSize = 5;

let running = false;

/** @type {Cell[][]} */
let cells = [];

/** @type {Cell} */
let currentCell;

/** @type {Cell[]} */
let cellStack = [];

let updateLoop;

const generate = () => {
	if(!running) {
		context.fillStyle = "black";
		context.fillRect(0, 0, WIDTH, HEIGHT);

		for(let i = 0; i < (WIDTH / cellSize); i++){
			cells[i] = [];
			for(let j = 0; j < (HEIGHT / cellSize); j++){
				cells[i][j] = new Cell(i, j);
			}
		}

		currentCell = cells[0][0];
		cellStack.push(currentCell);
		running = true;
	}
}

const update = () => {
	if(cellStack.length === 0) {
		running = false;
		return;
	}

	currentCell.visited = cellStack.length;

	const next = currentCell.checkNext();

	renderCell(currentCell);
	currentCell = next ? next : cellStack.pop();
	context.fillStyle = "white";

	const x = currentCell.x + 0.2;
	const y = currentCell.y + 0.2;

	context.fillRect(cellSize * x, cellSize * y, cellSize * 0.6, cellSize * 0.6);
}

/**
 * @param {Cell} cell
 */
const renderCell = cell => {
	const x = cell.x;
	const y = cell.y;

	if(cell.visited !== -1) context.fillStyle = `hsl(${(cell.visited / 5) % 360}, 100%, 50%)`;
	else {
		context.fillStyle = "black";
		context.fillRect(cellSize * x, cellSize * y, cellSize, cellSize);
	}

	// context.strokeStyle = "white";
	// context.lineWIDTH = 2;
	// context.beginPath();
	// if(cell.walls[0]){
	// 	context.moveTo(cellSize * x, cellSize * y);
	// 	context.lineTo(cellSize * (x + 1), cellSize * y);
	// }
	// if(cell.walls[1]){
	// 	context.moveTo(cellSize * x, cellSize * y);
	// 	context.lineTo(cellSize * x, cellSize * (y + 1));
	// }
	// if(cell.walls[2]){
	// 	context.moveTo(cellSize * x, cellSize * (y + 1));
	// 	context.lineTo(cellSize * (x + 1), cellSize * (y + 1));
	// }
	// if(cell.walls[3]){
	// 	context.moveTo(cellSize * (x + 1), cellSize * y);
	// 	context.lineTo(cellSize * (x + 1), cellSize * (y + 1));
	// }
	// context.stroke();

	if(!cell.walls[2]) { // Down
		drawPathLine({x, y}, {x, y: y + 1});
	}
	if(!cell.walls[3]) { // Right
		drawPathLine({x, y}, {x: x + 1, y});
	}
}

/**
 * @param {{x:number, y:number}} a
 * @param {{x:number, y:number}} b
 */
const drawPathLine = (a, b) => {
	const xs = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
	const ys = a.y < b.y ? [a.y, b.y] : [b.y, a.y];

	const xa = xs[0] + 0.2;
	const xb = xs[1] + 0.8;
	const ya = ys[0] + 0.2;
	const yb = ys[1] + 0.8;
	context.fillRect(xa * cellSize, ya * cellSize, (xb - xa) * cellSize, (yb - ya) * cellSize);
}

export const run = (() => {
	const baseDiv = document.querySelector("#appDiv");
	baseDiv.appendChild(canv);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	generate();

	updateLoop = setInterval(() => {
		if(running) {
			update();
		} else {
			// generate();
		}
	}, 1000 / 60);
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}

	clearInterval(updateLoop);
};
