"use client";

import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export const LayoutWrapper = memo(function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const shouldShowSidebar = useMemo(() => {
    const isCreatePage = pathname === "/create";
    const isEditorPage = pathname?.includes("/admin/templates/") && pathname?.includes("/editor");
    return !isCreatePage && !isEditorPage;
  }, [pathname]);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50">{children}</main>
    </div>
  );
});

