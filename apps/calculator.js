const ops = /\-|\+|\/|\*/g;
const buttons = $("#calculator .button");
const resultBox = $("#result")[0];

let type = "";
let lastButtonType = "";
let display = [];
let displayTypes = [];

const buttonType = button => {
	const id = button.id;
	const bClass = button.classList;

	if(id === "back") type = "back";
	else if(bClass.contains("num")) type = "number";
	else if(bClass.contains("op")) type = "operator";
	else if(id === "clear") type = "clear";
	else if(id === "equal") type = "eval";
	
	console.log(type, button.innerHTML);

	resultBox.innerHTML += button.innerHTML;

	enter(button.innerHTML);
}

const findNextOp = (ops, searchArray) => {
	let index = searchArray.length + 5;
	ops.forEach(op => {
		const opInd = searchArray.indexOf(op);
		if(opInd < index && opInd !== -1) index = opInd;
	});

	if(index > searchArray.length) index = -1;
	return index;
}

const enter = (value) => {
	switch(type) {
		case "number":
			display.push(value);
			displayTypes.push("number");
			lastButtonType = "number";
			break;
		case "operator":
			if(lastButtonType === "operator"){
				display.pop();
				displayTypes.pop();
			}
			lastButtonType = "operator";
			displayTypes.push("operator");
			display.push(value);
			break;
		case "clear":
			display = [];
			displayTypes = [];
			break;
		case "back":
			display.pop();
			displayTypes.pop();
			break;
		case "eval":
			//Check if the first thing in the display is an operator (we don't want that)
			if(displayTypes[0] === "operator"){
				//If it is we then shift the whole array down one to make it a number
				display.shift();
				displayTypes.shift();
			}
			//Do the same thing but on the other end
			if(displayTypes[displayTypes.length - 1] === "operator"){
				display.pop();
				displayTypes.pop();
			}

			let displayString = display.join("");
			let numbers = displayString.split(ops).map(number => parseFloat(number));
			let operators = displayString.replace(/([0-9]|\.)/g, "").split("");
			let MD = findNextOp(["*", "/"], operators);

			while(MD !== -1){
				const a = numbers[MD];
				const b = numbers[MD + 1]
				const replaceNum = (operators[MD] === "*") ? (a * b) : (a / b);
				numbers.splice(MD, 2, replaceNum);
				operators.splice(MD, 1);
				MD = findNextOp(["*", "/"], operators);
			}

			let AS = findNextOp(["+", "-"], operators);
			while(AS !== -1){
				const a = numbers[AS];
				const b = numbers[AS + 1]
				const replaceNum = (operators[AS] === "+") ? (a + b) : (a - b);
				numbers.splice(AS, 2, replaceNum);
				operators.splice(AS, 1);
				AS = findNextOp(["+", "-"], operators);
			}

			display = numbers[0].toString();
			displayTypes = [];
			for(let i = 0; i < display.length; i ++){
				displayTypes[i] = "number";
			}

			resultBox.innerHTML = display;

			display = display.split("");
			lastButtonType = "";
			break;
	}
}

export const start = () => {
	Array.prototype.forEach.call(buttons, button => {
		button.addEventListener("click", e => buttonType(button));
	});
}