import request from "@/utils/request";
import type { DashboardResumen } from "@/types/dashboard";

export async function getResumenDashboard(
  entidad?: string,
): Promise<DashboardResumen> {
  const query = entidad ? `?entidad=${encodeURIComponent(entidad)}` : "";
  return request<DashboardResumen>(`/dashboard${query}`, { method: "GET" });
}
