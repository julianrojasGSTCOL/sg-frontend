const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CO");

export function formatMoneda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return currencyFormatter.format(valor);
}

export function formatNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return numberFormatter.format(valor);
}

// Los campos "date" del backend llegan como "YYYY-MM-DD"; se formatean por
// texto (sin pasar por Date) para no arriesgar un corrimiento de un día por
// zona horaria al interpretar una fecha sin hora.
export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}
