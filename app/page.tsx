import Form from "next/form";
import Link from "next/link";
import RiesgoBar from "@/components/dashboard/RiesgoBar";
import EstadoError from "@/components/ui/EstadoError";
import StatCard from "@/components/ui/StatCard";
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconBanknote,
  IconChartBar,
  IconScale,
  IconShieldCheck,
} from "@/components/ui/icons";
import { formatMoneda, formatNumero } from "@/lib/format";
import { getResumenDashboard } from "@/server/dashboard/getResumenDashboard";
import type { DashboardResumen } from "@/types/dashboard";

function porcentaje(valor: number, total: number): string {
  if (total === 0) return "0% de los contratos";
  return `${Math.round((valor / total) * 100)}% de los contratos`;
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const entidadRaw = sp.entidad;
  const entidad = typeof entidadRaw === "string" ? entidadRaw : undefined;

  let resumen: DashboardResumen | null = null;
  let error: string | null = null;
  try {
    resumen = await getResumenDashboard(entidad);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display font-semibold tracking-tight">Panel</h1>
          <p className="mt-1 text-muted">
            Resumen de alertas detectadas en la contratación pública analizada.
          </p>
        </div>
        <Form action="/" className="flex gap-2">
          <label htmlFor="filtro-entidad" className="sr-only">
            Filtrar por entidad
          </label>
          <input
            id="filtro-entidad"
            type="search"
            name="entidad"
            defaultValue={entidad}
            placeholder="Filtrar por entidad..."
            className="entrada w-64 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full border-2 border-brand-solid bg-brand-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-solid-hover hover:bg-brand-solid-hover focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
          >
            Filtrar
          </button>
        </Form>
      </div>

      {error ? (
        <div className="mt-8">
          <EstadoError mensaje={error} />
        </div>
      ) : resumen ? (
        <>
          <section className="tarjeta mt-8 p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
                Distribución de alertas por nivel de riesgo
              </h2>
              <span
                className="inline-flex items-center gap-1.5 text-sm text-muted"
                title="Contratos con puntaje de riesgo calculado, sobre el total encontrado."
              >
                {formatNumero(resumen.totalAnalizados)} de {formatNumero(resumen.totalContratos)}{" "}
                analizados
                <span
                  aria-hidden
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] leading-none"
                >
                  i
                </span>
              </span>
            </div>
            <div className="mt-4">
              <RiesgoBar bajo={resumen.bajo} medio={resumen.medio} alto={resumen.alto} />
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              etiqueta="Bajo riesgo"
              valor={formatNumero(resumen.bajo)}
              detalle={porcentaje(resumen.bajo, resumen.totalAnalizados)}
              icono={<IconShieldCheck className="h-4 w-4" />}
              tono="bajo"
            />
            <StatCard
              etiqueta="Riesgo medio"
              valor={formatNumero(resumen.medio)}
              detalle={porcentaje(resumen.medio, resumen.totalAnalizados)}
              icono={<IconAlertTriangle className="h-4 w-4" />}
              tono="medio"
            />
            <StatCard
              etiqueta="Alto riesgo"
              valor={formatNumero(resumen.alto)}
              detalle={porcentaje(resumen.alto, resumen.totalAnalizados)}
              icono={<IconAlertOctagon className="h-4 w-4" />}
              tono="alto"
            />
          </div>

          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-muted">
            Valores contratados
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              etiqueta="Valor total"
              valor={formatMoneda(resumen.valorTotal)}
              icono={<IconBanknote className="h-4 w-4" />}
            />
            <StatCard
              etiqueta="Valor promedio"
              valor={formatMoneda(resumen.promedio)}
              icono={<IconChartBar className="h-4 w-4" />}
            />
            <StatCard
              etiqueta="Valor mediana"
              valor={formatMoneda(resumen.mediana)}
              icono={<IconScale className="h-4 w-4" />}
            />
          </div>

          <div className="mt-8">
            <Link
              href={
                entidad ? `/contratos?entidad=${encodeURIComponent(entidad)}` : "/contratos"
              }
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Ver listado de contratos →
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
