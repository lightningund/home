// Wrap the entire program in an anonymous function that is instantly executed
// This allows to us to have constants that don't bleed outside the scope of this app
(() => {
	class Cell {
		constructor(i, j) {
			this.x = i;
			this.y = j;
			this.visited = false;
			this.walls = [true, true, true, true];
	
			this.checkNext = () => {
				let neighbors = [];
	
				if (this.x > 0) neighbors.push(cells[this.x - 1][this.y]);
				if (this.y > 0) neighbors.push(cells[this.x][this.y - 1]);
				if (this.x < (WIDTH / cellSize) - 1) neighbors.push(cells[this.x + 1][this.y]);
				if (this.y < (HEIGHT / cellSize) - 1) neighbors.push(cells[this.x][this.y + 1]);
	
				neighbors = neighbors.filter(elem => !elem.visited);
	
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
	
				if (dx == 1) wallToRemove = 1;
				else if (dx == -1) wallToRemove = 3;
				else if (dy == 1) wallToRemove = 0;
				else if (dy == -1) wallToRemove = 2;
	
				this.walls[wallToRemove] = false;
				movingTo.walls[(wallToRemove + 2) % 4] = false;
			};
		}
	}

	const baseDiv = document.querySelector("#appDiv");

	const WIDTH = 800;
	const HEIGHT = 800;

	const canv = document.createElement("canvas");
	canv.width = WIDTH;
	canv.height = HEIGHT;
	const context = canv.getContext("2d");

	baseDiv.appendChild(canv);

	const cellSize = 10;

	let running = false;

	/** @type {Cell[][]} */
	let cells = [];

	/** @type {Cell} */
	let currentCell;

	/** @type {Cell[]} */
	let cellStack = [];

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

		currentCell.visited = true;
		const next = currentCell.checkNext();

		renderCell(currentCell);
		currentCell = next ? next : cellStack.pop();
		context.fillStyle = "blue";
		context.fillRect(cellSize * currentCell.x, cellSize * currentCell.y, cellSize, cellSize);
	}

	const renderCell = cell => {
		const x = cell.x;
		const y = cell.y;

		if(cell.visited) context.fillStyle = "purple";
		else context.fillStyle = "black";
		context.fillRect(cellSize * x, cellSize * y, cellSize, cellSize);

		context.strokeStyle = "white";
		context.lineWIDTH = 2;
		context.beginPath();
		if(cell.walls[0]){
			context.moveTo(cellSize * x, cellSize * y);
			context.lineTo(cellSize * (x + 1), cellSize * y);
		}
		if(cell.walls[1]){
			context.moveTo(cellSize * x, cellSize * y);
			context.lineTo(cellSize * x, cellSize * (y + 1));
		}
		if(cell.walls[2]){
			context.moveTo(cellSize * x, cellSize * (y + 1));
			context.lineTo(cellSize * (x + 1), cellSize * (y + 1));
		}
		if(cell.walls[3]){
			context.moveTo(cellSize * (x + 1), cellSize * y);
			context.lineTo(cellSize * (x + 1), cellSize * (y + 1));
		}
		context.stroke();
	}

	setInterval(() => {
		if(running) {
			update();
		} else {
			generate();
		}
	}, 1000 / 60);

})();