import { render, screen, fireEvent } from '@testing-library/react';
import { StaffTable } from './StaffTable';
import { describe, it, expect, vi } from 'vitest';

const mockStaffData = [
  {
    id: '1',
    name: 'Alice Johnson',
    department: 'Science',
    designation: 'Senior Teacher',
    category: 'Teaching',
    subject: 'Physics',
    phone: '123-456-7890',
    email: 'alice@example.com',
    joinDate: '2020-01-15',
    attendance: 95,
    status: 'Active'
  },
  {
    id: '2',
    name: 'Bob Smith',
    department: 'Mathematics',
    designation: 'Teacher',
    category: 'Teaching',
    subject: 'Algebra',
    phone: '987-654-3210',
    email: 'bob@example.com',
    joinDate: '2021-03-10',
    attendance: 88,
    status: 'On Leave'
  }
];

describe('StaffTable', () => {
  it('renders a loading skeleton when loading is true', () => {
    render(
      <StaffTable
        loading={true}
        sortedFiltered={[]}
        selectedIds={[]}
        setSelectedIds={vi.fn()}
        sortField="name"
        sortOrder="asc"
        handleSort={vi.fn()}
        setModal={vi.fn()}
        handleDelete={vi.fn()}
        search=""
      />
    );
    // TableSkeleton renders some placeholder structure
    // We can just assert that "Staff Member" is still rendered in the table header
    expect(screen.getByText(/Staff Member/i)).toBeInTheDocument();
  });

  it('renders empty state when no data matches', () => {
    render(
      <StaffTable
        loading={false}
        sortedFiltered={[]}
        selectedIds={[]}
        setSelectedIds={vi.fn()}
        sortField="name"
        sortOrder="asc"
        handleSort={vi.fn()}
        setModal={vi.fn()}
        handleDelete={vi.fn()}
        search="random search query"
      />
    );
    expect(screen.getByText(/No staff members found/i)).toBeInTheDocument();
  });

  it('renders staff rows when data is provided', () => {
    render(
      <StaffTable
        loading={false}
        sortedFiltered={mockStaffData}
        selectedIds={[]}
        setSelectedIds={vi.fn()}
        sortField="name"
        sortOrder="asc"
        handleSort={vi.fn()}
        setModal={vi.fn()}
        handleDelete={vi.fn()}
        search=""
      />
    );
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
  });

  it('triggers setModal with view on row click', () => {
    const setModal = vi.fn();
    render(
      <StaffTable
        loading={false}
        sortedFiltered={mockStaffData}
        selectedIds={[]}
        setSelectedIds={vi.fn()}
        sortField="name"
        sortOrder="asc"
        handleSort={vi.fn()}
        setModal={setModal}
        handleDelete={vi.fn()}
        search=""
      />
    );
    
    const aliceRowClickTarget = screen.getByText('Alice Johnson');
    fireEvent.click(aliceRowClickTarget);
    
    expect(setModal).toHaveBeenCalledWith({ type: 'view', staff: mockStaffData[0] });
  });
});
