interface AnimateSvgPathOptions {
	duration?: number;
	timingFunction?: string;
	steps?: number;
	sequencePaths?: boolean;
}

export const animateSvgPath = (
	element: Element,
	{ duration = 2, timingFunction = 'linear', steps = 100, sequencePaths = false }: AnimateSvgPathOptions = {}
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const svg = element;
		if (!svg) {
			reject(new Error('SVG element not found'));
			return;
		}

		svg.setAttribute('style', 'opacity: 1');

		const paths = Array.from(svg.querySelectorAll('path'));
		if (paths.length === 0) {
			resolve();
			return;
		}

		const uniqueId = crypto.randomUUID();
		const keyframesName = `drawPath-${uniqueId}`;
		const styleId = `style-${uniqueId}`;
		const styleSheet = document.createElement('style');
		styleSheet.id = styleId;
		styleSheet.textContent = `
			@keyframes ${keyframesName} {
				from { stroke-dashoffset: ${steps}; }
				to { stroke-dashoffset: 0; }
			}
		`;
		document.head.appendChild(styleSheet);

	const preparePath = (path: SVGPathElement) => {
		path.setAttribute('pathLength', steps.toString());
		path.style.strokeDasharray = `${steps}`;
		path.style.strokeDashoffset = `${steps}`;
		path.style.strokeLinejoin = 'round';
		path.style.strokeLinecap = 'round';
	};

	const animateSinglePath = (path: SVGPathElement) => {
		return new Promise<void>((pathResolve) => {
			path.style.animation = 'none';
			void path.offsetHeight;

			const handleEnd = () => {
				path.style.strokeDashoffset = '0';
				pathResolve();
			};

			path.addEventListener('animationend', handleEnd, { once: true });
			path.style.animation = `${keyframesName} ${duration}s ${timingFunction} forwards`;
		});
	};

		const runAnimations = async () => {
			if (sequencePaths) {
				// Prepare (hide) ALL paths BEFORE starting sequence
				paths.forEach(preparePath as (path: Element) => void);

				// Then animate them one by one
				for (const path of paths) {
					await animateSinglePath(path as SVGPathElement);
				}
			} else {
			paths.forEach(preparePath as (path: Element) => void);
			await Promise.all(
				paths.map((path) => {
					return new Promise<void>((pathResolve) => {
						const handleEnd = () => {
							(path as SVGPathElement).style.strokeDashoffset = '0';
							pathResolve();
						};
						path.addEventListener('animationend', handleEnd, { once: true });
						(path as SVGPathElement).style.animation = `${keyframesName} ${duration}s ${timingFunction} forwards`;
					});
				})
			);
			}
		};

		runAnimations()
			.then(() => {
				const styleTag = document.getElementById(styleId);
				if (styleTag) {
					styleTag.remove();
				}
				resolve();
			})
			.catch((error) => {
				const styleTag = document.getElementById(styleId);
				if (styleTag) {
					styleTag.remove();
				}
				reject(error);
			});
	});
};
