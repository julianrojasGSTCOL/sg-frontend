import {
  NIVEL_ALERTA_BORDE,
  NIVEL_ALERTA_LABEL,
  NIVEL_ALERTA_SOLIDO,
  NIVEL_ALERTA_SUAVE,
} from "@/lib/alerta";
import type { NivelAlerta } from "@/types/contrato";

export default function AlertaBadge({
  nivel,
  score,
}: {
  nivel: NivelAlerta | null;
  score?: number | null;
}) {
  if (!nivel) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted">
        <span className="h-2 w-2 rounded-full bg-border" />
        Sin analizar
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-foreground ${NIVEL_ALERTA_SUAVE[nivel]} ${NIVEL_ALERTA_BORDE[nivel]}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${NIVEL_ALERTA_SOLIDO[nivel]}`} />
      {NIVEL_ALERTA_LABEL[nivel]}
      {typeof score === "number" ? (
        <span className="text-muted">· {score}/100</span>
      ) : null}
    </span>
  );
}
