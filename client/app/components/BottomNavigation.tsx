'use client';

import { useRouter, usePathname } from 'next/navigation';
import '@/styles/bottom-navigation.css';

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/events',
      icon: (active: boolean) => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={active ? 'currentColor' : 'none'}
            fillOpacity={active ? '0.2' : '0'}
          />
        </svg>
      ),
    },
    {
      id: 'events',
      label: 'My Events',
      path: '/event-hub',
      icon: (active: boolean) => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            ry="2"
            stroke="currentColor"
            strokeWidth="2"
            fill={active ? 'currentColor' : 'none'}
            fillOpacity={active ? '0.2' : '0'}
          />
          <line
            x1="16"
            y1="2"
            x2="16"
            y2="6"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="8"
            y1="2"
            x2="8"
            y2="6"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="3"
            y1="10"
            x2="21"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: (active: boolean) => (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
            fill={active ? 'currentColor' : 'none'}
            fillOpacity={active ? '0.2' : '0'}
          />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Only show navigation on specific pages
  const showNavigation = ['/events', '/event-hub', '/profile'].some(route => 
    pathname.startsWith(route)
  ) || pathname === '/';

  if (!showNavigation) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-lg border-t border-gray-800/50 px-6 pt-6 pb-4 z-50 bottom-navigation">
      <div className="flex justify-center gap-20 items-center max-w-[100%] mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex flex-col gap-3 items-center justify-center py-3 px-4 transition-all duration-300 transform ${
                active
                  ? 'text-[#F62585] scale-105'
                  : 'text-gray-500 hover:text-gray-300 hover:scale-105'
              }`}
            >
              <div className={`mb-2 transition-all duration-300 ${active ? 'drop-shadow-lg' : ''}`}>
                {item.icon(active)}
              </div>
              <span className={`text-xs font-medium transition-all duration-300 ${
                active ? 'font-semibold' : 'font-normal'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;