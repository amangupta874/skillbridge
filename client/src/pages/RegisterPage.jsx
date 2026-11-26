import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { registerSchema } from '../schemas/auth.schema.js';
import { fieldErrorsFromApiError } from '../api/client.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import usePageTitle from '../utils/usePageTitle.js';

export default function RegisterPage() {
  usePageTitle('Register');
  const { user, register: authRegister } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  if (user) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await authRegister(values);
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h1>
        <p className="mt-2 text-sm text-slate-700">Find student projects and teammates, or trade skills with another student.</p>
        <p className="mt-1 text-sm text-slate-700">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-700 underline hover:text-indigo-900">
            Sign in
          </Link>
        </p>
      </div>

      {serverError && <ErrorBanner error={serverError} onRetry={isSubmitting ? undefined : handleSubmit(onSubmit)} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          id="register-fullname"
          label="Full Name"
          type="text"
          autoComplete="name"
          required
          placeholder="Alice Student"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          id="register-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          placeholder="alice@college.edu"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint="8–72 characters, must include at least one letter and one number"
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
          Create account
        </Button>
      </form>
    </div>
  );
}

