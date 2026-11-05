import { createContext, useContext, useState, useCallback, useId } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const baseId = useId();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = 'info', duration = 3500 }) => {
      const id = `${baseId}-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [baseId, removeToast],
  );

  const value = {
    toast: showToast,
    success: (msg, duration) => showToast({ message: msg, type: 'success', duration }),
    error: (msg, duration) => showToast({ message: msg, type: 'error', duration }),
    info: (msg, duration) => showToast({ message: msg, type: 'info', duration }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm shadow-md transition-all border flex items-center justify-between gap-3 ${
              t.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : t.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <p className="font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-current opacity-70 hover:opacity-100 font-bold ml-2"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

