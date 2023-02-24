const clicked = {
	state: false,
	pos: { x: 0, y: 0 },
	element: undefined,
	handlers: undefined
};

function globalMousemoveHandler(event) {
	if (clicked.state) {
		event.preventDefault();
		if (typeof clicked.handlers.mousemove === 'function')
			clicked.handlers.mousemove(event);
	}
}

function globalMouseupHandler (event) {
	if (clicked.state === true && typeof clicked.handlers.mouseup === 'function')
		clicked.handlers.mouseup(event);
	clicked.state = false;
}

function initSwitch(elem) {
	const input = elem.querySelector('input[type=checkbox]');
	const background = document.createElement('span');
	const handle = document.createElement('span');

	const mousemove = function (event) {
		background.style.width = `${event.x - elem.getBoundingClientRect().left + handle.getBoundingClientRect().width/2}px`;
	}

	const mouseup = function (event) {
		const dx = Math.abs(clicked.pos.x - event.x);
		const width = background.getBoundingClientRect().width;
		const minWidth = parseInt(getComputedStyle(background).minWidth);

		input.checked = (dx < 3) ?
			input.checked :
			(width <= (minWidth + elem.getBoundingClientRect().width)/2);


		background.style.removeProperty('width');
	}

	const mousedown = function (event) {
		if (event.button === 0) {
			const { x, y } = event;
			clicked.state = true;
			clicked.pos = { x, y };
			clicked.element = event.target;
			clicked.handlers = { mousemove, mouseup };
		}
	}

	input.style.display = 'none';
	input.addEventListener('change', () => {
		(input.checked) ?
			elem.classList.add('checked') :
			elem.classList.remove('checked');
	});

	background.classList.add('background', 'switch');

	handle.classList.add('handle', 'switch');
	handle.addEventListener('mousedown', mousedown, true);

	elem.classList.add('initialised');
	elem.append(background, handle);
}

function init() {
	const switches = document.querySelectorAll('div.switch.module');
	switches.forEach(initSwitch);
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('mouseup', globalMouseupHandler);
document.addEventListener('mousemove', globalMousemoveHandler);
