// Wrap the entire program in an anonymous function that is instantly executed
// This allows to us to have constants that don't bleed outside the scope of this app
(() => {
	const baseDiv = document.querySelector("#appDiv");

	const WIDTH = 800;
	const HEIGHT = 800;

	const canv = document.createElement("canvas");
	canv.width = WIDTH;
	canv.height = HEIGHT;
	const context = canv.getContext("2d");

	baseDiv.appendChild(canv);
})();