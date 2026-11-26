export default function PageState({ title, children }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {children}
    </div>
  );
}
