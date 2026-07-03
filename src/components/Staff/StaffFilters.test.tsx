import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffFilters } from './StaffFilters';
import { describe, it, expect, vi } from 'vitest';

describe('StaffFilters', () => {
  it('renders search input and all select filters', () => {
    const setSearch = vi.fn();
    const setDeptFilter = vi.fn();
    const setCatFilter = vi.fn();
    const setStatusFilter = vi.fn();
    const allCategories = ['Teaching', 'Non-Teaching'];

    render(
      <StaffFilters
        search=""
        setSearch={setSearch}
        deptFilter="All"
        setDeptFilter={setDeptFilter}
        catFilter="All"
        setCatFilter={setCatFilter}
        statusFilter="All"
        setStatusFilter={setStatusFilter}
        allCategories={allCategories}
      />
    );

    expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();
    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Teaching')).toBeInTheDocument();
  });

  it('calls setSearch when typing in the search box', async () => {
    const setSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <StaffFilters
        search=""
        setSearch={setSearch}
        deptFilter="All"
        setDeptFilter={vi.fn()}
        catFilter="All"
        setCatFilter={vi.fn()}
        statusFilter="All"
        setStatusFilter={vi.fn()}
        allCategories={[]}
      />
    );

    const input = screen.getByPlaceholderText(/Search by name/i);
    await user.type(input, 'John');
    expect(setSearch).toHaveBeenCalled();
  });
});
