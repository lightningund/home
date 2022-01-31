class TM {
	constructor() {
		/** @type {State[]} */
		this.states = [];

		/** @type {State} */
		this.state;

		/** @type {number} */
		this.stateNum = 1;

		/** @type {Tape} */
		this.tape;

		/** @type {number} */
		this.tapePos;

		/**
		 * @param {number} state_num
		 * @returns {State}
		 */
		this.getState = (state_num) => this.states[state_num - 1];

		/**
		 * @param {HTMLCanvasElement} canv
		 */
		this.update = (canv) => {
			const tapeSymbol = this.tape.symbols[this.tapePos];
			const ops = this.state.findOps(tapeSymbol);

			for(const op of ops) {
				const cmd = op.charAt(0);
				switch(cmd) {
					case "P": // Print
						this.tape.symbols[this.tapePos] = op.slice(1);
						break;
					case "R": // Right
						this.tapePos ++;
						this.tapeBoundsCheck();
						break;
					case "L": // Left
						this.tapePos --;
						this.tapeBoundsCheck();
						break;
					case "S": // State Change
						const target = parseInt(op.slice(1));
						this.state = this.getState(target);
						this.stateNum = target;
						break;
					case "H": // Halt
						this.halt();
						break;
				}
			}

			this.render(canv);
		}

		this.tapeBoundsCheck = () => {
			if(this.tapePos < 0 && !this.tape.infLeft) this.halt();
			if(this.tapePos >= this.tape.symbols.length && !this.tape.infRight) this.halt();
		}

		this.halt = () => {
			console.log("DONE");
		}

		/**
		 * @param {Tape} tape
		 */
		this.feedTape = (tape) => {
			this.tape = tape;
			this.tapePos = tape.startPos;
		}

		/**
		 * @param {HTMLCanvasElement} canv
		 */
		this.render = (canv) => {
			const ctxt = canv.getContext("2d");
			ctxt.textAlign = "center";
			ctxt.textBaseline = "middle";
			const w = canv.width;
			const h = canv.height;
			const entrySize = w / 10;
			const entryHeight = entrySize * 2;
			const entryY = (h - entryHeight) / 2;
			ctxt.fillStyle = "#888";
			ctxt.fillRect(0, 0, w, h);
			ctxt.strokeStyle = "#000";
			ctxt.fillStyle = "#000";

			for(let i = 0; i < 9; i ++) {
				const ex = i > 4 ? (i + 1) * entrySize : i * entrySize;
				let ew, eh, ey;
				if(i === 4) {
					ey = entryY - (entryHeight / 2);
					ew = entrySize * 2;
					eh = entryHeight * 2;
				} else {
					ey = entryY;
					ew = entrySize;
					eh = entryHeight;
				}
				ctxt.strokeRect(ex, ey, ew, eh);
				let drawPos = this.tapePos + i - 4;
				if(!(drawPos < 0 || drawPos >= this.tape.symbols.length)) {
					ctxt.font = `${ew}px monospace`;
					ctxt.fillText(this.tape.symbols[drawPos], ex + ew / 2, ey + eh / 2, ew);
				}
			}

			ctxt.font = `${entrySize}px monospace`;
			ctxt.fillText(`S${this.stateNum}`, w / 2, h * 3 / 4);
		}
	}
}

class Tape {
	constructor() {
		/** @type {boolean} */
		this.infLeft = false;

		/** @type {boolean} */
		this.infRight = false;

		/** @type {number} */
		this.startPos;

		/** @type {string[]} */
		this.symbols = [];
	}
}

class State {
	constructor() {
		/** @type {Instruction[]} */
		this.instructions = [];

		/**
		 * @param {string} tapeVal
		 * @returns {string[]}
		 */
		this.findOps = (tapeVal) => {
			for(const instr of this.instructions) {
				if(instr.tapeSymbol === tapeVal || instr.tapeSymbol === undefined) {
					return instr.operations;
				}
			}
		}
	}
}

class Instruction {
	constructor() {
		/** @type {string} */
		this.tapeSymbol;

		/** @type {string[]} */
		this.operations = [];
	}
}

// TODO: FINISH THE F***KING UI

const addNewInstr = parentDiv => {
    if(parentDiv[0].childElementCount !== 0) {
        parentDiv.append($("<p>").text(", "));
    }

    const selectElem = $("<select>");
    selectElem.append($("<option>").text("Left").attr("value", "L"));
    selectElem.append($("<option>").text("Right").attr("value", "R"));
    selectElem.append($("<option>").text("Halt").attr("value", "H"));
    selectElem.append($("<option>").text("Put").attr("value", "P"));
    selectElem.append($("<option>").text("State").attr("value", "S"));
    selectElem.change(() => {
        /** @type {HTMLDivElement} */
        const instrDiv = parentDiv[0];
        const readNumDiv = instrDiv.parentElement;
        const stateDiv = readNumDiv.parentElement;
        const instrNum = Array.from(instrDiv.children).indexOf(selectElem);
        const readNum = Array.from(stateDiv.querySelectorAll(".stateDiv > div")).indexOf(readNumDiv);
        const stateNum = Array.from(stateDiv.parentElement.querySelectorAll(".stateDiv")).indexOf(stateDiv);
        const allInstr = Array.from(instrDiv.children).map(elem => elem.value);

        const chosen = instrDiv.value;
        if(instrNum === instrDiv.childElementCount - 1) {
			if(["M", "P"].indexOf(chosen) !== -1) {

			}
        }

        machine.states[stateNum].instructions[readNum].operations = allInstr;
    });

    parentDiv.append(selectElem);
}

const createNewState = () => {
    const stateNum = statesDiv.childElementCount;

    if(machine.states[stateNum] === undefined) {
        const state = new State();
        state.instructions = [
            {tapeSymbol:"0", operations:[]},
            {tapeSymbol:"1", operations:[]},
        ];
        machine.states.push(state);
    }

    const stateNumElem = $("<p>");
    stateNumElem.text(`S${stateNum}`);

    const zeroDiv = $("<div>");
    const zeroInstrDiv = $("<div>");
    zeroDiv.append($("<p>").text("0"));
    zeroDiv.append(zeroInstrDiv);
    zeroDiv.append($("<button>").text("+").click(() => addNewInstr(zeroInstrDiv)));
    const oneDiv = $("<div>");
    const oneInstrDiv = $("<div>");
    oneDiv.append($("<p>").text("1"));
    oneDiv.append(oneInstrDiv);
    oneDiv.append($("<button>").text("+").click(() => addNewInstr(oneInstrDiv)));

    const stateDiv = $("<div>").addClass("stateDiv");
    stateDiv.append(stateNumElem, $("<br>"), zeroDiv, $("<br>"), oneDiv);
    $(statesDiv).append(stateDiv);
}

// Your CSS as text
const styles = `
    .stateDiv * {
        display: inline;
    }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;

// Defining the machine states
const s1 = new State();
s1.instructions = [
	{tapeSymbol:"0", operations:["R"]},
	{tapeSymbol:"1", operations:["S2"]},
];
const s2 = new State();
s2.instructions = [
	{tapeSymbol:"0", operations:["H"]},
	{tapeSymbol:"1", operations:["P0", "R", "S3"]},
];
const s3 = new State();
s3.instructions = [
	{tapeSymbol:"0", operations:["R", "S4"]},
	{tapeSymbol:"1", operations:["R"]},
];
const s4 = new State();
s4.instructions = [
	{tapeSymbol:"0", operations:["L", "S5"]},
	{tapeSymbol:"1", operations:["R"]},
];
const s5 = new State();
s5.instructions = [
	{tapeSymbol:"0", operations:["H"]},
	{tapeSymbol:"1", operations:["P0", "L", "S6"]},
];
const s6 = new State();
s6.instructions = [
	{tapeSymbol:"0", operations:["L", "S7"]},
	{tapeSymbol:"1", operations:["L"]},
];
const s7 = new State();
s7.instructions = [
	{tapeSymbol:"0", operations:["R", "S2"]},
	{tapeSymbol:"1", operations:["L"]},
];

const machine = new TM();
machine.states = [s1, s2, s3, s4, s5, s6, s7];
machine.state = machine.states[0];

// Setting up the tape
const tape = new Tape();
tape.startPos = 0;
tape.symbols = "01101110".split("");

// Doing the things and stuff
machine.feedTape(tape);

/** @type {HTMLCanvasElement} */
const canv = document.createElement("canvas");
canv.width = 800;
canv.height = 800;
machine.render(canv);

const updateMachine = () => {
	machine.update(canv);
}

const updateBtn = document.createElement("button");
updateBtn.innerHTML = "UPDATE";
updateBtn.onclick = updateMachine;

const addStateBtn = document.createElement("button");
addStateBtn.innerHTML = "+";
addStateBtn.onclick = createNewState;

const statesDiv = document.createElement("div");

export const run = (async () => {
    await import("https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js");

	const baseDiv = document.getElementById("appDiv");
	baseDiv.appendChild(canv);
    baseDiv.appendChild(statesDiv);
    baseDiv.appendChild(updateBtn);
    baseDiv.appendChild(addStateBtn);

    baseDiv.appendChild(styleSheet);
});

export const stop = () => {};