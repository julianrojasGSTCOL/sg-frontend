"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconSearch } from "@/components/ui/icons";

const ENLACES = [
  { href: "/", label: "Panel", icon: IconHome },
  { href: "/contratos", label: "Buscar", icon: IconSearch },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
      <Link href="/" className="text-sm font-semibold text-foreground">
        SECOP Guardian
      </Link>
      <nav className="flex gap-1 text-sm font-medium">
        {ENLACES.map((enlace) => {
          const activo =
            enlace.href === "/" ? pathname === "/" : pathname.startsWith(enlace.href);
          const Icono = enlace.icon;
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
                activo ? "bg-brand-solid text-white" : "text-muted"
              }`}
            >
              <Icono className="h-4 w-4" />
              {enlace.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
