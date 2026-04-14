"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!api.getToken()) {
      router.push("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-400">Carregando...</div>;

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
