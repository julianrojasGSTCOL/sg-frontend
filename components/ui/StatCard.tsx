import type { ReactNode } from "react";

const BADGE_CLASES = {
  neutral: "bg-brand-100 text-brand-700",
  bajo: "bg-alert-low-bg text-alert-low",
  medio: "bg-alert-medium-bg text-alert-medium",
  alto: "bg-alert-high-bg text-alert-high",
} as const;

export default function StatCard({
  etiqueta,
  valor,
  detalle,
  icono,
  tono = "neutral",
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono?: ReactNode;
  tono?: keyof typeof BADGE_CLASES;
}) {
  return (
    <div className="tarjeta p-4">
      <div className="flex items-center gap-2.5">
        {icono ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${BADGE_CLASES[tono]}`}
          >
            {icono}
          </span>
        ) : null}
        <p className="text-sm font-medium text-muted">{etiqueta}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{valor}</p>
      {detalle ? <p className="mt-1 text-xs text-muted">{detalle}</p> : null}
    </div>
  );
}
