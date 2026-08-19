"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, ShoppingCart,
  BarChart3, CalendarDays, Settings, GraduationCap, LogOut, AlertTriangle,
} from "lucide-react";
import { orders } from "@/lib/data";

const nav = [
  { label: "Dashboard",   href: "/",             icon: LayoutDashboard },
  { label: "Students",    href: "/students",     icon: Users },
  { label: "Courses",     href: "/courses",      icon: BookOpen },
  { label: "Orders",      href: "/orders",       icon: ShoppingCart },
  { label: "Analytics",   href: "/analytics",    icon: BarChart3 },
  { label: "Exam Dates",  href: "/exam-dates",   icon: CalendarDays },
  { label: "Accountant",  href: "/accountant",   icon: AlertTriangle },
  { label: "Settings",    href: "/settings",     icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const overdueCount = orders.filter(o => (o.installmentPlan?.overdueDays ?? 0) > 0).length;

  return (
    <aside
      className="print-hide flex flex-col w-60 shrink-0 h-screen overflow-y-auto"
      style={{ background: "#0F1D3E" }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#2E4A97" }}
          >
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ConfiDentist</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "#334155" }}>
          Main Menu
        </p>
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          const isAccountant = href === "/accountant";
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background:  active ? "#1B2E5E" : "transparent",
                color:       active ? "#FFFFFF"  : isAccountant && overdueCount > 0 ? "#FCA5A5" : "#94A3B8",
              }}
            >
              <Icon size={17} />
              {label}
              {isAccountant && overdueCount > 0 && !active && (
                <span
                  className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{ background: "#DC2626", color: "#fff" }}
                >
                  {overdueCount}
                </span>
              )}
              {active && !isAccountant && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "#4C9BE8" }}
                />
              )}
              {active && isAccountant && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "#FCA5A5" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "#2E4A97" }}
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">Admin</p>
            <p className="text-xs truncate" style={{ color: "#475569" }}>admin@confidentist.ca</p>
          </div>
        </div>
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
          style={{ color: "#64748B" }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
