import { Deck, Card } from "https://lightningund.github.io/Mathlib/mathlib.js";

/**
 * @typedef {Object} Box
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * @typedef {Object} Vector
 * @property {number} x
 * @property {number} y
 */

class cardClick {
	constructor() {
		/** @type {string} */
		this.clickType;
		/** @type {number} */
		this.index1;
		/** @type {number} */
		this.index2;

		this.checkPos = pos => {
			if (clickedCol(pos)) {
				this.clickType = "column";
				this.index1 = Math.floor((pos.x - (ASX * 2 + CW)) / (CSX + CW));
				this.index2 = Math.floor((pos.y - CSY) / CSY);
				if(this.index2 >= cols[this.index1].length) this.index2 = cols[this.index1].length - 1;
			} else if (clickedAce(pos)) {
				this.clickType = "ace";
				this.index1 = Math.floor(pos.y / (ASY + CH));
			} else if (clickedFlipped(mousePos)) {
				this.clickType = "flipped";
			} else if (clickedDeck(mousePos)) {
				this.clickType = "deck";
			} else {
				this.clickType = undefined;
			}
		};
	}
}

/** @type {Deck} */
let deck = new Deck();

/** @type {Card[][]} */
let cols = [[], [], [], [], [], [], []];

/** @type {Card[][]} */
let aces = [[], [], [], []];

/** @type {Box[]} */
let aceBoxes = [];

/** @type {number[]} */
let colCoords = [];

/** @type {Card[]} */
let flippedDeck = [];

/** @type {Card[]} */
let selectedCards = [];

/** @type {Vector} */
let mousePos = {x: 0, y: 0};

const canv = document.createElement("canvas");
const ctxt = canv.getContext("2d");

let WIDTH, HEIGHT, CW, CH, CSX, CSY, ASX, ASY, DX, DY, FY;

let fullscreen = false;

const keydownfunc = e => {
	if(e.code == "KeyF") flipCardFunc(mousePos);
	else if(e.code == "Space") makeFullScreen();
	else if(e.code == "KeyE"){
		deck = new Deck();
		deck.shuffle();
		cols = [[], [], [], [], [], [], []];
		aces = [[], [], [], []];
		flippedDeck = [];
		selectedCards = [];

		deal(deck);
	} else if(e.code == "KeyS") mouseClick();
};

const resizefunc = e => {
	initVals(fullscreen);
}

const mousemovefunc = e => {
	mousePos = getMousePos(canv, e);
	if(selectedCards.length > 0) render();
}

const mouseclickfunc = () => {
	let click = new cardClick();
	click.checkPos(mousePos);

	if(!clickSafetyCheck(click)) return;

	const empty = selectedCards.length === 0;

	switch (click.clickType) {
		case "column":
			if(!empty) {
				cols[click.index1].push(...selectedCards);
				selectedCards = [];
			} else {
				selectedCards.push(...cols[click.index1].splice(click.index2));
			}
			break;
		case "ace":
			if(!empty) {
				aces[click.index1].push(...selectedCards);
				selectedCards = [];
			} else {
				selectedCards.push(flippedDeck.pop());
			}
			break;
		case "flipped":
			if(!empty) {
				flippedDeck.push(...selectedCards);
				selectedCards = [];
			} else {
				selectedCards.push(aces[click.index1].pop());
			}
			break;
		case "deck":
			if(!empty) {
				if(deck.cards.length === 0) {
					for(const card of flippedDeck) {
						deck.addCard(card.flip());
					}
					flippedDeck = [];
				} else flippedDeck.push(deck.takeTopCard().flip());
			}
			break;
		default:
			if(click.type !== undefined) selectedCards = [];
			break;
	}

	render();
}

const bindings = {
	"keydown": keydownfunc,
	"resize": resizefunc
};

/**
 * @param {Vector} pos
 * @param {Box} box
 * @returns {boolean}
 */
const pointOverlap = (pos, box) => {
	const xOverlap = pos.x > box.x && pos.x < box.x + box.w;
	const yOverlap = pos.y > box.y && pos.y < box.y + box.h;
	return xOverlap && yOverlap;
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clickedCol = pos => {
	for(let i = 0; i < cols.length; i++){
		const box = {x: colCoords[i], y: CSY, w: CW, h: CSY * cols[i].length + CH};
		if(pointOverlap(pos, box)) return true;
	}
	return false;
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clickedAce = pos => {
	for(let i = 0; i < aces.length; i++){
		if(pointOverlap(pos, aceBoxes[i])) return true;
	}
	return false;
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clickedDeck = pos => {
	let box = {x: DX, y: DY, w: CW, h: CH};
	return pointOverlap(pos, box);
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clickedFlipped = pos => {
	let box = {x: DX, y: FY, w: CW, h: CH};
	return pointOverlap(pos, box);
}

const makeFullScreen = () => {
	fullscreen = !fullscreen;

	if(fullscreen){
		if(canv.requestFullscreen)
			canv.requestFullscreen();
		else if(canv.mozRequestFullScreen)
			canv.mozRequestFullScreen();
		else if(canv.webkitRequestFullscreen)
			canv.webkitRequestFullscreen();
		else if(canv.msRequestFullscreen)
			canv.msRequestFullscreen();
	} else {
		if(document.exitFullscreen)
			document.exitFullscreen();
		else if(document.mozCancelFullScreen)
			document.mozCancelFullScreen();
		else if(document.webkitExitFullscreen)
			document.webkitExitFullscreen();
		else if(document.msExitFullscreen)
			document.msExitFullscreen();
	}

	initVals(fullscreen);
}

const initVals = (fullScreen = false) => {
	if(fullScreen){
		const scrW = window.innerWidth;
		const scrH = window.innerHeight;
		if(scrW * (4 / 5) > scrH){
			HEIGHT = scrH;
			WIDTH = HEIGHT * (5 / 4);
		} else {
			WIDTH = scrW;
			HEIGHT = WIDTH * (4 / 5);
		}
		canv.width = scrW;
		canv.height = scrH;
	} else {
		WIDTH = window.innerWidth * (5 / 8);
		HEIGHT = WIDTH * (4 / 5);
		canv.width = WIDTH;
		canv.height = HEIGHT;
	}

	CW = WIDTH * 0.080; //Card Width
	CH = HEIGHT * 0.150; //Card Height
	CSX = WIDTH * 0.020; //Card Spacing X
	CSY = HEIGHT * 0.050; //Card Spacing Y
	ASX = WIDTH * 0.040; //Ace Spacing X
	ASY = HEIGHT * 0.080; //Ace Spacing X

	for(let i = 0; i < cols.length; i++){
		let minX = (ASX * 2 + CW) + (i * (CSX + CW));
		colCoords[i] = minX;
	}

	for(let i = 0; i < aces.length; i++){
		let minY = ASY + (i * (CH + ASY));
		aceBoxes[i] = {x: ASX, y: minY, w: CW, h: CH};
	}

	DX = WIDTH - (ASX + CW); //Deck X
	DY = 2 * CSY; //Deck Y
	FY = CSY + DY + CH; //Flipped Y
}

/**
 * @param {cardClick} click
 * @returns {boolean}
 */
const clickSafetyCheck = click => {
	if(selectedCards.length === 0){
		switch (click.clickType){
			case "column":
				if(cols[click.index1].length === 0) return false;
				break;
			case "flipped":
				if(flippedDeck.length === 0) return false;
				break;
			case "ace":
				if(aces[click.index1].length === 0) return false;
				break;
		}
	}
	return true;
}

const flipCardFunc = (mousePos, doubleClick = false) => {
	let click = new cardClick();
	click.checkPos(mousePos);

	if(!clickSafetyCheck(click)) return;

	if(click.clickType === "column") cols[click.index1][click.index2].flip();
	else if(click.clickType === "deck" && !doubleClick){
		if(deck.cards.length == 0){
			for(const card of flippedDeck){
				deck.addCard(click.flip());
			}
			flippedDeck = [];
		} else flippedDeck.push(deck.takeTopCard().flip());
	} else if(click.clickType === "flipped"){
		if(flippedDeck.length == 0){
			for(const card of deck.cards){
				flippedDeck.push(click.flip());
			}
			deck = [];
		} else deck.cards.unshift(flippedDeck.pop().flip());
	}
}

const deal = cards => {
	for(let i = 0; i < cols.length; i++){
		for(let j = i; j < cols.length; j++){
			let card = cards.takeTopCard();
			cols[j][i] = card;
			if(i == j){
				cols[i][j].flipped = true;
			}
		}
	}
}

//Get the mouse position
const getMousePos = (canv, event) => {
	var rect = canv.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
}

const render = () => {
	ctxt.fillStyle = "#00FF00";
	ctxt.fillRect(0, 0, WIDTH, HEIGHT);
	for(let i = 0; i < aces.length; i++){
		let imageToDraw = aces[i].length == 0 ? Card.cardOutline : aces[i][aces[i].length - 1].sprite;
		ctxt.drawImage(imageToDraw, aceBoxes[i].x, aceBoxes[i].y, CW, CH);
	}

	let deckImage = deck.cards.length == 0 ? Card.cardOutline : Card.cardBack;
	ctxt.drawImage(deckImage, DX, DY, CW, CH);

	let flipImage = flippedDeck.length == 0 ? Card.cardOutline : flippedDeck[flippedDeck.length - 1].sprite
	ctxt.drawImage(flipImage, DX, FY, CW, CH);

	for(let i = 0; i < cols.length; i++){
		if(cols[i].length == 0){
			ctxt.drawImage(Card.cardOutline, colCoords[i], CSY, CW, CH);
		} else {
			for(let j = 0; j < cols[i].length; j++){
				let imgToDraw = cols[i][j].flipped ? cols[i][j].sprite : Card.cardBack;
				ctxt.drawImage(imgToDraw, colCoords[i], j  * CSY + CSY, CW, CH);
			}
		}
	}

	for(let i = 0; i < selectedCards.length; i++){
		let imgToDraw = selectedCards[i].flipped ? selectedCards[i].sprite : Card.cardBack;
		ctxt.drawImage(imgToDraw, mousePos.x - CW / 2, i * CSY + mousePos.y, CW, CH);
	}
}

export const run = (() => {
	const baseDiv = document.getElementById("appDiv");

	canv.addEventListener("click", mouseclickfunc);
	canv.addEventListener("dblclick", e => flipCardFunc(mousePos, true));
	canv.addEventListener("mousemove", mousemovefunc);

	baseDiv.appendChild(canv);

	initVals();

	deck.shuffle();

	deal(deck);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	initVals(fullscreen);
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}
};
