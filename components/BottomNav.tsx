'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/log', label: 'Log' },
  { href: '/week', label: 'Week' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-neutral-200 bg-white">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-4 text-center text-base font-medium ${
              active ? 'text-neutral-900' : 'text-neutral-400'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
