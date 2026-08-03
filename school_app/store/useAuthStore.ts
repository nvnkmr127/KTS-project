import { create } from 'zustand';

export type UserRole = 'super_admin' | 'admin_staff' | 'teacher' | 'parent' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  studentId?: string; // If student
  children?: { id: string; name: string; class: string; avatar?: string }[]; // If parent
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  activeChildId: string | null;
  isDarkMode: boolean;
  isOnboarded: boolean;
  login: (email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  setOnboarded: (val: boolean) => void;
  switchChild: (childId: string) => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  activeChildId: null,
  isDarkMode: false,
  isOnboarded: false,
  login: async (email, role) => {
    // Simulating authentication delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    let name = "Guest User";
    let children: User['children'] = [];
    let activeChildId = null;

    if (role === 'super_admin') name = "Principal Sharma";
    else if (role === 'admin_staff') name = "Sarah (Admin Staff)";
    else if (role === 'teacher') name = "Ms. Priya Reddy";
    else if (role === 'parent') {
      name = "Ramesh";
      children = [
        { id: "stud_001", name: "Vamshi", class: "Grade 8-A", avatar: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=120" },
        { id: "stud_002", name: "Sneha", class: "Grade 5-B", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120" }
      ];
      activeChildId = children[0].id;
    }

    set({
      user: {
        id: `usr_${Math.floor(Math.random() * 1000)}`,
        name,
        email,
        role,
        children,
        phone: "+1 (555) 019-2834",
        avatar: role === 'guest' ? undefined : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120",
      },
      isAuthenticated: true,
      activeChildId,
    });
    return true;
  },
  logout: () => set({ user: null, isAuthenticated: false, activeChildId: null }),
  setOnboarded: (val) => set({ isOnboarded: val }),
  switchChild: (childId) => set({ activeChildId: childId }),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
