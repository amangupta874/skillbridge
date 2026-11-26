import Button from '../components/Button.jsx';
import usePageTitle from '../utils/usePageTitle.js';

export function NotFoundPage() {
  usePageTitle('Page not found');

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-extrabold text-slate-900">404 · Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-700">
        This page might have been moved or deleted.
      </p>
      <Button to="/" className="mt-6">Back to home</Button>
    </main>
  );
}
