import { NIVEL_ALERTA_LABEL, NIVEL_ALERTA_SOLIDO } from "@/lib/alerta";
import { formatNumero } from "@/lib/format";

export default function RiesgoBar({
  bajo,
  medio,
  alto,
}: {
  bajo: number;
  medio: number;
  alto: number;
}) {
  const total = bajo + medio + alto;
  const segmentos = [
    { nivel: "bajo" as const, valor: bajo },
    { nivel: "medio" as const, valor: medio },
    { nivel: "alto" as const, valor: alto },
  ];

  return (
    <div>
      <div className="flex h-4 gap-[2px] overflow-hidden rounded-full bg-surface">
        {total === 0 ? (
          <div className="h-full w-full rounded-full bg-border" />
        ) : (
          segmentos
            .filter((s) => s.valor > 0)
            .map((s) => (
              <div
                key={s.nivel}
                title={`${NIVEL_ALERTA_LABEL[s.nivel]}: ${formatNumero(s.valor)}`}
                className={NIVEL_ALERTA_SOLIDO[s.nivel]}
                style={{ width: `${(s.valor / total) * 100}%` }}
              />
            ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {segmentos.map((s) => (
          <span key={s.nivel} className="inline-flex items-center gap-1.5 text-muted">
            <span className={`h-2 w-2 rounded-full ${NIVEL_ALERTA_SOLIDO[s.nivel]}`} />
            <span className="font-medium text-foreground">{formatNumero(s.valor)}</span>
            {NIVEL_ALERTA_LABEL[s.nivel].toLowerCase()}
            {total > 0 ? (
              <span>({Math.round((s.valor / total) * 100)}%)</span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
