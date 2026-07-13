import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';
import { SignIn } from './SignIn';

function mockAuth(over: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    displayName: 'Test',
    tenant: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...over,
  };
}

function renderWith(auth: AuthContextValue) {
  return render(
    <MemoryRouter>
      <AuthContext value={auth}>
        <SignIn />
      </AuthContext>
    </MemoryRouter>,
  );
}

describe('SignIn', () => {
  it('shows the branded CTA and starts the OIDC login on click', async () => {
    const auth = mockAuth();
    renderWith(auth);

    expect(screen.getByText(/one secure front door/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /sign in with aegis/i }));
    expect(auth.login).toHaveBeenCalledOnce();
  });
});
