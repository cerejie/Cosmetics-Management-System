import { create } from 'zustand';

interface LayoutState {
  /** Below `lg` the sidebar is a drawer instead of a fixed rail. */
  readonly mobileNavOpen: boolean;
  readonly openMobileNav: () => void;
  readonly closeMobileNav: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));
