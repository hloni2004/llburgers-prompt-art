import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Auth from './Auth';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(async () => ({ ok: true, role: 'CUSTOMER' })),
    register: vi.fn(async () => ({ ok: true, role: 'CUSTOMER' })),
  }),
}));

describe('Auth page', () => {
  it('renders the sign-in form without crashing', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
