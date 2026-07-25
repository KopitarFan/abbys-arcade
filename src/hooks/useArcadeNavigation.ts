import { useEffect, useRef } from 'react';

const focusables = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-arcade-focus]:not([disabled])')).filter(
    (element) => element.offsetParent !== null,
  );

const moveFocus = (direction: 1 | -1) => {
  const items = focusables();
  if (!items.length) return;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = current < 0 ? 0 : (current + direction + items.length) % items.length;
  items[next]?.focus();
};

export function useArcadeNavigation(onBack: () => void) {
  const previousButtons = useRef<boolean[]>([]);
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(1);
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(-1);
      }
      if (event.key === 'Escape') backRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let frame = 0;
    const poll = () => {
      const gamepad = navigator.getGamepads?.()[0];
      if (gamepad) {
        const pressed = gamepad.buttons.map((button) => button.pressed);
        const justPressed = (index: number) => pressed[index] && !previousButtons.current[index];
        if (justPressed(13) || justPressed(15)) moveFocus(1);
        if (justPressed(12) || justPressed(14)) moveFocus(-1);
        if (justPressed(0) && document.activeElement instanceof HTMLElement) document.activeElement.click();
        if (justPressed(1)) backRef.current();
        previousButtons.current = pressed;
      }
      frame = window.requestAnimationFrame(poll);
    };
    frame = window.requestAnimationFrame(poll);
    return () => window.cancelAnimationFrame(frame);
  }, []);
}

