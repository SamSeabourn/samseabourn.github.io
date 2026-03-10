export const getRuntimeStats = async () => {
	return new Promise<string>((resolve) => {
		const metrics = {
			lcp: 0,
			tbt: 0,
			cls: 0,
			net: 'unknown',
		};

		let clsScore = 0;
		let lcpValue = 0;

		const clsObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as any[]) {
				if (!entry.hadRecentInput) {
					clsScore += entry.value;
				}
			}
		});

		try {
			clsObserver.observe({ type: 'layout-shift', buffered: true });
		} catch (e) {
			console.warn('CLS observation not supported');
		}

		const lcpObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1] as any;
			lcpValue = lastEntry.startTime;
		});

		try {
			lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
		} catch (e) {
			console.warn('LCP observation not supported');
		}

		let tbtValue = 0;
		const tbtObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.duration > 50) {
					tbtValue += entry.duration - 50;
				}
			}
		});

		try {
			tbtObserver.observe({ type: 'longtask', buffered: true });
		} catch (e) {
			console.warn('Long task observation not supported');
		}

		const connection = (navigator as any).connection;
		if (connection && connection.effectiveType) {
			metrics.net = connection.effectiveType;
		}

		const measurementDelay = 2500; // 2.5s to align with Lighthouse timing

		setTimeout(() => {
			metrics.lcp = lcpValue;
			metrics.tbt = tbtValue;
			metrics.cls = clsScore;

			// Disconnect observers
			clsObserver.disconnect();
			lcpObserver.disconnect();
			tbtObserver.disconnect();

			const formatTime = (ms: number) => {
				const seconds = (ms / 1000).toFixed(2);
				return seconds.padStart(6, '0') + 's  ';
			};

			const formatMs = (ms: number) => {
				const rounded = Math.round(ms);
				return rounded.toString().padStart(3, '0') + 'ms    ';
			};

			const formatCls = (score: number) => {
				return score.toFixed(3).padStart(5, '0') + '   ';
			};

			const formatNet = (net: string) => {
				return net.padEnd(8, ' ');
			};

			const statsString = [
				`LCP: ${formatTime(metrics.lcp)}`,
				`TBT: ${formatMs(metrics.tbt)}`,
				`CLS: ${formatCls(metrics.cls)}`,
				`NET: ${formatNet(metrics.net)}`,
			].join('\n');

			console.log('Runtime Stats:\n' + statsString);
			resolve(statsString);
		}, measurementDelay);
	});
}
