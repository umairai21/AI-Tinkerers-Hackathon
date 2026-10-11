"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const links = [
  { href: "/", label: "Shop", isActive: (path: string) => path === "/" },
  // Covers both /orders and /order/[orderId].
  { href: "/orders", label: "My Orders", isActive: (path: string) => path.startsWith("/order") },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  const linkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
    }`;

  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 mr-auto">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white font-semibold text-sm shadow-sm shadow-indigo-500/30">
            OC
          </span>
          <span className="hidden sm:inline font-semibold text-slate-900">OrderCare</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.isActive(pathname))}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart" className={linkClass(pathname === "/cart")}>
            Cart
            {count > 0 && (
              <span className="ml-1.5 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-indigo-600 text-white text-xs">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
