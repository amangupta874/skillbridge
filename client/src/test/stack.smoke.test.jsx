import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const schema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(8, 'At least 8 characters') });

function LoginForm({ onValid }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(onValid)}>
      <input aria-label="email" {...register('email')} />
      <p>{errors.email?.message}</p>
      <input aria-label="password" {...register('password')} />
      <p>{errors.password?.message}</p>
      <button type="submit">Log in</button>
    </form>
  );
}

test('react-hook-form + zod 4 resolver shows field errors', async () => {
  const user = userEvent.setup();
  render(<LoginForm onValid={() => {}} />);
  await user.type(screen.getByLabelText('email'), 'not-an-email');
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
});

function Page() { const { data } = useQuery({ queryKey: ['x'], queryFn: async () => 'loaded' }); return <p>{data ?? 'loading'}</p>; }

test('router v6 and TanStack Query v5 work together under React 18', async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/a']}>
        <Routes><Route path="/a" element={<><Page /><Link to="/b">go</Link></>} /><Route path="/b" element={<p>b page</p>} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText('loaded')).toBeInTheDocument();
  await userEvent.click(screen.getByText('go'));
  expect(screen.getByText('b page')).toBeInTheDocument();
});
