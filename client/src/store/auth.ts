import { create } from 'zustand';

export interface UserInfo {
  id: number;
  username: string;
  displayId: string;
  role: 'user' | 'admin';
  email: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: UserInfo | null;
  initialized: boolean;
  setUser: (user: UserInfo | null) => void;
  setInitialized: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: () => set({ initialized: true }),
}));
