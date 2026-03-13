export async function mountSVG(target: any, url: string): Promise<void> {
	if (!target || !(target instanceof SVGElement)) {
		throw new TypeError('mountSVG: target must be an SVGElement');
	}
	if (!url || typeof url !== 'string') {
		throw new TypeError('mountSVG: url must be a non-empty string');
	}

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`mountSVG: Failed to fetch ${url} - ${response.status} ${response.statusText}`
		);
	}

	const svgText = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(svgText, 'image/svg+xml');

	const parserError = doc.querySelector('parsererror');
	if (parserError) {
		throw new Error(`mountSVG: Invalid SVG content from ${url}`);
	}

	const sourceSVG = doc.querySelector('svg');
	if (!sourceSVG) {
		throw new Error(`mountSVG: No <svg> element found in ${url}`);
	}

	const preservedAttrs = new Map<string, string>();
	Array.from(target.attributes).forEach((attr) => {
		preservedAttrs.set(attr.name, attr.value);
	});

	target.innerHTML = sourceSVG.innerHTML;

	const criticalAttrs = ['viewBox', 'preserveAspectRatio', 'xmlns'];
	criticalAttrs.forEach((attrName) => {
		if (sourceSVG.hasAttribute(attrName) && !preservedAttrs.has(attrName)) {
			target.setAttribute(attrName, sourceSVG.getAttribute(attrName)!);
		}
	});

	preservedAttrs.forEach((value, name) => {
		target.setAttribute(name, value);
	});

	target.setAttribute('data-mounted', 'true');
}
