import request from "@/utils/request";
import type {
  BuscarContratosParams,
  BuscarContratosResultado,
} from "@/types/contrato";

export async function buscarContratos(
  params: BuscarContratosParams,
): Promise<BuscarContratosResultado> {
  const query = new URLSearchParams();
  if (params.entidad) query.set("entidad", params.entidad);
  if (params.contratista) query.set("contratista", params.contratista);
  if (params.numero) query.set("numero", params.numero);
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  return request<BuscarContratosResultado>(
    `/contracts/search?${query.toString()}`,
    { method: "GET" },
  );
}
