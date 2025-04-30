'use client';

import ScheduleBuilder from '@/components/schedule-builder';
import { AppSidebar } from '@/components/app-sidebar';

export default function ScheduleBuilderPage() {
  return (
    <AppSidebar>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Schedule Builder</h1>
        <ScheduleBuilder />
      </div>
    </AppSidebar>
  );
} 