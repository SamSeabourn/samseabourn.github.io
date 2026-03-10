import { Spine } from '@esotericsoftware/spine-pixi-v7';
import { Graphics, Ticker } from 'pixi.js';
import { createDinoSpine } from './create-dino-spine';
import { getRandomInt } from './get-random-int';
import { abilityGlitch } from './ability-glitch';

type XPlane = {
    min: number;
    max: number;
    yHeight?: number;
};

interface SpawnDinoOptions {
    spawnPoint: {
        x: number;
        y: number;
    };
    scale: number;
    xPlane: XPlane;
    canvasElement: HTMLCanvasElement;
}
type MoveToAnimation = 'Walk' | 'Run' | 'Sneak';
type FixedTimeAnimation = 'To Sleep' | 'Get Up' | 'Raor' | 'Stomp' | 'Smelling';
type DynamicTimedAnimation = 'Sleep' | 'Idle' | 'Idle Combat';

type CharacterDirection = 1 | -1;

const BASE_SCALE = 0.15;
const CANCEL_ANIMATION_EVENT = 'animation:cancel';

const MAX_ENERGY = 100;

export const spawnDino = async ({
    scale = 1,
    canvasElement,
    spawnPoint: { x, y },
    xPlane: { min, max },
}: SpawnDinoOptions) => {
    const internalStats = {
        poop: 0,
        energy: MAX_ENERGY,
    };
    const scaleNormalized = BASE_SCALE * scale;
    let isNewlyDiscovered = false;
    let direction = 1;
    const animationQueue: Array<() => Promise<unknown>> = [];


    const character = await createDinoSpine();
    character.scale.set(scaleNormalized);
    character.state.data.defaultMix = 0.3;
    character.skeleton.x = 0;
    character.skeleton.y = 0;
    character.eventMode = 'dynamic';
    character.x = x;
    character.y = y + 2;
    character.skeleton.setSkinByName('Green');
    character.state.setAnimation(0, 'Idle', true);

    const shadow = new Graphics();
    shadow.beginFill(0x000000);
    shadow.drawEllipse(0, 0, 50, 5);
    shadow.endFill();
    shadow.alpha = 0.25;
    shadow.x = x;
    shadow.y = y - 18 * scaleNormalized;

    const flipCharacter = (character: Spine, newDirection: CharacterDirection) => {
        return new Promise((resolve) => {
            const animationTrack = character.state.setAnimation(0, 'Turn', false);
            const duration = character.state.data.skeletonData.findAnimation('Turn')?.duration;

            const midpointMs = (duration! * 1000) / 2 - 200; //200ms was reccomended by the animator
            const timeout = setTimeout(() => {
                character.scale.x = scaleNormalized * newDirection;
                direction = newDirection;
                clearTimeout(timeout);
            }, midpointMs);
            animationTrack.listener = {
                complete: () => {
                    resolve(true);
                },
            };
        });
    };

    const playMoveToAnimation = async ({
        xLocation,
        animation,
        onComplete,
    }: {
        xLocation: number;
        animation: MoveToAnimation;
        onComplete?: () => void;
    }): Promise<void> => {
        let energyDrainFactor = 1; //DEFAULT WALK
        let movementSpeedFactor = 1.3; //DEFAULT WALK
        if (animation === 'Sneak') {
            movementSpeedFactor = 1;
            energyDrainFactor = 0.25;
        }
        if (animation === 'Run') {
            movementSpeedFactor = 6.5;
            energyDrainFactor = 2;
        }
        const newDirection = xLocation > character.x ? 1 : -1;
        if (newDirection !== direction) {
            await flipCharacter(character, newDirection);
            direction = newDirection;
        }
        return new Promise<void>((resolve) => {
            character.state.setAnimation(0, animation, true);
            const ticker = Ticker.shared;
            const onTick = () => {
                character.x += newDirection * movementSpeedFactor * scale;
                shadow.x += newDirection * movementSpeedFactor * scale;
                const reached = newDirection > 0 ? character.x >= xLocation : character.x <= xLocation;
                if (reached) {
                    internalStats.energy = internalStats.energy - energyDrainFactor;
                    direction = newDirection;
                    character.x = xLocation;
                    shadow.x = xLocation;
                    if (onComplete) {
                        onComplete();
                    }
                    resolveAnimation();
                }
            };
            const resolveAnimation = () => {
                window.removeEventListener(CANCEL_ANIMATION_EVENT, resolveAnimation);
                ticker.remove(onTick);
                resolve();
            };
            window.addEventListener(CANCEL_ANIMATION_EVENT, resolveAnimation);
            ticker.add(onTick);
        });
    };

    const playFixedTimeAnimation = async ({
        animation,
        onComplete,
    }: {
        onComplete?: () => void;
        animation: FixedTimeAnimation;
    }) => {
        return new Promise((resolve) => {
            const animationTrack = character.state.setAnimation(0, animation, false);
            const resolveAnimation = () => {
                window.removeEventListener(CANCEL_ANIMATION_EVENT, resolveAnimation);
                if (onComplete) {
                    onComplete();
                }
                resolve(null);
            };
            animationTrack.listener = {
                complete: () => {
                    resolveAnimation();
                },
            };
            window.addEventListener(CANCEL_ANIMATION_EVENT, resolveAnimation);
        });
    };

    const playDynamicTimeAnimation = async ({
        duration,
        animation,
        onComplete,
    }: {
        onComplete?: () => void;
        duration: number;
        animation: DynamicTimedAnimation;
    }) => {
        return new Promise<void>((resolve) => {
            const ticker = Ticker.shared;
            let elapsed = 0;
            const resolveAnimation = () => {
                window.removeEventListener(CANCEL_ANIMATION_EVENT, resolveAnimation);
                ticker.remove(sleepTick);
                if (onComplete) {
                    onComplete();
                }
                resolve();
            };
            character.state.setAnimation(0, animation, true);
            const sleepTick = () => {
                elapsed += ticker.deltaMS;
                if (elapsed >= duration * 1000) {
                    resolveAnimation();
                }
            };
            window.addEventListener(CANCEL_ANIMATION_EVENT, resolveAnimation);
            ticker.add(sleepTick);
        });
    };

    const startAi = () => {
        const pickAndRunAction = async () => {
            if (internalStats.energy < 3) {
                const shouldSleep = !!getRandomInt(0, 1);
                if (shouldSleep) {
                    animationQueue.push(() =>
                        playFixedTimeAnimation({
                            animation: 'To Sleep',
                        })
                    );
                    animationQueue.push(() =>
                        playDynamicTimeAnimation({
                            animation: 'Sleep',
                            duration: MAX_ENERGY - internalStats.energy,
                        })
                    );
                    animationQueue.push(() =>
                        playFixedTimeAnimation({
                            animation: 'Get Up',
                            onComplete: () => {
                                internalStats.energy = MAX_ENERGY;
                            },
                        })
                    );
                    pickAndRunAction();
                }
            }

            const actionType = getRandomInt(0, 4);
            const targetX = getRandomInt(min, max);
            switch (actionType) {
                case 0:
                    animationQueue.push(() => playMoveToAnimation({ animation: 'Walk', xLocation: targetX }));
                    break;
                case 1:
                    animationQueue.push(() => playMoveToAnimation({ animation: 'Run', xLocation: targetX }));
                    break;
                case 2: {
                    animationQueue.push(() =>
                        playMoveToAnimation({ animation: 'Sneak', xLocation: targetX })
                    );
                    break;
                }
                case 3: {
                    animationQueue.push(() => playFixedTimeAnimation({ animation: 'Raor' })); //Animators typo XD
                    break;
                }
                case 4: {
                    animationQueue.push(() => playFixedTimeAnimation({ animation: 'Smelling' }));
                    break;
                }
                case 5: {
                    animationQueue.push(() =>
                        playDynamicTimeAnimation({ animation: 'Idle', duration: getRandomInt(3, 5) })
                    );
                    break;
                }
                case 6: {
                    animationQueue.push(() =>
                        playDynamicTimeAnimation({ animation: 'Idle Combat', duration: getRandomInt(3, 5) })
                    );
                    break;
                }
            }
            for (const animation of animationQueue) {
                await animation!();
            }
            animationQueue.length = 0;
            pickAndRunAction();
        };
        pickAndRunAction();
    };

    const toggleSelected = () => {
        console.log('88');
    };

    character.on('click', () => {
        useAbility();

    });


    character.on('mouseover', () => {
        canvasElement.style.cursor = 'pointer';
        canvasElement.style.pointerEvents = 'all';
    });

    character.on('mouseleave', () => {
        canvasElement.style.cursor = 'auto';
        canvasElement.style.pointerEvents = 'none';
    });

    const useAbility = async () => {
        window.dispatchEvent(new Event(CANCEL_ANIMATION_EVENT));
        character.eventMode = 'none';
        animationQueue.push(() => {
            abilityGlitch(character);
            return playFixedTimeAnimation({
                animation: 'Stomp',
                onComplete: () => {
                    character.eventMode = 'dynamic';
                },
            });
        });
    };

    return { shadow, startAi, character, toggleSelected, isNewlyDiscovered };
};
