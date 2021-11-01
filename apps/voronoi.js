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

	let pixelMinDists = [];

	const imgDat = context.getImageData(0, 0, WIDTH, HEIGHT);

	// Keyboard events
	window.addEventListener("keydown", evt => {
		if(evt.code === "KeyC") {
			clicks = [];
			pixelMinDists = [];
			context.clearRect(0, 0, WIDTH, HEIGHT);
		}
	}, false);

	canv.onclick = evt => {
		const pos_x = evt.offsetX ? evt.offsetX : evt.pageX - canv.offsetLeft;
		const pos_y = evt.offsetY ? evt.offsetY : evt.pageY - canv.offsetTop;

		const click = {
			x:pos_x,
			y:pos_y,
			r:Math.floor(Math.random() * 255),
			g:Math.floor(Math.random() * 255),
			b:Math.floor(Math.random() * 255)
		};

		updateCanv(click);
	};

	const updateCanv = click => {
		for(let i = 0; i < WIDTH; i++){
			if(pixelMinDists[i] === undefined) pixelMinDists[i] = [];
			for(let j = 0; j < HEIGHT; j++){
				let minDist = pixelMinDists[i][j] || Number.POSITIVE_INFINITY;
				const dx = i - click.x;
				const dy = j - click.y;
				const dist = dx * dx + dy * dy;
				if (dist < minDist) {
					pixelMinDists[i][j] = dist;

					const ind = (i + j * WIDTH) * 4;
					imgDat.data[ind] = click.r;
					imgDat.data[ind + 1] = click.g;
					imgDat.data[ind + 2] = click.b;
					imgDat.data[ind + 3] = 255;
				}
			}
		}
		
		context.putImageData(imgDat, 0, 0);
	}
})();