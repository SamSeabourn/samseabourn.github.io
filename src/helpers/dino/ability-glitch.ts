import { GlitchFilter } from 'pixi-filters';
import { Spine } from '@esotericsoftware/spine-pixi-v7';

import { getRandomInt } from './get-random-int';

let elements = [] as unknown as NodeListOf<Element>;

export const abilityGlitch = (character: Spine) => {
    const timeout = setTimeout(() => {
        const STYLE_ID = '___glitch_effect_🦖';

        const injectStyle = () => {
            if (document.getElementById(STYLE_ID)) return;

            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
    @keyframes __glitchin {
      0% {
        opacity: 1;
        transform: translate(0px, 0px);
      }
      49% {
        opacity: 1;
        transform: translate(0px, 0px);
      }
      50% {
        opacity: 0.3;
        transform: translate(-0.5px, 0.5px) rotate(5deg);
      }
      100% {
        opacity: 1;
        transform: translate(0.5px, -0.5px) rotate(-5deg);
      }
    }
  `;
            document.head.appendChild(style);
        };
        injectStyle();

        if (elements.length === 0) {
            elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, li, a');
        }

        elements.forEach((e) => {
            const text = e.textContent;
            if (!text || text.length < 1) return;

            const index = Math.floor(Math.random() * text.length);
            const charToGlitch = text[index];

            const span = document.createElement('span');
            span.textContent = getRandomInt(0, 3) === 0 ? '█' : charToGlitch;
            span.style.fontWeight = '900';
            span.style.animation = `__glitchin ${getRandomInt(200, 3000)}ms infinite alternate ease-in-out`;
            span.style.willChange = 'opacity, transform';

            const before = text.slice(0, index);
            const after = text.slice(index + 1);

            e.innerHTML = `${before}${span.outerHTML}${after}`;
        });

        const glitchFilter = new GlitchFilter({
            offset: 10,
            seed: getRandomInt(0, 999),
            slices: getRandomInt(0, 20),
        });
        character.filters = [glitchFilter];
        clearTimeout(timeout);
    }, 600); //STOMP CONTACT DELAY
};
