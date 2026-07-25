import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('portable arcade interface', () => {
  it('loads the play screen and launches a mock game', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText('Opening the arcade…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Pick your next adventure!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Keep playing/ }));
    expect(await screen.findByText('Mario 64 launch simulated.')).toBeInTheDocument();
  });

  it('navigates to the approved catalog and installs a game', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Pick your next adventure!' });
    await user.click(screen.getByRole('button', { name: 'Find games' }));
    expect(screen.getByRole('heading', { name: 'Discover something magical' })).toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: 'Add' });
    await user.click(addButtons[0]!);
    await waitFor(() => expect(screen.getByText('Captain Dynamo is ready to play.')).toBeInTheDocument(), { timeout: 10_000 });
  });

  it('keeps parent settings behind the demo PIN', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Pick your next adventure!' });
    await user.click(screen.getByRole('button', { name: 'Grown-ups' }));
    expect(screen.getByRole('heading', { name: 'Grown-ups only' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('PIN'), '2468');
    await user.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(screen.getByRole('heading', { name: 'Arcade settings' })).toBeInTheDocument();
  });
});
