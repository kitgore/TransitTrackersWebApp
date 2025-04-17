'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/firebase/config';
import { doc, getDoc } from "firebase/firestore";
import { NavUser } from "@/components/nav-user";
import { NavItems } from "@/components/nav-items";
import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, 
  SidebarRail, SidebarSeparator, SidebarInset, SidebarProvider 
} from "@/components/ui/sidebar";
import {
  Shield, Calendar, BookUser, MessageSquare, ClipboardList
} from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
}

const allNavigationItems = [
  { name: "Schedule", url: "/dashboard", icon: Calendar },
  { name: "Driver Messaging", url: "/messaging", icon: MessageSquare, requiresAdmin: true },
  { name: "Manage Drivers", url: "/users", icon: BookUser, requiresAdmin: true },
  { name: "Administrator Panel", url: "/admin", icon: Shield, requiresAdmin: true },
  { name: "Role Management", url: "/roles", icon: ClipboardList, requiresAdmin: true },
  { name: "User Settings", url: "/account", icon: BookUser },
  { name: "Notifications", url: "/notifications", icon: MessageSquare }
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

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || "driver");
          setProfile(userData);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user || !profile) return null;

  const filteredNavigationItems = allNavigationItems.filter(
    (item) => !item.requiresAdmin || role === "admin"
  );

  const fullName = `${profile.firstName || 'User'} ${profile.lastName || ''}`.trim();
  const initials = `${(profile.firstName || ' ')[0]}${(profile.lastName || ' ')[0]}`.toUpperCase();

  const userData = {
    name: fullName,
    email: user.email || '',
    avatar: profile.avatarUrl || `/avatars/default.jpg`,
    initials: initials
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
        <SidebarFooter />
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
