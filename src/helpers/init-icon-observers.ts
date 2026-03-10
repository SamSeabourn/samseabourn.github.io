import { mountSVG } from './mount-svg';

export const initIconObservers = async (): Promise<void> => {
	const handDrawElements = document.querySelectorAll('[data-hand-draw]');

	const observerOptions: IntersectionObserverInit = {
		root: null,
		rootMargin: '0px',
		threshold: 0.5,
	};

	handDrawElements.forEach((element) => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(async (entry) => {
				if (entry.isIntersecting) {
					const svgUrl = element.getAttribute('data-svg-url');
					if (svgUrl) {
						await mountSVG(element as SVGElement, svgUrl);
					}
					await window.animateSvgPath(element as SVGElement, { duration: 1, steps: 3 });
					element.setAttribute('style', 'opacity: 1;');
					observer.unobserve(element);
				}
			});
		}, observerOptions);

		observer.observe(element);
	});
};
