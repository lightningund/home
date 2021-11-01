/**
 * @param {String} val 
 */
const padHex = val => {
	let str = val.toString(16);
	if(str.length < 2) str = "0" + str;
	return str;
}

export class Color {
	constructor(r, g, b){
		if(r.r !== undefined) {
			this.r = r.r;
			this.g = r.g;
			this.b = r.b;
		} else {
			this.r = r;
			this.g = g;
			this.b = b;
		}

		this.a = 255;

		this.getRGBAHex = () => `#${padHex(this.r)}${padHex(this.g)}${padHex(this.b)}${padHex(this.a)}`;
	}

	static makeFromHex = hex => {
		let r, g, b;
		if(hex.startsWith("#")) hex = hex.substring(1);
		if(hex.length === 3){
			r = parseInt(hex.charAt(0), 16) * 16;
			g = parseInt(hex.charAt(1), 16) * 16;
			b = parseInt(hex.charAt(2), 16) * 16;
		} else {
			r = parseInt(hex.substr(0, 2), 16);
			g = parseInt(hex.substr(2, 2), 16);
			b = parseInt(hex.substr(4, 2), 16);
		}

		return new Color(r, g, b);
	}

	static BLACK = Color.makeFromHex("000");
	static WHITE = Color.makeFromHex("FFF");
	static GREY = Color.makeFromHex("888");
	static GRAY = Color.makeFromHex("888");
	static RED = Color.makeFromHex("F00");
	static GREEN = Color.makeFromHex("0F0");
	static BLUE = Color.makeFromHex("00F");
	static YELLOW = Color.makeFromHex("FF0");
	static PURPLE = Color.makeFromHex("F0F");
	static CYAN = Color.makeFromHex("0FF");
	static ORANGE = Color.makeFromHex("F80");
}

/**
 * A cell on a grid
 * @class
 */
export class Cell {
	constructor() {
		this.on = false;
		this.color = Color.BLACK;
		this.flashTimer = -1;
		this.edges = [false, false, false, false];
	}
}

/**
 * Piece
 * @class
 */
class PieceConc {
	constructor(parts) {
		this.parts = parts.map(part => ({x: part[0], y: part[1], edges: [true, true, true, true]}));

		for (const i in this.parts) {
			for (const j in this.parts) {
				if (i !== j) {
					const partA = this.parts[i];
					const partB = this.parts[j];

					if (partA.x === partB.x) { // Same Column
						if (partA.y === partB.y + 1) { // PartB is above
							this.parts[i].edges[0] = false;
						} else if (partA.y == partB.y - 1) { // PartB is below
							this.parts[i].edges[2] = false;
						}
					} else if (partA.y === partB.y) { // Same Row
						if (partA.x === partB.x + 1) { // PartB is to the left
							this.parts[i].edges[3] = false;
						} else if (partA.x === partB.x - 1) { // PartB is to the right
							this.parts[i].edges[1] = false;
						}
					}
				}
			}
		}

		console.log(this.parts);
	}

	static Line_A = new PieceConc([[0, 2], [1, 2], [2, 2], [3, 2]]);
	static Line_B = new PieceConc([[2, 0], [2, 1], [2, 2], [2, 3]]);
	static Line_C = new PieceConc([[0, 2], [1, 2], [2, 2], [3, 2]]);
	static Line_D = new PieceConc([[1, 0], [1, 1], [1, 2], [1, 3]]);

	static LA_A = new PieceConc([[2, 1], [0, 2], [1, 2], [2, 2]]);
	static LA_B = new PieceConc([[1, 1], [1, 2], [1, 3], [2, 3]]);
	static LA_C = new PieceConc([[0, 2], [1, 2], [2, 2], [0, 3]]);
	static LA_D = new PieceConc([[0, 1], [1, 1], [1, 2], [1, 3]]);

	static LB_A = new PieceConc([[0, 1], [0, 2], [1, 2], [2, 2]]);
	static LB_B = new PieceConc([[1, 1], [2, 1], [1, 2], [1, 3]]);
	static LB_C = new PieceConc([[0, 2], [1, 2], [2, 2], [2, 3]]);
	static LB_D = new PieceConc([[2, 1], [2, 2], [1, 3], [2, 3]]);

	static Square = new PieceConc([[1, 1], [2, 1], [1, 2], [2, 2]]);

	static ZA_A = new PieceConc([[1, 1], [2, 1], [0, 2], [1, 2]]);
	static ZA_B = new PieceConc([[1, 1], [1, 2], [2, 2], [2, 3]]);
	static ZA_C = new PieceConc([[1, 2], [2, 2], [0, 3], [1, 3]]);
	static ZA_D = new PieceConc([[0, 1], [0, 2], [1, 2], [1, 3]]);

	static ZB_A = new PieceConc([[0, 1], [1, 1], [1, 2], [2, 2]]);
	static ZB_B = new PieceConc([[2, 1], [1, 2], [2, 2], [1, 3]]);
	static ZB_C = new PieceConc([[0, 2], [1, 2], [1, 3], [2, 3]]);
	static ZB_D = new PieceConc([[1, 1], [0, 2], [1, 2], [0, 3]]);

	static T_A = new PieceConc([[1, 1], [0, 2], [1, 2], [2, 2]]);
	static T_B = new PieceConc([[1, 1], [1, 2], [2, 2], [1, 3]]);
	static T_C = new PieceConc([[0, 2], [1, 2], [2, 2], [1, 3]]);
	static T_D = new PieceConc([[1, 1], [0, 2], [1, 2], [1, 3]]);
}

/**
 * Piece with all 4 rotations
 * @class
 */
class FullPieceConc {
	constructor(pieceRots, color) {
		this.rotations = pieceRots;
		this.color = color;
	}

	static Line = new FullPieceConc([PieceConc.Line_A, PieceConc.Line_B, PieceConc.Line_C, PieceConc.Line_D], Color.CYAN);
	static LA = new FullPieceConc([PieceConc.LA_A, PieceConc.LA_B, PieceConc.LA_C, PieceConc.LA_D], Color.ORANGE);
	static LB = new FullPieceConc([PieceConc.LB_A, PieceConc.LB_B, PieceConc.LB_C, PieceConc.LB_D], Color.BLUE);
	static Square = new FullPieceConc([PieceConc.Square, PieceConc.Square, PieceConc.Square, PieceConc.Square], Color.YELLOW);
	static ZA = new FullPieceConc([PieceConc.ZA_A, PieceConc.ZA_B, PieceConc.ZA_C, PieceConc.ZA_D], Color.GREEN);
	static ZB = new FullPieceConc([PieceConc.ZB_A, PieceConc.ZB_B, PieceConc.ZB_C, PieceConc.ZB_D], Color.RED);
	static T = new FullPieceConc([PieceConc.T_A, PieceConc.T_B, PieceConc.T_C, PieceConc.T_D], Color.PURPLE);
}

export const PIECES = [FullPieceConc.Line, FullPieceConc.LA, FullPieceConc.LB, FullPieceConc.Square, FullPieceConc.ZA, FullPieceConc.ZB, FullPieceConc.T];
