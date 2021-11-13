const links = [
	["Home", ""],
	["Pixels", "pixels.js"],
	["Voronoi Mapper", "voronoi.js"],
	["Maze Generator", "maze.js"],
	["Ping", "pong.js"],
	["Snake", "snake.js"],
	["Solitaire", "solitaire.js"],
	["Tetris", "tetris.js"]
];

const body = document.querySelector("body");

const navBase = document.createElement("navbar");

const title = document.createElement("h1");
title.innerText = "Ben's Games";
navBase.appendChild(title);
navBase.appendChild(document.createElement("br"));

const ul = document.createElement("ul");

const baseFunc = async file => {
	body.removeChild(body.querySelector("#appDiv"));

	let appDiv = document.createElement("div");
	appDiv.id = "appDiv";
	body.appendChild(appDiv);

	if(file != "") (await import("./apps/" + file)).run();
}

for(const link of links) {
	const li = document.createElement("li");
	const a = document.createElement("a");
	a.innerText = link[0];
	a.addEventListener("click", () => { baseFunc(link[1]); });
	li.appendChild(a);
	ul.appendChild(li);
}

navBase.appendChild(ul);
navBase.appendChild(document.createElement("br"));
navBase.appendChild(document.createElement("br"));

body.appendChild(navBase);