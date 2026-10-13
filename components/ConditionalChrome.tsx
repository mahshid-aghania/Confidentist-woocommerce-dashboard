"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The dashboard chrome (sidebar + header) wraps every route via the root
// layout. The WooCommerce-admin Orders replica must render as a bare,
// full-bleed content area with no sidebar/header/nav, so we suppress the
// chrome for /wc-orders while leaving every other route untouched.
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
  const bare = pathname.startsWith("/wc-orders");

  if (bare) {
    return <div className="w-full h-screen overflow-y-auto bg-white">{children}</div>;
  }

  return (
    <>
      {sidebar}
      <div className="flex flex-col flex-1 overflow-hidden">
        {header}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </>
  );
}
