import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

function DialogExample({ confirm }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open settings</button>
      {confirm ? (
        <ConfirmDialog open={open} title="Remove request?" message="This removes your request." onConfirm={vi.fn()} onCancel={close} />
      ) : (
        <Modal open={open} title="Settings" onClose={close}>
          <button type="button">Done</button>
        </Modal>
      )}
    </>
  );
}

describe('Dialog keyboard controls', () => {
  it.each([
    [false, 'dialog', 'Settings', 'Close dialog', 'Done'],
    [true, 'alertdialog', 'Remove request?', 'Cancel', 'Confirm'],
  ])('traps focus and returns it to the opener on Escape (confirm = %s)', (confirm, role, name, firstName, lastName) => {
    render(<DialogExample confirm={confirm} />);
    const opener = screen.getByRole('button', { name: 'Open settings' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole(role, { name });
    const first = within(dialog).getByRole('button', { name: firstName });
    const last = within(dialog).getByRole('button', { name: lastName });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: 'Escape' });
    expect(screen.queryByRole(role)).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
