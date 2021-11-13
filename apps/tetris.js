import { PIECES, Cell, Color } from "./tetrisPieces.js";
import { logb } from "https://lightningund.github.io/Methlib/methlib.js";

// Wrap the entire program in an anonymous function that is instantly executed
// This allows to us to have constants that don't bleed outside the scope of this app
export const run = (() => {
	const baseDiv = document.querySelector("#appDiv");

	const WIDTH = 800;
	const HEIGHT = 800;

	const canv = document.createElement("canvas");
	canv.width = WIDTH;
	canv.height = HEIGHT;
	const context = canv.getContext("2d");

	baseDiv.appendChild(canv);

	const fallToggleBtn = document.createElement("button");
	fallToggleBtn.innerHTML = "Toggle Piece Falling";
	fallToggleBtn.onclick = (() => {falling = !falling;});

	baseDiv.appendChild(fallToggleBtn);

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

	for (let i = 0; i < NUM_CELLS_Y; i++) {
		cells[i] = [];
		for (let j = 0; j < NUM_CELLS_X; j++) {
			cells[i][j] = new Cell();
		}
	}

	let pieceType, pieceRot;
	const fullPiece = () => PIECES[pieceType];
	const piece = () => fullPiece().rotations[pieceRot];
	const pieceCol = () => fullPiece().color;

	let heldType;
	const heldFullPiece = () => PIECES[heldType];

	let nextType;
	const nextFullPiece = () => PIECES[nextType];

	let lastType;

	let pieceX, pieceY;

	let score = 0, linesCleared = 0;

	const init = () => {
		canv.width = WIDTH;
		canv.height = HEIGHT;

		score = 0;

		heldType = -1;
		nextType = Math.floor(Math.random() * 7);

		pieceRot = 0;
		pieceX = 0;
		pieceY = 0;

		for (let i in cells) {
			for (let j in cells[i]) {
				cells[i][j] = new Cell();
			}
		}

		newPiece();
	}

	const update = () => {
		//For Clearing Lines
		let lines = 0;
		for (let i in cells) {
			let filled = true;

			for (let cell of cells[i]) if (!cell.on) filled = false;
			if (filled) {
				if (cells[i][0].flashTimer == -1) {
					lines++;
					for (let j in cells[i]) cells[i][j].flashTimer = FLASH_FRAMES;
				} else {
					if (cells[i][0].flashTimer == 0) {
						clearRow(parseInt(i));
					} else {
						for (let j in cells[i]) {
							cells[i][j].flashTimer--;
							cells[i][j].color = Math.floor(cells[i][j].flashTimer / 5) % 2 == 0 ? Color.BLACK : Color.WHITE;
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
				} else {
					pieceDropped();
				}
				drawPiece();
				fallingTimer = 0;
			}
		}
	}

	const checkPieceHit = (yoff = pieceY) => {
		for (let part of piece().parts) {
			let partY = yoff + part.y + 1;
			if (partY >= NUM_CELLS_Y) return true;
			if (cells[partY][pieceX + part.x].on) {
				return true;
			}
		}
		return false;
	}

	const pieceDropped = () => {
		prevCells = [];
		for(let i in cells){
			prevCells[i] = [];
			for(let j in cells[i]){
				prevCells[i][j] = new Cell();
				prevCells[i][j].on = cells[i][j].on;
				prevCells[i][j].color = cells[i][j].color;
				prevCells[i][j].edges = cells[i][j].edges;
			}
		}
		lastType = pieceType;
		for (let part of piece().parts) {
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
		pieceType = nextType;
		pieceX = NUM_CELLS_X / 2;
		pieceY = 0;
		nextType = Math.floor(Math.random() * 7);
		if(!checkPiecePosition({})) {
			init();
		}
		drawPiece();
	}

	const rotatePiece = () => {
		pieceRot++;
		pieceRot %= 4;
	}

	const checkPiecePosition = (PieceParams) => {
		let PX = PieceParams.PX == undefined ? pieceX : PieceParams.PX;
		let PY = PieceParams.PY == undefined ? pieceY : PieceParams.PY;
		let PR = PieceParams.PR == undefined ? pieceRot : PieceParams.PR;
		for (let part of fullPiece().rotations[PR].parts) {
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

		for (let row = 0; row < NUM_CELLS_Y; row++) {
			for (let col = 0; col < NUM_CELLS_X; col++) {
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

				for (let ind in cell.edges) {
					if (cell.edges[ind]) {
						let i = parseInt(ind);
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
				offset++;
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
		for (let part of pieceToDraw.parts) {
			context.fillRect(
				XOFF + ((PX + part.x) * CELL_SIZE),
				((PY + part.y) * CELL_SIZE),
				CELL_SIZE, CELL_SIZE
			);
			for (let ind in part.edges) {
				if (part.edges[ind]) {
					let i = parseInt(ind);
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
		for (let part of piece().parts) {
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
		let xoff = isHeld ? PIECE_SIZE : NEXT_XOFF;

		context.fillStyle = Color.BLACK.getRGBAHex();
		context.fillRect(xoff, PIECE_SIZE, PIECE_SIZE * 4, PIECE_SIZE * 4);
		if (!((isHeld && heldType == -1) || (!isHeld && nextType == -1))) {
			let selPiece = isHeld ? heldFullPiece() : nextFullPiece();
			context.fillStyle = selPiece.color.getRGBAHex();

			for (let part of selPiece.rotations[0].parts) {
				context.fillRect(
					xoff + (part.x * PIECE_SIZE),
					PIECE_SIZE + (part.y * PIECE_SIZE),
					PIECE_SIZE, PIECE_SIZE
				);
			}
		}
	}

	canv.addEventListener("keydown", e => {
		switch (e.code) {
			case "Space": // Space : Quick Drop
				pieceY = pseudoDrop();
				pieceDropped();
				break;
			case "KeyA":
			case "ArrowLeft": // A || Left : Move Left
				if (checkPiecePosition({ PX: pieceX - 1 })) {
					clearPiece();
					pieceX--;
					drawPiece();
				}
				break;
			case "KeyD":
			case "ArrowRight": // D || Right : Move Right
				if (checkPiecePosition({ PX: pieceX + 1 })) {
					clearPiece();
					pieceX++;
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
					pieceY++;
				} else {
					pieceDropped();
				}
				drawPiece();
				break;
			case "KeyH": // H : Swap for Held
				clearPiece();
				pieceX = NUM_CELLS_X / 2;
				pieceY = 0;
				if (heldType == -1) {
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
					for(let i in prevCells){
						cells[i] = prevCells[i];
					}
					nextType = pieceType;
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
	});

	init();

	setInterval(() => {
		update();
		render();
	}, 1000 / 60);
});