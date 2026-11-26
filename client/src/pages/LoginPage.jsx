import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginSchema } from '../schemas/auth.schema.js';
import { fieldErrorsFromApiError } from '../api/client.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import usePageTitle from '../utils/usePageTitle.js';

export default function LoginPage() {
  usePageTitle('Sign in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If already authenticated, redirect to destination or home
  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const sessionExpiredMessage = location.state?.message;

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      const fieldErrors = fieldErrorsFromApiError(error);
      const fieldKeys = Object.keys(fieldErrors);

      if (fieldKeys.length > 0) {
        fieldKeys.forEach((key) => {
          setError(key, { type: 'server', message: fieldErrors[key] });
        });
      } else {
        setServerError(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h1>
        <p className="mt-2 text-sm text-slate-700">Find student projects and teammates, or trade skills with another student.</p>
        <p className="mt-1 text-sm text-slate-700">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-700 underline hover:text-indigo-900">
            create a new student account
          </Link>
        </p>
      </div>

      {sessionExpiredMessage && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          {sessionExpiredMessage}
        </div>
      )}

      {serverError && <ErrorBanner error={serverError} onRetry={isSubmitting ? undefined : handleSubmit(onSubmit)} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          id="login-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          placeholder="student@college.edu"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}

