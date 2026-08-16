import Link from "next/link";

export default function Paginacion({
  total,
  limit,
  offset,
  basePath,
  searchParams,
}: {
  total: number;
  limit: number;
  offset: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;
  const paginaActual = Math.floor(offset / limit) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / limit));

  function hrefConOffset(nuevoOffset: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("offset", String(nuevoOffset));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-between text-sm">
      <span className="text-muted">
        Página {paginaActual} de {totalPaginas} · {total} resultados
      </span>
      <div className="flex gap-2">
        <Link
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? undefined : -1}
          className={`rounded-full border border-border px-3.5 py-1.5 font-medium transition-colors ${
            hasPrev
              ? "text-foreground hover:bg-brand-100"
              : "pointer-events-none text-muted opacity-40"
          }`}
          href={hrefConOffset(Math.max(0, offset - limit))}
        >
          ← Anterior
        </Link>
        <Link
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={`rounded-full border border-border px-3.5 py-1.5 font-medium transition-colors ${
            hasNext
              ? "text-foreground hover:bg-brand-100"
              : "pointer-events-none text-muted opacity-40"
          }`}
          href={hrefConOffset(offset + limit)}
        >
          Siguiente →
        </Link>
      </div>
    </nav>
  );
}
