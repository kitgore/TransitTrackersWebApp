import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardPage() {
  return (
    <AppSidebar breadcrumb="Schedule">
      <div className="grid auto-rows-min gap-4 md:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-muted/50" />
        ))}
      </div>
    </AppSidebar>
  );
}