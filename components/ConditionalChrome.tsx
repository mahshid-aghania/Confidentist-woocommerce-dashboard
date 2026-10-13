"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The dashboard chrome (sidebar + header) wraps every route. /wc-orders is the
// WooCommerce-admin Orders replica: it keeps the sidebar/header for navigation
// but renders in a padding-less, white content area so the toolbar and table
// stay full-width (edge-to-edge) inside the main region.
export default function ConditionalChrome({
  sidebar,
  header,
  children,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const fullBleed = pathname.startsWith("/wc-orders");

  return (
    <>
      {sidebar}
      <div className="flex flex-col flex-1 overflow-hidden">
        {header}
        <main className={`flex-1 overflow-y-auto ${fullBleed ? "bg-white" : "p-6"}`}>
          {children}
        </main>
      </div>
    </>
  );
}
