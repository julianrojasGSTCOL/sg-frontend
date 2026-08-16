"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconSearch } from "@/components/ui/icons";

const ENLACES = [
  { href: "/", label: "Panel", icon: IconHome },
  { href: "/contratos", label: "Buscar contratos", icon: IconSearch },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-7 w-7 shrink-0 text-brand-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6l7-3z"
            strokeLinejoin="round"
          />
          <path d="M9 12.2l2 2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <span className="block text-base font-semibold leading-tight tracking-tight text-foreground">
            SECOP Guardian
          </span>
          <span className="block text-xs leading-tight text-muted">
            Vigilancia ciudadana
          </span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1 px-3">
        {ENLACES.map((enlace) => {
          const activo =
            enlace.href === "/" ? pathname === "/" : pathname.startsWith(enlace.href);
          const Icono = enlace.icon;
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activo
                  ? "bg-brand-solid text-white shadow-sm"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icono className="h-5 w-5 shrink-0" />
              {enlace.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
