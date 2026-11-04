export interface NavItem { href: string; icon: string; label: string; key: string; admin?: boolean }

export const NAV: NavItem[] = [
  { href: '/', icon: 'bx-home-alt-2', label: 'Home', key: 'h' },
  { href: '/quests', icon: 'bx-task', label: 'Quests', key: 'q' },
  { href: '/time', icon: 'bx-timer', label: 'Time', key: 't' },
  { href: '/money', icon: 'bx-wallet', label: 'Money', key: 'm' },
  { href: '/skills', icon: 'bx-brain', label: 'Skills', key: 's' },
  { href: '/career', icon: 'bx-briefcase', label: 'Career', key: 'c' },
  { href: '/rewards', icon: 'bx-trophy', label: 'Rewards', key: 'r' },
  { href: '/admin', icon: 'bx-shield-quarter', label: 'Admin', key: 'a', admin: true },
];
