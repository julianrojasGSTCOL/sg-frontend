import Form from "next/form";
import Link from "next/link";
import { IconSearch } from "@/components/ui/icons";

type Valores = {
  entidad?: string;
  contratista?: string;
  numero?: string;
  tipo?: string;
};

const CAMPOS: { name: keyof Valores; label: string; placeholder: string }[] = [
  { name: "entidad", label: "Entidad", placeholder: "Ej. Alcaldía de Pasto" },
  { name: "contratista", label: "Contratista", placeholder: "Nombre o razón social" },
  { name: "numero", label: "Número de contrato", placeholder: "Ej. 20213284" },
  { name: "tipo", label: "Tipo de contratación", placeholder: "Ej. Prestación de servicios" },
];

const CAMPO_CLASE = "entrada w-full px-3 py-2 text-sm placeholder:text-muted/70";

export default function FiltrosBusqueda({ valores }: { valores: Valores }) {
  const hayFiltros = Object.values(valores).some(Boolean);

  return (
    <div className="tarjeta p-4">
      <Form action="/contratos" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CAMPOS.map((campo) => (
          <label key={campo.name} className="flex flex-col gap-1 text-xs font-medium text-muted">
            {campo.label}
            <input
              name={campo.name}
              defaultValue={valores[campo.name]}
              placeholder={campo.placeholder}
              className={CAMPO_CLASE}
            />
          </label>
        ))}
        <div className="flex items-end justify-end gap-3 lg:col-span-4">
          {hayFiltros ? (
            <Link
              href="/contratos"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-brand-100 hover:text-foreground"
            >
              Limpiar
            </Link>
          ) : null}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full border-2 border-brand-solid bg-brand-solid px-5 py-2 text-sm font-medium text-white transition-colors hover:border-brand-solid-hover hover:bg-brand-solid-hover focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
          >
            <IconSearch className="h-4 w-4" />
            Buscar
          </button>
        </div>
      </Form>
    </div>
  );
}
