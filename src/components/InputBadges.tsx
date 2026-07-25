import { Gamepad2, Keyboard, Mouse } from 'lucide-react';
import type { InputKind } from '../api';

const definitions = {
  controller: { label: 'Controller', Icon: Gamepad2 },
  keyboard: { label: 'Keyboard', Icon: Keyboard },
  mouse: { label: 'Mouse', Icon: Mouse },
};

export function InputBadges({ inputs }: { inputs: InputKind[] }) {
  return (
    <div className="input-badges" aria-label={`Inputs: ${inputs.join(', ')}`}>
      {inputs.map((input) => {
        const { label, Icon } = definitions[input];
        return (
          <span className="input-badge" key={input} title={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

