import Link from "next/link";
import { notFound } from "next/navigation";
import AlertaBadge from "@/components/ui/AlertaBadge";
import EstadoError from "@/components/ui/EstadoError";
import ScoreMeter from "@/components/ui/ScoreMeter";
import ChatContrato from "@/components/contratos/ChatContrato";
import { formatFecha, formatMoneda, formatNumero } from "@/lib/format";
import { getFichaContrato } from "@/server/contratos/getFichaContrato";
import type { ContratoDetalle } from "@/types/contrato";

export const maxDuration = 60;

export default async function FichaContratoPage({
  params,
}: PageProps<"/contratos/[id]">) {
  const { id } = await params;

  let contrato: ContratoDetalle | null = null;
  let error: string | null = null;

  try {
    contrato = await getFichaContrato(id);
  } catch (e) {
    if (e instanceof Error && e.cause === 404) {
      notFound();
    }
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <EstadoError mensaje={error} />
      </div>
    );
  }

  if (!contrato) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/contratos"
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        ← Volver al listado
      </Link>

      <div className="tarjeta mt-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1
              className="truncate text-display font-semibold tracking-tight"
              title={`Contrato ${contrato.numeroContrato}`}
            >
              Contrato {contrato.numeroContrato}
            </h1>
            <p className="mt-1 text-muted">
              {contrato.entidad ?? "Entidad no disponible"}
            </p>
          </div>
          <AlertaBadge
            nivel={contrato.analisis?.nivelAlerta ?? null}
            score={contrato.analisis?.score}
          />
        </div>

        {contrato.analisis ? (
          <div className="mt-4">
            <ScoreMeter
              score={contrato.analisis.score}
              nivel={contrato.analisis.nivelAlerta}
            />
          </div>
        ) : null}

        <p className="mt-4 text-sm text-foreground">{contrato.objeto}</p>
      </div>

      <dl className="tarjeta mt-6 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Campo etiqueta="Contratista" valor={contrato.contratista ?? "—"} />
        <Campo etiqueta="Tipo de contratación" valor={contrato.tipoContratacion} />
        <Campo etiqueta="Modalidad" valor={contrato.modalidad ?? "—"} />
        <Campo etiqueta="Estado" valor={contrato.estado ?? "—"} />
        <Campo etiqueta="Valor" valor={formatMoneda(contrato.valor)} destacado />
        <Campo etiqueta="Valor inicial" valor={formatMoneda(contrato.valorInicial)} />
        <Campo etiqueta="Fecha de firma" valor={formatFecha(contrato.fechaFirma)} />
        <Campo etiqueta="Fecha de inicio" valor={formatFecha(contrato.fechaInicio)} />
        <Campo etiqueta="Fecha de fin" valor={formatFecha(contrato.fechaFin)} />
        <Campo
          etiqueta="Duración (días)"
          valor={formatNumero(contrato.duracionDias)}
        />
        <Campo
          etiqueta="Modificaciones"
          valor={formatNumero(contrato.numModificaciones)}
        />
        <Campo etiqueta="Valor adiciones" valor={formatMoneda(contrato.valorAdiciones)} />
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">Señales encontradas</h2>
        {!contrato.analisis ? (
          <p className="mt-2 text-sm text-muted">
            Este contrato aún no ha sido analizado.
          </p>
        ) : contrato.analisis.senales.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No se detectaron señales de alerta.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {contrato.analisis.senales.map((senal, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-alert-medium/30 bg-alert-medium-bg px-3 py-2 text-sm text-foreground"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-alert-medium"
                />
                {senal}
              </li>
            ))}
          </ul>
        )}
      </section>

      {contrato.analisis ? (
        <ChatContrato
          contratoId={contrato.id}
          explicacionInicial={contrato.analisis.explicacionIa}
        />
      ) : null}
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{etiqueta}</dt>
      <dd
        className={`mt-0.5 font-medium text-foreground ${destacado ? "text-lg" : "text-sm"}`}
      >
        {valor}
      </dd>
    </div>
  );
}
