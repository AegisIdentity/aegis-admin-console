import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the factory must be self-contained (no outer references).
vi.mock('../../api/endpoints', () => ({
  usersApi: {
    list: vi.fn().mockResolvedValue([
      { id: '1', tenantId: 'acme', username: 'alice', email: 'alice@acme.example', status: 'ACTIVE' },
      { id: '2', tenantId: 'acme', username: 'bob', email: 'bob@acme.example', status: 'LOCKED' },
    ]),
    create: vi.fn(),
  },
}));

import { Users } from './Users';

describe('Users page', () => {
  it('renders directory rows from the API', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Users />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
  });
});
