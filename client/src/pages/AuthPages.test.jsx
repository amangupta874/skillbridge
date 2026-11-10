import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import * as AuthContextModule from '../context/AuthContext.jsx';
import { ApiError } from '../api/client.js';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

describe('Auth Pages', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginPage', () => {
    beforeEach(() => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        isLoading: false,
        login: mockLogin,
      });
    });

    it('shows validation errors when submitting empty form', async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const submitBtn = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'not-an-email' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('displays server error banner when login returns 401', async () => {
      mockLogin.mockRejectedValueOnce(
        new ApiError({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        }),
      );

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@college.edu' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
      });
    });

    it('maps server field error details to form fields', async () => {
      mockLogin.mockRejectedValueOnce(
        new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            'body.email': ['Account is deactivated'],
          },
        }),
      );

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@college.edu' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Account is deactivated')).toBeInTheDocument();
      });
    });

    it('calls login and redirects on valid submission', async () => {
      mockLogin.mockResolvedValueOnce({ id: 1, email: 'student@college.edu' });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Dashboard Destination</div>} />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'student@college.edu' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'validPassword1' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'student@college.edu',
          password: 'validPassword1',
        });
        expect(screen.getByText('Dashboard Destination')).toBeInTheDocument();
      });
    });
  });

  describe('RegisterPage', () => {
    beforeEach(() => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        isLoading: false,
        register: mockRegister,
      });
    });

    it('validates password letter and number requirement', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Bob Student' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'bob@college.edu' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'lettersonly' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('maps duplicate email server conflict error to the email field', async () => {
      mockRegister.mockRejectedValueOnce(
        new ApiError({
          status: 409,
          code: 'DUPLICATE',
          message: 'Conflict',
          details: {
            'body.email': ['An account with this email already exists'],
          },
        }),
      );

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Bob Student' },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'duplicate@college.edu' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'secret123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('DashboardPage', () => {
    it('displays the user name prominently', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 1, fullName: 'Alice Student', email: 'alice@college.edu' },
      });

      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
      );

      expect(screen.getByTestId('dashboard-greeting')).toHaveTextContent('Welcome back, Alice Student!');
    });
  });
});

