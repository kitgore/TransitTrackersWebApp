// src/app/dashboard/page.tsx
import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import ShiftScheduler from '@/components/ShiftScheduler';

export default function DashboardPage() {
  return (
    <AppSidebar breadcrumb="Schedule">
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Dashboard</h1>
        <ShiftScheduler />
      </div>
    </AppSidebar>
  );
}
