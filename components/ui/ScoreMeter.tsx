import { NIVEL_ALERTA_SOLIDO, NIVEL_ALERTA_SUAVE } from "@/lib/alerta";
import type { NivelAlerta } from "@/types/contrato";

// El relleno carga la severidad; el track sin rellenar es el mismo tono en
// versión suave, para que el nivel se lea de un vistazo en toda la barra.
export default function ScoreMeter({
  score,
  nivel,
}: {
  score: number;
  nivel: NivelAlerta;
}) {
  const porcentaje = Math.max(0, Math.min(100, score));

  return (
    <div
      role="meter"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Puntaje de riesgo"
      className={`h-2 w-full overflow-hidden rounded-full ${NIVEL_ALERTA_SUAVE[nivel]}`}
    >
      <div
        className={`h-full rounded-full ${NIVEL_ALERTA_SOLIDO[nivel]}`}
        style={{ width: `${porcentaje}%` }}
      />
    </div>
  );
}
