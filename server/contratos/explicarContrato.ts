"use server";
import { cookies } from "next/headers";
import request from "@/utils/request";

export async function explicarContrato(contratoId: string): Promise<string> {
  const cookieStore = await cookies();
  const anon = cookieStore.get("_sgc_anon")?.value;

  const { explicacionIa } = await request<{ explicacionIa: string }>(
    `/contracts/${contratoId}/explain`,
    {
      method: "POST",
      requestHeaders: anon ? { Cookie: `_sgc_anon=${anon}` } : undefined,
      saveCookies: true,
    },
  );

  return explicacionIa;
}
