'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { NavUser } from '@/components/nav-user';
import Link from 'next/link';
import {
  Settings,
  Calendar,
  BookUser,
  MessageSquare,
  ClipboardList,
  Bus,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

interface SidebarProps {
  children: React.ReactNode;
}

const adminOnlyNavigationItems = [
  { name: 'Schedule', url: '/dashboard-admin', icon: Calendar },
  { name: 'Driver Messaging', url: '/messaging', icon: MessageSquare },
  { name: 'Manage Drivers', url: '/users', icon: BookUser },
  { name: 'Manage Vehicles', url: '/admin', icon: Bus },
  { name: 'Manage Roles', url: '/roles', icon: ClipboardList },
  { name: 'Schedule Builder', url: '/schedule-builder', icon: Calendar },
];

const userOnlyNavigationItems = [
  { name: 'Schedule', url: '/dashboard', icon: Calendar },
  { name: 'View My Shifts', url: '/my-shifts', icon: ClipboardList },
];

const sharedNavigationItems = [
  { name: 'User Settings', url: '/account', icon: Settings },
];

export function AppSidebar({ children }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || 'driver');
          setProfile(userData);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user || !profile) return null;

  const navigationItems =
    role === 'admin'
      ? [...adminOnlyNavigationItems, ...sharedNavigationItems]
      : [...userOnlyNavigationItems, ...sharedNavigationItems];

  const fullName = `${profile.firstName || 'User'} ${
    profile.lastName || ''
  }`.trim();
  const initials = `${(profile.firstName || ' ')[0]}${
    (profile.lastName || ' ')[0]
  }`.toUpperCase();

  const userData = {
    name: fullName,
    email: user.email || '',
    avatar: profile.avatarUrl || `/avatars/default.jpg`,
    initials: initials,
  };

  if (role === 'admin') {
    return (
      <SidebarProvider>
        <TooltipProvider>
          <Sidebar>
            <SidebarHeader className="h-16 border-b border-sidebar-border">
              <NavUser user={userData} />
            </SidebarHeader>
            <SidebarContent>
              <SidebarSeparator className="mx-0" />
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black px-4 py-2"
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </SidebarContent>
            <SidebarFooter />
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <main className="flex h-screen flex-col">
              {children}
            </main>
          </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full border-b bg-white shadow-sm">
        <div className="flex flex-wrap justify-between items-center px-4 py-3 max-w-screen-xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </div>
          <NavUser user={userData} />
        </div>
      </header>

      <main className="flex-1 p-4 max-w-screen-xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
