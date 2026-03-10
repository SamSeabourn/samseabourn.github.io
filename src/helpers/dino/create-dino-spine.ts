import { Assets } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v7';

export const createDinoSpine = async () => {
	await Assets.load('/spine/rex.skel');
	await Assets.load('/spine/rex.atlas');
	const spine = Spine.from({
		skeleton: '/spine/rex.skel',
		atlas: '/spine/rex.atlas',
	});

	return spine;
};
