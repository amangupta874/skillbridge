import { useEffect, useId, useRef } from 'react';

const focusableSelector = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]';

export default function Modal({ open, title, onClose, children, description, role = 'dialog', closeDisabled = false }) {
  const id = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  closeRef.current = closeDisabled ? null : onClose;

  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const page = opener?.closest('main');

    function focusableElements() {
      return Array.from(dialog.querySelectorAll(focusableSelector)).filter((element) =>
        element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden], [inert]') &&
        getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility === 'visible',
      );
    }

    function focusFirst() {
      (focusableElements()[0] || dialog).focus();
    }

    function handleKeyDown(event) {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
      }
      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      const activeIndex = elements.indexOf(document.activeElement);
      if (activeIndex === -1 || (event.shiftKey ? activeIndex === 0 : activeIndex === elements.length - 1)) {
        event.preventDefault();
        const target = event.shiftKey ? elements.at(-1) : elements[0];
        (target || dialog).focus();
      }
    }

    function handleFocus(event) {
      if (!dialog.contains(event.target)) focusFirst();
    }

    focusFirst();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
      if (opener?.isConnected && !opener.matches(':disabled')) {
        opener.focus();
      } else {
        page?.querySelector('h1')?.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeRef.current?.()}>
      <div ref={dialogRef} tabIndex={-1} role={role} aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl [overflow-wrap:anywhere]">
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-title`} className="text-lg font-semibold text-slate-900">{title}</h2>
          {role === 'dialog' && (
            <button type="button" aria-label="Close dialog" onClick={onClose} disabled={closeDisabled} className="rounded-sm text-slate-700 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600"><span aria-hidden="true">×</span></button>
          )}
        </div>
        {description && <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-slate-700">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
