// src/app/dashboard/page.tsx
import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import GanttChartPage from '@/components/user-schedule';

export default function DashboardPage() {
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
