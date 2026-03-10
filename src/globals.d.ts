interface AnimateSvgPathOptions {
	duration?: number;
	timingFunction?: string;
	steps?: number;
	sequencePaths?: boolean;
}

declare global {
	interface Window {
		handDrawnSVGIndex: number;
		animateSvgPath: (element: SVGElement, options?: AnimateSvgPathOptions) => Promise<void>;
	}
}

export { };
