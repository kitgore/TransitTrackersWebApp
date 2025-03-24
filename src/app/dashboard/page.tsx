// src/app/dashboard/page.tsx
import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import ShiftScheduler from '@/components/ShiftScheduler';
import GanttChartPage from '@/components/schedule'; // Assuming you have a Scheduler component

export default function DashboardPage() {
  return (
    <AppSidebar>
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Dashboard</h1>
        <GanttChartPage />
      </div>
    </AppSidebar>
  );
}
