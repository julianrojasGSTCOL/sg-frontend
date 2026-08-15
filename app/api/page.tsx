// Página temporal de la Fase 0 (ver plan-frontend.md) para verificar a mano que
// utils/request.ts habla con el backend real. Bórrala cuando la Fase 3
// (capa server/) reemplace esta llamada directa por server/dashboard/getSummary.ts.
import request from "@/utils/request";

type DashboardResumen = {
  totalContratos: number;
  totalAnalizados: number;
  bajo: number;
  medio: number;
  alto: number;
  valorTotal: number;
  promedio: number;
  mediana: number;
};

export default async function DevSmokePage() {
  let resumen: DashboardResumen | null = null;
  let error: string | null = null;

  try {
    resumen = await request<DashboardResumen>("/dashboard", { method: "GET" });
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="mb-4 text-lg font-semibold">
        Smoke test — GET /dashboard
      </h1>
      {error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : (
        <pre>{JSON.stringify(resumen, null, 2)}</pre>
      )}
    </main>
  );
}
