export const createFirstInteractionListener = (
	callback: () => void,
	options?: {
		events?: string[];
		delay?: boolean;
	}
): (() => void) => {
	const events = options?.events || [
		'scroll',
		'click',
		'touchstart',
		'keydown',
		'mousemove',
		'wheel',
		'pointerdown',
	];

	const delay = options?.delay ?? true;

	let executed = false;
	const listeners: Array<{ event: string; handler: EventListener }> = [];

	const cleanup = () => {
		listeners.forEach(({ event, handler }) => {
			window.removeEventListener(event, handler);
		});
		listeners.length = 0;
	};

	const handleInteraction = () => {
		if (executed) {
			return;
		}
		executed = true;

		cleanup();

		if (delay) {
			requestAnimationFrame(() => {
				callback();
			});
		} else {
			callback();
		}
	};

	events.forEach((event) => {
		const handler = handleInteraction;
		window.addEventListener(event, handler, { passive: true, once: false });
		listeners.push({ event, handler });
	});

	return cleanup;
};
