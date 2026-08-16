"use server";
import { cookies } from "next/headers";
import request from "@/utils/request";
import type { MensajeChat } from "@/types/contrato";

export async function enviarMensajeChat(
  contratoId: string,
  mensaje: string,
): Promise<MensajeChat> {
  const cookieStore = await cookies();
  const anon = cookieStore.get("_sgc_anon")?.value;

  return request<MensajeChat>(`/contracts/${contratoId}/chat`, {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({ mensaje }),
    requestHeaders: anon ? { Cookie: `_sgc_anon=${anon}` } : undefined,
    saveCookies: true,
  });
}
