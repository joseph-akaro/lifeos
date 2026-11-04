export interface NavItem { href: string; icon: string; label: string; key: string; admin?: boolean }

export const NAV: NavItem[] = [
  { href: '/', icon: '🏠', label: 'Home', key: 'h' },
  { href: '/quests', icon: '⚔️', label: 'Quests', key: 'q' },
  { href: '/time', icon: '⏱️', label: 'Time', key: 't' },
  { href: '/money', icon: '💰', label: 'Money', key: 'm' },
  { href: '/skills', icon: '🧠', label: 'Skills', key: 's' },
  { href: '/career', icon: '💼', label: 'Career', key: 'c' },
  { href: '/rewards', icon: '🏆', label: 'Rewards', key: 'r' },
  { href: '/admin', icon: '🛡️', label: 'Admin', key: 'a', admin: true },
];
