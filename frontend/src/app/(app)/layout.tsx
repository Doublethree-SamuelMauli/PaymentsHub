"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { api } from "@/lib/api";
import { LoadingBlock } from "@/components/ui-custom/loading";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sbOpen, setSbOpen] = useState(false);

  useEffect(() => {
    if (!api.getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--background)]">
        <LoadingBlock label="Carregando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar open={sbOpen} onClose={() => setSbOpen(false)} />
      <div className="md:pl-64">
        <Topbar onOpenSidebar={() => setSbOpen(true)} />
        <main className="px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
