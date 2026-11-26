export default function Card({ children, className = '', as: Element = 'div', ...props }) {
  return (
    <Element
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </Element>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 space-y-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h2 className={`text-lg font-bold text-slate-900 tracking-tight ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-slate-700 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

