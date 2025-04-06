'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '@/src/firebase/config';
import { doc, getDoc } from "firebase/firestore";
import { NavUser } from "@/components/nav-user";
import { NavItems } from "@/components/nav-items";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Calendar,
  BookUser,
  MessageSquare,
  ClipboardList
} from "lucide-react";
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
} from "@/components/ui/sidebar";

interface SidebarProps {
  children: React.ReactNode;
}

const allNavigationItems = [
  {
    name: "Schedule",
    url: "/dashboard",
    icon: Calendar,
  },
  {
    name: "Driver Messaging",
    url: "/messaging",
    icon: MessageSquare,
    requiresAdmin: true,
  },
  {
    name: "Manage Drivers",
    url: "/users",
    icon: BookUser,
    requiresAdmin: true,
  },
  {
    name: "Administrator Panel",
    url: "/admin",
    icon: Shield,
    requiresAdmin: true,
  },
  {
    name: "Role Management",
    url: "/roles",
    icon: ClipboardList,
    requiresAdmin: true,
  }
];

export function AppSidebar({ children }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role || "driver"); // Default to 'driver' if role is missing
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return null;
  }

  // Filter navigation items based on role
  const filteredNavigationItems = allNavigationItems.filter(
    (item) => !item.requiresAdmin || role === "admin"
  );

  const userData = {
    name: user.displayName || 'User',
    email: user.email || '',
    avatar: user.photoURL || '/avatars/default.jpg',
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="h-16 border-b border-sidebar-border">
          <NavUser user={userData} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarSeparator className="mx-0" />
          <NavItems items={filteredNavigationItems} />
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
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
