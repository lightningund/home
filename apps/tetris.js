import { PIECES, Cell, Color } from "./tetrisPieces.js";
import { logb } from "https://lightningund.github.io/Methlib/methlib.js";

const WIDTH = 800;
const HEIGHT = 800;

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");

const fallToggleBtn = document.createElement("button");
fallToggleBtn.innerHTML = "Toggle Piece Falling";
fallToggleBtn.onclick = (() => {falling = !falling;});

const NUM_CELLS_X = 10;
const NUM_CELLS_Y = 20;
const PIECE_SIZE = 25;
const FLASH_FRAMES = 20;

const CELL_SIZE = HEIGHT / NUM_CELLS_Y;
const BOARD_WIDTH = NUM_CELLS_X * CELL_SIZE;
const XOFF = ((WIDTH - BOARD_WIDTH) / 2);
const NEXT_XOFF = WIDTH - (PIECE_SIZE * 4);

const TIME_TO_FALL = 30;

const edgePoints = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

let falling = false;
let fallingTimer = 0;

let cells = [];
let prevCells;

let pieceType, pieceRot;
const fullPiece = () => PIECES[pieceType];
const piece = () => fullPiece().rotations[pieceRot];
const pieceCol = () => fullPiece().color;

let heldType;
const heldFullPiece = () => PIECES[heldType];

let queueInd = 0;
let nextTypes = [];
const nextFullPiece = () => PIECES[nextTypes[queueInd]];

let lastType;

let pieceX, pieceY;

let score = 0, linesCleared = 0;

let updateLoop;

const keydownfunc = e => {
	switch (e.code) {
		case "Space": // Space : Quick Drop
			pieceY = pseudoDrop();
			pieceDropped();
			break;
		case "KeyA":
		case "ArrowLeft": // A || Left : Move Left
			if (checkPiecePosition({ PX: pieceX - 1 })) {
				clearPiece();
				pieceX --;
				drawPiece();
			}
			break;
		case "KeyD":
		case "ArrowRight": // D || Right : Move Right
			if (checkPiecePosition({ PX: pieceX + 1 })) {
				clearPiece();
				pieceX ++;
				drawPiece();
			}
			break;
		case "KeyW":
		case "ArrowUp": // W || Up : Rotate
			if (checkPiecePosition({ PR: (pieceRot + 1) % 4 })) {
				clearPiece();
				rotatePiece();
				drawPiece();
			}
			break;
		case "KeyS":
		case "ArrowDown": // S || Down : Drop down one
			clearPiece();
			if (checkPiecePosition({ PY: pieceY + 1 })) {
				pieceY ++;
			} else pieceDropped();
			drawPiece();
			break;
		case "KeyH": // H : Swap for Held
			clearPiece();
			pieceX = NUM_CELLS_X / 2;
			pieceY = 0;
			if (heldType === -1) {
				heldType = pieceType;
				newPiece();
			}
			else {
				let tempType = heldType;
				heldType = pieceType;
				pieceType = tempType;
			}
			drawPiece();
			break;
		case "KeyZ": // Z : Undo
			if(prevCells !== undefined){
				for(const i in prevCells){
					cells[i] = prevCells[i];
				}
				queueInd --;
				nextTypes[queueInd] = pieceType;
				pieceType = lastType;
				prevCells = undefined;
			}
			break;
		case "Digit1":
		case "Digit2":
		case "Digit3":
		case "Digit4":
		case "Digit5":
		case "Digit6":
		case "Digit7":
			pieceType = parseInt(e.code.slice(5, 6)) - 1;
	}
};

const bindings = {
	"keydown": keydownfunc
};

const init = () => {
	canv.width = WIDTH;
	canv.height = HEIGHT;

	score = 0;

	heldType = -1;
	nextTypes = shuffle([0, 1, 2, 3, 4, 5, 6]);

	pieceRot = 0;
	pieceX = 0;
	pieceY = 0;

	for (const i in cells) {
		for (const j in cells[i]) {
			cells[i][j] = new Cell();
		}
	}

	newPiece();
}

const update = () => {
	//For Clearing Lines
	let lines = 0;
	for (const i in cells) {
		let filled = true;

		for (const cell of cells[i]) if (!cell.on) filled = false;
		if (filled) {
			if (cells[i][0].flashTimer === -1) {
				lines++;
				for (const j in cells[i]) cells[i][j].flashTimer = FLASH_FRAMES;
			} else {
				if (cells[i][0].flashTimer === 0) {
					clearRow(parseInt(i));
				} else {
					for (const j in cells[i]) {
						cells[i][j].flashTimer--;
						cells[i][j].color = Math.floor(cells[i][j].flashTimer / 5) % 2 === 0 ? Color.BLACK : Color.WHITE;
					}
				}
			}
		}
	}

	score += lines * lines;
	linesCleared += lines;

	if(falling) {
		fallingTimer ++;
		if(fallingTimer >= TIME_TO_FALL) {
			clearPiece();
			if (checkPiecePosition({ PY: pieceY + 1 })) {
				pieceY++;
			} else pieceDropped();

			drawPiece();
			fallingTimer = 0;
		}
	}
}

const checkPieceHit = (yoff = pieceY) => {
	for (const part of piece().parts) {
		const partY = yoff + part.y + 1;

		if (partY >= NUM_CELLS_Y) return true;

		if (cells[partY][pieceX + part.x].on) return true;
	}
	return false;
}

const pieceDropped = () => {
	prevCells = [];

	for(const i in cells) {
		prevCells[i] = [];
		for(const j in cells[i]){
			prevCells[i][j] = new Cell();
			prevCells[i][j].on = cells[i][j].on;
			prevCells[i][j].color = cells[i][j].color;
			prevCells[i][j].edges = cells[i][j].edges;
		}
	}

	lastType = pieceType;

	for (const part of piece().parts) {
		cells[pieceY + part.y][pieceX + part.x].on = true;
		cells[pieceY + part.y][pieceX + part.x].color = pieceCol();
		cells[pieceY + part.y][pieceX + part.x].edges = part.edges;
	}

	newPiece();
}

const clearRow = (row = 1) => {
	for (let i = 0; i < NUM_CELLS_X; i++) {
		cells[row][i].on = false;
		cells[row][i].flashTimer = -1;
		cells[row][i].color = Color.BLACK;
	}

	for (let i = row; i > 0; i--) {
		for (let j = 0; j < NUM_CELLS_X; j++) {
			cells[i][j].on = cells[i - 1][j].on;
			cells[i][j].color = cells[i - 1][j].color;
			cells[i][j].edges = cells[i - 1][j].edges.map(edge => edge);
		}
	}
}

const newPiece = () => {
	pieceType = nextTypes[queueInd];
	pieceX = NUM_CELLS_X / 2;
	pieceY = 0;
	queueInd ++;

	if(queueInd >= nextTypes.length) {
		queueInd = 0;
		nextTypes = [0, 1, 2, 3, 4, 5, 6];
		nextTypes = shuffle(nextTypes);
	}
	
	if(!checkPiecePosition()) init();
	
	drawPiece();
}

const shuffle = arr => {
	let indices = [];
	for(let i = 0; i < arr.length; i ++) indices[i] = i;

	let newArr = [];

	for(let i = 0; i < arr.length; i ++) {
		const r = Math.floor(Math.random() % (arr.length - i));
		newArr[i] = arr[indices.splice(r, 1)];
	}

	return newArr;
}

const rotatePiece = () => {
	pieceRot ++;
	pieceRot %= 4;
}

const checkPiecePosition = (pieceParams = {}) => {
	const PX = pieceParams.PX === undefined ? pieceX : pieceParams.PX;
	const PY = pieceParams.PY === undefined ? pieceY : pieceParams.PY;
	const PR = pieceParams.PR === undefined ? pieceRot : pieceParams.PR;
	for (const part of fullPiece().rotations[PR].parts) {
		if (
			PX + part.x >= NUM_CELLS_X ||
			PX + part.x < 0 ||
			PY + part.y >= NUM_CELLS_Y ||
			PY + part.y < 0 ||
			cells[PY + part.y][PX + part.x].on
		) return false;
	}
	return true;
}

const render = () => {
	//background
	context.fillStyle = Color.GREY.getRGBAHex();
	context.fillRect(0, 0, WIDTH, HEIGHT);

	context.fillStyle = Color.BLACK.getRGBAHex();
	context.fillRect(XOFF, 0, NUM_CELLS_X * CELL_SIZE, HEIGHT);

	for (let row = 0; row < NUM_CELLS_Y; row ++) {
		for (let col = 0; col < NUM_CELLS_X; col ++) {
			let cell = cells[row][col];

			context.fillStyle = cell.color.getRGBAHex();
			context.fillRect(col * CELL_SIZE + XOFF, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

			let outlineCol = new Color(cell.color);
			let total = outlineCol.r + outlineCol.g + outlineCol.b;
			outlineCol = new Color(total / 3, outlineCol.a);
			outlineCol.r = 255 - outlineCol.r;
			outlineCol.g = 255 - outlineCol.g;
			outlineCol.b = 255 - outlineCol.b;

			context.strokeStyle = outlineCol.getRGBAHex();

			context.beginPath();

			for (const ind in cell.edges) {
				if (cell.edges[ind]) {
					const i = parseInt(ind);
					context.moveTo(
						XOFF + ((col + edgePoints[i][0]) * CELL_SIZE),
						((row + edgePoints[i][1]) * CELL_SIZE),
					);
					context.lineTo(
						XOFF + ((col + edgePoints[i + 1][0]) * CELL_SIZE),
						((row + edgePoints[i + 1][1]) * CELL_SIZE),
					);
				}
			}

			context.stroke();
		}
	}

	context.textAlign = "center";
	context.font = "Bold 50px Consolas";
	context.fillStyle = "BLACK";

	//score
	let x = 35 + (Math.floor(logb(score, 10)) * 14);
	context.fillText(score.toString(10), x, HEIGHT / 3);

	//linesCleared
	x = 35 + (Math.floor(logb(linesCleared, 10)) * 14);
	context.fillText(linesCleared.toString(10), x, HEIGHT * 2 / 3);

	drawPiece();
	pseudoDrop();
	drawHeld();
	drawNext();
}

const pseudoDrop = () => {
	let offset = pieceY;

	while (true) {
		if (!checkPieceHit(offset)) {
			offset ++;
		}
		else {
			break;
		}
	}

	let col = new Color(pieceCol());
	col.a = 100;
	drawPiece(piece(), col, pieceX, offset);

	return offset;
}

const drawPiece = (pieceToDraw = piece(), col = pieceCol(), PX = pieceX, PY = pieceY) => {
	context.fillStyle = col.getRGBAHex();
	context.strokeStyle = Color.WHITE.getRGBAHex();
	context.beginPath();

	for (const part of pieceToDraw.parts) {
		context.fillRect(
			XOFF + ((PX + part.x) * CELL_SIZE),
			((PY + part.y) * CELL_SIZE),
			CELL_SIZE, CELL_SIZE
		);
		for (const ind in part.edges) {
			if (part.edges[ind]) {
				const i = parseInt(ind);
				context.moveTo(
					XOFF + ((PX + part.x + edgePoints[i][0]) * CELL_SIZE),
					((PY + part.y + edgePoints[i][1]) * CELL_SIZE),
				);
				context.lineTo(
					XOFF + ((PX + part.x + edgePoints[i + 1][0]) * CELL_SIZE),
					((PY + part.y + edgePoints[i + 1][1]) * CELL_SIZE),
				);
			}
		}
	}
	context.stroke();
}

const clearPiece = (PX = pieceX, PY = pieceY) => {
	context.fillStyle = Color.BLACK.getRGBAHex();
	for (const part of piece().parts) {
		context.fillRect(
			XOFF + ((PX + part.x) * CELL_SIZE),
			((PY + part.y) * CELL_SIZE),
			CELL_SIZE, CELL_SIZE
		);
	}
}

const drawNext = () => { drawUIPiece(false); }
const drawHeld = () => { drawUIPiece(true); }

const drawUIPiece = (isHeld) => {
	const xoff = isHeld ? PIECE_SIZE : NEXT_XOFF;

	context.fillStyle = Color.BLACK.getRGBAHex();
	context.fillRect(xoff, PIECE_SIZE, PIECE_SIZE * 4, PIECE_SIZE * 4);
	if (!((isHeld && heldType === -1) || (!isHeld && nextTypes[queueInd] === -1))) {
		const selPiece = isHeld ? heldFullPiece() : nextFullPiece();
		context.fillStyle = selPiece.color.getRGBAHex();

		for (const part of selPiece.rotations[0].parts) {
			context.fillRect(
				xoff + (part.x * PIECE_SIZE),
				PIECE_SIZE + (part.y * PIECE_SIZE),
				PIECE_SIZE, PIECE_SIZE
			);
		}
	}
}

for (let i = 0; i < NUM_CELLS_Y; i ++) {
	cells[i] = [];
	for (let j = 0; j < NUM_CELLS_X; j ++) {
		cells[i][j] = new Cell();
	}
}

export const run = (() => {
	const baseDiv = document.getElementById("appDiv");
	baseDiv.appendChild(canv);
	baseDiv.appendChild(fallToggleBtn);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	init();

	updateLoop = setInterval(() => {
		update();
		render();
	}, 1000 / 60);
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}

	clearInterval(updateLoop);
};