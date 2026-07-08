import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StaffManagement } from './StaffManagement';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useApp: () => ({ user: { role: 'admin' }, leaveRequests: [] })
}));

vi.mock('../context/DialogContext', () => ({
  useDialog: () => ({
    alert: vi.fn(),
    confirm: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    getResources: vi.fn().mockResolvedValue([]),
    createResource: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
  },
  originalSetItem: vi.fn()
}));

describe('StaffManagement', () => {
  it('renders without crashing and shows add button', async () => {
    render(<StaffManagement />);
    
    // Check if the page title or 'Add Staff' button is present
    expect(screen.getByText('Total Staff')).toBeInTheDocument();
    
    // Check for Add Staff button
    const addButton = screen.getAllByText('Add Staff')[0];
    expect(addButton).toBeInTheDocument();
    
    // Check if it opens the modal
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Staff')).toBeInTheDocument();
    });
  });
});
