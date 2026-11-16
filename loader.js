const links = [
	["Clear", ""],
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
	// Attempt to stop the currently running app
	if (appscript !== undefined) {
		try {
			appscript.stop();
		} catch (e) {}
	}

	// Get rid of the previous app div
	body.removeChild(body.querySelector("#appDiv"));

	// Create a brand new one for the new app
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

document.addEventListener("DOMContentLoaded", function () {
	const ul = document.querySelector("nav > ul");

	// Add in spacing to seperate out the app buttons from the main navigation buttons
	ul.appendChild(document.createElement("br"));
	ul.appendChild(document.createElement("br"));
	ul.appendChild(document.createElement("br"));

	// Instantiate all the links
	for (const link of links) {
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.innerText = link[0];
		a.addEventListener("click", () => { load_app(link[1]); });
		li.appendChild(a);
		ul.appendChild(li);
	}
});
