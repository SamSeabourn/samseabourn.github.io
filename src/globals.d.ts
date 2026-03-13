interface AnimateSvgPathOptions {
	duration?: number;
	timingFunction?: string;
	steps?: number;
	sequencePaths?: boolean;
}

declare global {
	interface Window {
		handDrawnSVGIndex: number;
		animateSvgPath: (element: any, options?: AnimateSvgPathOptions) => Promise<void>;
		trexStomp: () => void
	}
}

export { };
