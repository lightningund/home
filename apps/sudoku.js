class Cell {
	constructor(value = undefined) {
		/** @type {Number} */
		this.value = value
		/** @type {Number[]} */
		this.marks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	}
}

class Rule {
	/**
	 * @callback MarkFunc
	 * @param {Cell[][]} cells
	 * @param {number[]} coords
	 * @param {number[]} marks
	 * @returns {number[]}
	 */

	/**
	 * @param {MarkFunc} checkFunc 
	 */
	constructor(checkFunc){
		this.checkFunc = checkFunc;
	}
}

class Board {
	/**
	 * @constructor
	 * @param {Number[][]} cells
	 */
	constructor(cells = undefined){
		/** @type {Cell[][]} */
		this.cells = [];

		/** @type {number[][]} */
		this.cellsToUpdate = [];

		/** @type {number[][][]} */
		this.undoStates = [];

		/** @type {Rule[]} */
		this.rules = [];

		this.updating = false;

		for(let i = 0; i < 9; i++){
			this.cells[i] = [];

			for(let j = 0; j < 9; j++){
				this.cells[i][j] = new Cell();
			}
		}

		this.update = () => {
			this.updating = true;

			while(this.cellsToUpdate.length !== 0) {
				const cell = this.cellsToUpdate.shift();
				console.log(cell);
				this.updateCell(cell[0], cell[1]);
			}
			
			this.cellsToUpdate = [];

			this.render();

			this.updating = false;
		}

		this.updateCell = (rowInd, colInd) => {
			const cell = this.cells[rowInd][colInd];

			if(!cell.value) {
				let vals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
				// for(const rule of this.rules) {
				// 	vals = rule.checkFunc(this.cells, vals);
				// }

				const row = this.cells[rowInd];
				const col = this.getCol(colInd);
				const region = this.getRegion(rowInd, colInd);

				let effectingCells = [...row, ...col, ...region];

				// Filter out the empty ones
				effectingCells = effectingCells.filter(checkCell => checkCell.value);

				// We only want the values, we don't care about the cell objects themselves
				effectingCells = effectingCells.map(elem => elem.value);

				for (const checkVal of effectingCells) {
					const ind = vals.indexOf(checkVal);
					if (ind !== -1) vals.splice(ind, 1);
				}
				
				cell.marks = vals;
			}

			for(const val of cell.marks) {
				const rowCells = this.cells[rowInd].filter(e => hasMark(e, val));
				const colCells = this.getCol(colInd).filter(e => hasMark(e, val));
				const regionCells = this.getRegion(rowInd, colInd).filter(e => hasMark(e, val));

				if(rowCells.length === 1 || colCells.length === 1 || regionCells.length === 1) cell.marks = [val];
			}

			// if (cell.marks.length === 1) this.changeCell(cell.marks[0], rowInd, colInd);
		}

		this.render = () => {
			ctxt.textAlign = "center";
			ctxt.textBaseline = "middle"

			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					const cell = this.cells[i][j];
					const x = i * cellSize;
					const y = j * cellSize;

					const selected = selectedCell !== undefined && selectedCell[0] === i && selectedCell[1] === j;
					ctxt.fillStyle = selected ? "#DD0" : "#FFF";
					ctxt.fillRect(x, y, cellSize, cellSize);

					if (cell.value) {
						ctxt.font = `${cellSize * 4 / 5}px "Ubuntu Mono"`;
						ctxt.fillStyle = "#000";
						ctxt.fillText(cell.value.toString(), (i + 0.5) * cellSize, (j + 0.5) * cellSize);
					} else if (cell.marks.length !== 0) {
						for (let k in cell.marks) {
							const subX = x + (k % 3 + 0.5) * cellSize / 3;
							const subY = y + (Math.floor(k / 3) + 0.5) * cellSize / 3;
							ctxt.font = `${cellSize / 5}px "Ubuntu Mono"`;
							ctxt.fillStyle = "#666";
							ctxt.fillText(cell.marks[k].toString(), subX, subY);
						}
					}
				}
			}

			this.drawGridLines();
		}

		this.drawGridLines = () => {
			// Minor gridlines every cell
			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					ctxt.strokeStyle = "#000";
					ctxt.lineWidth = 1;
					ctxt.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
				}
			}

			// Major gridlines every third cell
			for(let i = 0; i < 3; i++) {
				for(let j = 0; j < 3; j++) {
					ctxt.strokeStyle = "#000";
					ctxt.lineWidth = 3;
					ctxt.strokeRect(i * 3 * cellSize, j * 3 * cellSize, 3 * cellSize, 3 * cellSize);
				}
			}
		}

		this.undo = () => {
			const prevState = this.undoStates.pop();
			this.cells = prevState.map(row => row.map(cell => new Cell(cell)));
			allCellIndices.forEach(coord => addCell(this.cellsToUpdate, coord));
			this.update();
		}

		this.getCol = colInd => {
			const col = [];

			for(const row of this.cells) {
				col.push(row[colInd]);
			}

			return col;
		}

		this.getRegion = (rowInd, colInd) => {
			const regionRowInd = Math.floor(rowInd / 3) * 3;
			const regionColInd = Math.floor(colInd / 3) * 3;
			const region = [];

			for(let i = regionRowInd; i < regionRowInd + 3; i++) {
				for (let j = regionColInd; j < regionColInd + 3; j++) {
					region.push(this.cells[i][j]);
				}
			}

			return region;
		}

		this.changeCell = (val, rowInd, colInd) => {
			console.log(val, rowInd, colInd, this.cells[rowInd][colInd]);

			this.cells[rowInd][colInd].marks = [];
			this.cells[rowInd][colInd].value = val;

			allCellIndices.forEach(coord => {
				const cell = this.cells[coord[0]][coord[1]];
				if(!cell.value) {
					cell.marks = [1,2,3,4,5,6,7,8,9];
					addCell(this.cellsToUpdate, coord);
				}
			});

			if(!this.updating) this.update();
		}
	}
}

const hasMark = (cell, val) => cell.marks.includes(val);

const allCellIndices = [];
for(let i = 0; i < 9; i++) {
	for(let j = 0; j < 9; j++) {
		allCellIndices.push([i, j]);
	}
}

const addCell = (arr, addingCell) => {
	for (const cell of arr) {
		if (addingCell[0] === cell[0] && addingCell[1] === cell[1]) {
			return;
		}
	}

	arr.push(addingCell);
}

/** @type {MarkFunc} */
const rowRule = (cells, coords, marks) => {
	const cellsToCheck = cells[coords[0]];
	for(const i in cellsToCheck) {
		if(i === coords[1]) continue;
		if(!cellsToCheck[i].value) continue;
		const ind = marks.indexOf();
	}
}

const width = 800;
const height = 800;
const cellSize = width / 9;

const canv = document.createElement("canvas");
canv.width = width;
canv.height = height;
const ctxt = canv.getContext("2d");

let selectedCell = undefined;

const board = new Board();
board.update();

const bindings = {
    "keypress": event => {
        if (event.code === "KeyZ") {
            board.undo();
        }

        if (selectedCell !== undefined) {
            const num = parseInt(event.key);

            if(!isNaN(num)) {
                board.undoStates.push(board.cells.map(row => row.map(cell => cell.value)));
                board.changeCell(num, selectedCell[0], selectedCell[1]);
            }
        }
    }
};

export const run = (async () => {
	const baseDiv = document.getElementById("appDiv");

    canv.addEventListener("click", event => {
        const rect = canv.getBoundingClientRect();
        const x =  event.clientX - rect.left;
        const y = event.clientY - rect.top;

        selectedCell = [Math.floor(x / cellSize), Math.floor(y / cellSize)];
        board.render();

        return false;
    });

	baseDiv.appendChild(canv);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}
};