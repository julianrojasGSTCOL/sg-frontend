import FiltrosBusqueda from "@/components/contratos/FiltrosBusqueda";
import TablaContratos from "@/components/contratos/TablaContratos";
import EstadoError from "@/components/ui/EstadoError";
import EstadoVacio from "@/components/ui/EstadoVacio";
import Paginacion from "@/components/ui/Paginacion";
import { buscarContratos } from "@/server/contratos/buscarContratos";
import type { BuscarContratosResultado } from "@/types/contrato";

const LIMITE_POR_PAGINA = 20;

function leerParametro(
  sp: Record<string, string | string[] | undefined>,
  clave: string,
): string | undefined {
  const valor = sp[clave];
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return texto && texto.trim() !== "" ? texto.trim() : undefined;
}

export default async function ContratosPage({
  searchParams,
}: PageProps<"/contratos">) {
  const sp = await searchParams;

  const entidad = leerParametro(sp, "entidad");
  const contratista = leerParametro(sp, "contratista");
  const numero = leerParametro(sp, "numero");
  const tipo = leerParametro(sp, "tipo");
  const offset = Number(leerParametro(sp, "offset") ?? "0") || 0;

  const hayFiltros = Boolean(entidad || contratista || numero || tipo);

  let resultado: BuscarContratosResultado | null = null;
  let error: string | null = null;

  if (hayFiltros) {
    try {
      resultado = await buscarContratos({
        entidad,
        contratista,
        numero,
        tipo,
        limit: LIMITE_POR_PAGINA,
        offset,
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Error desconocido";
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-display font-semibold tracking-tight">Buscar contratos</h1>
      <p className="mt-1 text-muted">
        Indique al menos un filtro: entidad, contratista, número de contrato o
        tipo de contratación.
      </p>

      <div className="mt-6">
        <FiltrosBusqueda valores={{ entidad, contratista, numero, tipo }} />
      </div>

      <div className="mt-8">
        {!hayFiltros ? (
          <EstadoVacio mensaje="Ingrese al menos un filtro para buscar contratos." />
        ) : error ? (
          <EstadoError mensaje={error} />
        ) : resultado && resultado.resultados.length === 0 ? (
          <EstadoVacio mensaje="No se encontraron contratos con esos filtros." />
        ) : resultado ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
                Resultados de búsqueda
              </h2>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-900">
                {resultado.total}
              </span>
            </div>
            <TablaContratos contratos={resultado.resultados} />
            <Paginacion
              total={resultado.total}
              limit={resultado.limit}
              offset={resultado.offset}
              basePath="/contratos"
              searchParams={{ entidad, contratista, numero, tipo }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
