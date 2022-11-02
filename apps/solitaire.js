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

class Card_Click {
	constructor() {
		/** @type {string} */
		this.click_type;
		/** @type {number} */
		this.index1;
		/** @type {number} */
		this.index2;

		this.check_pos = pos => {
			if (clicked_col(pos)) {
				this.click_type = "column";
				this.index1 = Math.floor((pos.x - (ASX * 2 + CW)) / (CSX + CW));
				this.index2 = Math.floor((pos.y - CSY) / CSY);
				if(this.index2 >= cols[this.index1].length) this.index2 = cols[this.index1].length - 1;
			} else if (clicked_ace(pos)) {
				this.click_type = "ace";
				this.index1 = Math.floor(pos.y / (ASY + CH));
			} else if (clicked_flipped(mouse_pos)) {
				this.click_type = "flipped";
			} else if (clicked_deck(mouse_pos)) {
				this.click_type = "deck";
			} else {
				this.click_type = undefined;
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
let ace_boxes = [];

/** @type {number[]} */
let col_coords = [];

/** @type {Card[]} */
let flipped_deck = [];

/** @type {Card[]} */
let selected_cards = [];

/** @type {Vector} */
let mouse_pos = {x: 0, y: 0};

const canv = document.createElement("canvas");
const ctxt = canv.getContext("2d");

let WIDTH, HEIGHT, CW, CH, CSX, CSY, ASX, ASY, DX, DY, FY;

let fullscreen = false;

const keydownfunc = e => {
	if(e.code == "KeyF") flip_card_func(mouse_pos);
	else if(e.code == "Space") make_fullscreen();
	else if(e.code == "KeyE"){
		deck = new Deck();
		deck.shuffle();
		cols = [[], [], [], [], [], [], []];
		aces = [[], [], [], []];
		flipped_deck = [];
		selected_cards = [];

		deal(deck);
	} else if(e.code == "KeyS") mouseClick();
};

const resizefunc = e => {
	init_vals(fullscreen);
}

const mousemovefunc = e => {
	mouse_pos = get_mouse_pos(canv, e);
	if(selected_cards.length > 0) render();
}

const mouseclickfunc = () => {
	let click = new Card_Click();
	click.check_pos(mouse_pos);

	if(!click_safety_check(click)) return;

	const empty = selected_cards.length === 0;

	switch (click.click_type) {
		case "column":
			if(!empty) {
				cols[click.index1].push(...selected_cards);
				selected_cards = [];
			} else {
				selected_cards.push(...cols[click.index1].splice(click.index2));
			}
			break;
		case "ace":
			if(!empty) {
				aces[click.index1].push(...selected_cards);
				selected_cards = [];
			} else {
				selected_cards.push(flipped_deck.pop());
			}
			break;
		case "flipped":
			if(!empty) {
				flipped_deck.push(...selected_cards);
				selected_cards = [];
			} else {
				selected_cards.push(aces[click.index1].pop());
			}
			break;
		case "deck":
			if(!empty) {
				if(deck.cards.length === 0) {
					for(const card of flipped_deck) {
						deck.addCard(card.flip());
					}
					flipped_deck = [];
				} else flipped_deck.push(deck.takeTopCard().flip());
			}
			break;
		default:
			if(click.type !== undefined) selected_cards = [];
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
const point_overlap = (pos, box) => {
	const xOverlap = pos.x > box.x && pos.x < box.x + box.w;
	const yOverlap = pos.y > box.y && pos.y < box.y + box.h;
	return xOverlap && yOverlap;
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clicked_col = pos => {
	for(let i = 0; i < cols.length; i++){
		const box = {x: col_coords[i], y: CSY, w: CW, h: CSY * cols[i].length + CH};
		if(point_overlap(pos, box)) return true;
	}
	return false;
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clicked_ace = pos => {
	for(let i = 0; i < aces.length; i++){
		if(point_overlap(pos, ace_boxes[i])) return true;
	}
	return false;
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clicked_deck = pos => {
	let box = {x: DX, y: DY, w: CW, h: CH};
	return point_overlap(pos, box);
}

/**
 * @param {Vector} pos
 * @returns {boolean}
 */
const clicked_flipped = pos => {
	let box = {x: DX, y: FY, w: CW, h: CH};
	return point_overlap(pos, box);
}

const make_fullscreen = () => {
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

	init_vals(fullscreen);
}

const init_vals = (fullScreen = false) => {
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
		col_coords[i] = minX;
	}

	for(let i = 0; i < aces.length; i++){
		let minY = ASY + (i * (CH + ASY));
		ace_boxes[i] = {x: ASX, y: minY, w: CW, h: CH};
	}

	DX = WIDTH - (ASX + CW); //Deck X
	DY = 2 * CSY; //Deck Y
	FY = CSY + DY + CH; //Flipped Y
}

/**
 * @param {Card_Click} click
 * @returns {boolean}
 */
const click_safety_check = click => {
	if(selected_cards.length === 0){
		switch (click.click_type){
			case "column":
				if(cols[click.index1].length === 0) return false;
				break;
			case "flipped":
				if(flipped_deck.length === 0) return false;
				break;
			case "ace":
				if(aces[click.index1].length === 0) return false;
				break;
		}
	}
	return true;
}

const flip_card_func = (mousePos, doubleClick = false) => {
	let click = new Card_Click();
	click.check_pos(mousePos);

	if(!click_safety_check(click)) return;

	if(click.click_type === "column") cols[click.index1][click.index2].flip();
	else if(click.click_type === "deck" && !doubleClick){
		if(deck.cards.length == 0){
			for(const card of flipped_deck){
				deck.addCard(click.flip());
			}
			flipped_deck = [];
		} else flipped_deck.push(deck.takeTopCard().flip());
	} else if(click.click_type === "flipped"){
		if(flipped_deck.length == 0){
			for(const card of deck.cards){
				flipped_deck.push(click.flip());
			}
			deck = [];
		} else deck.cards.unshift(flipped_deck.pop().flip());
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
const get_mouse_pos = (canv, event) => {
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
		ctxt.drawImage(imageToDraw, ace_boxes[i].x, ace_boxes[i].y, CW, CH);
	}

	let deckImage = deck.cards.length == 0 ? Card.cardOutline : Card.cardBack;
	ctxt.drawImage(deckImage, DX, DY, CW, CH);

	let flipImage = flipped_deck.length == 0 ? Card.cardOutline : flipped_deck[flipped_deck.length - 1].sprite
	ctxt.drawImage(flipImage, DX, FY, CW, CH);

	for(let i = 0; i < cols.length; i++){
		if(cols[i].length == 0){
			ctxt.drawImage(Card.cardOutline, col_coords[i], CSY, CW, CH);
		} else {
			for(let j = 0; j < cols[i].length; j++){
				let imgToDraw = cols[i][j].flipped ? cols[i][j].sprite : Card.cardBack;
				ctxt.drawImage(imgToDraw, col_coords[i], j  * CSY + CSY, CW, CH);
			}
		}
	}

	for(let i = 0; i < selected_cards.length; i++){
		let imgToDraw = selected_cards[i].flipped ? selected_cards[i].sprite : Card.cardBack;
		ctxt.drawImage(imgToDraw, mouse_pos.x - CW / 2, i * CSY + mouse_pos.y, CW, CH);
	}
}

export const run = (() => {
	const baseDiv = document.getElementById("appDiv");

	canv.addEventListener("click", mouseclickfunc);
	canv.addEventListener("dblclick", e => flip_card_func(mouse_pos, true));
	canv.addEventListener("mousemove", mousemovefunc);

	baseDiv.appendChild(canv);

	init_vals();

	deck.shuffle();

	deal(deck);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}

	init_vals(fullscreen);
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}
};
