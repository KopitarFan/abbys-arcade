import { useEffect } from 'react';
import type { ControllerInfo, SystemStatus } from '../api';

const controllerProfile = (name: string): ControllerInfo['profile'] => {
  const normalized = name.toLowerCase();
  if (normalized.includes('playstation') || normalized.includes('dualshock') || normalized.includes('dualsense') || normalized.includes('wireless controller')) {
    return 'playstation';
  }
  if (normalized.includes('xbox') || normalized.includes('xinput')) return 'xbox';
  return 'generic';
};

export function useDesktopControllers(setStatus: React.Dispatch<React.SetStateAction<SystemStatus>>) {
  useEffect(() => {
    if (!window.arcadeDesktop || typeof navigator.getGamepads !== 'function') return;

    const refresh = () => {
      const controllers = Array.from(navigator.getGamepads())
        .filter((gamepad): gamepad is Gamepad => gamepad !== null)
        .map((gamepad) => ({
          id: `${gamepad.index}:${gamepad.id}`,
          name: gamepad.id || `Controller ${gamepad.index + 1}`,
          connected: gamepad.connected,
          profile: controllerProfile(gamepad.id),
        }));
      setStatus((current) => ({ ...current, controllers }));
    };

    refresh();
    window.addEventListener('gamepadconnected', refresh);
    window.addEventListener('gamepaddisconnected', refresh);
    return () => {
      window.removeEventListener('gamepadconnected', refresh);
      window.removeEventListener('gamepaddisconnected', refresh);
    };
  }, [setStatus]);
}
