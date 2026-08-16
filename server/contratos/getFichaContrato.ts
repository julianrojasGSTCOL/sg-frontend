import request from "@/utils/request";
import type { ContratoDetalle } from "@/types/contrato";

export async function getFichaContrato(id: string): Promise<ContratoDetalle> {
  return request<ContratoDetalle>(`/contracts/${id}`, { method: "GET" });
}
