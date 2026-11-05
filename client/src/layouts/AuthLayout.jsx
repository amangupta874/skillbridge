import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="text-3xl font-extrabold text-indigo-600 tracking-tight">
          SkillBridge
        </Link>
        <p className="mt-2 text-sm text-slate-600">
          Student collaboration, peer skill exchange & team discovery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs rounded-xl border border-slate-200 sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

