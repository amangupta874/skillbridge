import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPagePlaceholder() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new student account
          </Link>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Auth Page Foundation</p>
        <p className="mt-1">Full authentication form with validation arrives in Day 3 / Plan D4.</p>
      </div>
    </div>
  );
}

export function RegisterPagePlaceholder() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Registration Foundation</p>
        <p className="mt-1">Registration form with validation arrives in Day 3 / Plan D4.</p>
      </div>
    </div>
  );
}

export function DashboardPlaceholder() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user?.fullName ? `, ${user.fullName}` : ''}!
        </h1>
        <p className="mt-2 text-slate-600">
          Explore student projects, discover teammates with complementary skills, or set up a peer skill exchange.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
          <p className="mt-1 text-sm text-slate-500">Discover capstones and projects looking for contributors.</p>
          <div className="mt-4">
            <Link to="/projects">
              <Button variant="secondary" size="sm">Browse Projects</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-slate-900">Exchanges</h2>
          <p className="mt-1 text-sm text-slate-500">Connect with peers to teach and learn new technologies.</p>
          <div className="mt-4">
            <Link to="/exchanges">
              <Button variant="secondary" size="sm">View Exchanges</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-slate-900">People</h2>
          <p className="mt-1 text-sm text-slate-500">Find classmates with specific skill sets and interests.</p>
          <div className="mt-4">
            <Link to="/people">
              <Button variant="secondary" size="sm">Find People</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlaceholderPage({ title, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-slate-800">Page not found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

