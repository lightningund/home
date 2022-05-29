const WIDTH = 800;
const HEIGHT = 800;

const canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
const context = canv.getContext("2d");

let pixelMinDists = [];

const keydownfunc = e => {
	if(e.code === "KeyC") {
		pixelMinDists = [];
		context.clearRect(0, 0, WIDTH, HEIGHT);
	}
}

const bindings = {
	"keydown": keydownfunc
};

const updateCanv = click => {
	const imgDat = context.getImageData(0, 0, WIDTH, HEIGHT);

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

export const run = (() => {
	const baseDiv = document.querySelector("#appDiv");

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

	baseDiv.appendChild(canv);

	for(const key of Object.keys(bindings)) {
		window.addEventListener(key, bindings[key]);
	}
});

export const stop = () => {
	for(const key of Object.keys(bindings)) {
		window.removeEventListener(key, bindings[key]);
	}
};
