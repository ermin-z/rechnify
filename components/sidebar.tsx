"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/kunden", label: "Kunden" },
  { href: "/rechnungen", label: "Rechnungen" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-gray-200 bg-white px-3 py-6">
      <div className="px-3 mb-8">
        <span className="text-lg font-bold tracking-tight text-gray-900">
          Rechnify
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
