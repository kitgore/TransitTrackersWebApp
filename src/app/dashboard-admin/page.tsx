// src/app/dashboard/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import GanttChartPage from '@/components/admin-schedule';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-admin users
    if (!loading && (!user || role !== "admin")) {
      router.push('/dashboard');
    }
  }, [user, loading, role, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <AppSidebar>
      <div className="container mx-auto p-4 flex flex-col h-screen">
        <div className="flex-grow h-[80vh]">
          <GanttChartPage />
        </div>
      </div>
    </AppSidebar>
  );
}
