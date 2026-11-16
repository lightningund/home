const links = [
	["Home", ""],
	["Pixels", "pixels.js"],
	["Voronoi Mapper", "voronoi.js"],
	["Maze Generator", "maze.js"],
	["Ping", "pong.js"],
	["Snake", "snake.js"],
	["Solitaire", "solitaire.js"],
	["Tetris", "tetris.js"],
	["Turing Machine", "turing_machine.js"],
	["Sudoku", "sudoku.js"]
];

const body = document.querySelector("body");

// The currently loaded app
let appscript = undefined;

const load_app = async file => {
	if (appscript !== undefined) {
		try {
			appscript.stop();
		} catch (e) {}
	}

	body.removeChild(body.querySelector("#appDiv"));

	let appDiv = document.createElement("div");
	appDiv.id = "appDiv";
	body.appendChild(appDiv);

	if (file === "") {
		appscript = undefined;
	} else {
		appscript = await import("./apps/" + file);
		appscript.run();
	}
}

const navBase = document.createElement("navbar");
const ul = document.createElement("ul");

for (const link of links) {
	const li = document.createElement("li");
	const a = document.createElement("a");
	a.innerText = link[0];
	a.addEventListener("click", () => { load_app(link[1]); });
	li.appendChild(a);
	ul.appendChild(li);
}

navBase.appendChild(ul);
navBase.appendChild(document.createElement("br"));
navBase.appendChild(document.createElement("br"));

body.appendChild(navBase);
