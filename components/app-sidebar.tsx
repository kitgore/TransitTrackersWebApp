'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/src/firebase/config';
import { NavUser } from "@/components/nav-user";
import { DatePicker } from "@/components/date-picker";
import { NavItems } from "@/components/nav-items";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Calendar,
  BookUser,
  MessageSquare
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarSeparator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface SidebarProps {
  children: React.ReactNode;
  breadcrumb?: string;
}

const navigationItems = [
  {
    name: "Schedule",
    url: "/dashboard",
    icon: Calendar,
  },
  {
    name: "Driver Messaging",
    url: "/messaging",
    icon: MessageSquare,
  },
  {
    name: "Manage Drivers",
    url: "/users",
    icon: BookUser,
  },
  {
    name: "Administrator Panel",
    url: "/admin",
    icon: Shield,
  },
];

export function AppSidebar({ children }: Omit<SidebarProps, 'breadcrumb'>) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return null;
  }

  const userData = {
    name: user?.displayName || 'User',
    email: user?.email || '',
    avatar: user?.photoURL || '/avatars/default.jpg',
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="h-16 border-b border-sidebar-border">
          <NavUser user={userData} />
        </SidebarHeader>
        <SidebarContent>
          {/* <DatePicker /> */}
          <SidebarSeparator className="mx-0" />
          <NavItems items={navigationItems} />
        </SidebarContent>
        <SidebarFooter>
          {/* Footer content if needed */}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <main className="flex h-screen flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}