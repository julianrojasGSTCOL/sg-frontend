"use server";
import { cookies } from "next/headers";
import request from "@/utils/request";
import type { MensajeChat } from "@/types/contrato";

export async function getChatHistorial(contratoId: string): Promise<MensajeChat[]> {
  const cookieStore = await cookies();
  const anon = cookieStore.get("_sgc_anon")?.value;

  const { mensajes } = await request<{ mensajes: MensajeChat[] }>(
    `/contracts/${contratoId}/chat`,
    {
      method: "GET",
      requestHeaders: anon ? { Cookie: `_sgc_anon=${anon}` } : undefined,
      saveCookies: true,
    },
  );

  return mensajes;
}
