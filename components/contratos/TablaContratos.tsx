import Link from "next/link";
import AlertaBadge from "@/components/ui/AlertaBadge";
import { formatMoneda } from "@/lib/format";
import type { ContratoResumen } from "@/types/contrato";

export default function TablaContratos({
  contratos,
}: {
  contratos: ContratoResumen[];
}) {
  return (
    <div className="tarjeta overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-brand-100 text-left text-xs font-medium uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Contrato</th>
            <th scope="col" className="px-4 py-3">Entidad</th>
            <th scope="col" className="px-4 py-3">Contratista</th>
            <th scope="col" className="px-4 py-3">Tipo</th>
            <th scope="col" className="px-4 py-3">Valor</th>
            <th scope="col" className="px-4 py-3">Alerta</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contratos.map((contrato) => (
            <tr key={contrato.id} className="transition-colors hover:bg-brand-100/60">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{contrato.numeroContrato}</p>
                <p
                  className="max-w-xs truncate text-xs text-muted"
                  title={contrato.objeto}
                >
                  {contrato.objeto}
                </p>
              </td>
              <td className="px-4 py-3">{contrato.entidad ?? "—"}</td>
              <td className="px-4 py-3">{contrato.contratista ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{contrato.tipoContratacion}</td>
              <td className="px-4 py-3 [font-variant-numeric:tabular-nums]">
                {formatMoneda(contrato.valor)}
              </td>
              <td className="px-4 py-3">
                <AlertaBadge nivel={contrato.nivelAlerta} score={contrato.score} />
              </td>
              <td className="px-4 py-3">
                {contrato.estado ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                    {contrato.estado}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/contratos/${contrato.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Ver análisis →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
