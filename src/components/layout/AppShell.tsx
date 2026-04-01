"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout, useSession } from "@/hooks/useSession";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/log", label: "Log", icon: "📝" },
  { href: "/planner", label: "Planner", icon: "📅" },
  { href: "/recipes", label: "Recipes", icon: "🍳" },
  { href: "/fridge", label: "Fridge", icon: "🧊" },
  { href: "/shopping", label: "Shopping", icon: "🛒" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <span className="text-lg font-bold text-green-600">Meal Planner</span>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>⚙️</span>
            Settings
          </Link>
          <div className="mt-2 flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{session?.name}</p>
              <p className="truncate text-xs text-gray-500">{session?.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 text-xs text-gray-400 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar — mobile only */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <span className="text-base font-bold text-green-600">Meal Planner</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session?.name}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="flex border-t border-gray-200 bg-white lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "text-green-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
