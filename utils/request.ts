"use server";
import { ApiResponse } from "@/types/types";
import { cookies } from "next/headers";

type requestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  token?: boolean;
  contentType?: "application/json" | "application/x-www-form-urlencoded";
  requestHeaders?: Record<string, string>;
  saveCookies?: boolean;
  deleteCookies?: boolean;
  includeCookies?: boolean;
};

type NestErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

type OpcionesCookie = {
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
};

function parsearSetCookie(setCookie: string) {
  const [par, ...atributos] = setCookie.split(";").map((s) => s.trim());
  const idxIgual = par.indexOf("=");
  const name = par.slice(0, idxIgual);
  const value = par.slice(idxIgual + 1);
  const options: OpcionesCookie = {};

  for (const atributo of atributos) {
    const [claveRaw, valorRaw] = atributo.split("=");
    switch (claveRaw.trim().toLowerCase()) {
      case "max-age":
        options.maxAge = Number(valorRaw);
        break;
      case "path":
        options.path = valorRaw;
        break;
      case "samesite":
        options.sameSite = valorRaw?.toLowerCase() as OpcionesCookie["sameSite"];
        break;
      case "secure":
        options.secure = true;
        break;
      case "httponly":
        options.httpOnly = true;
        break;
    }
  }

  return { name, value, options };
}

export default async function request<T>(url: string, options: requestOptions) {
  const {
    method,
    body,
    token,
    contentType,
    requestHeaders,
    saveCookies,
    deleteCookies,
    includeCookies,
  } = options;
  const cookiesManager = await cookies();
  const fullUrl = `${process.env.API_URL}${url}`;
  const actk = cookiesManager.get("_sgc_actk")?.value;
  const rftk = cookiesManager.get("_sgc_rftk")?.value;
  const headers: Record<string, string> = {
    ...requestHeaders,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  headers["Authorization"] = `Bearer ${process.env.BACKEND_API_KEY}`;
  if (token) {
    headers["Authorization"] = `Bearer ${actk}`;
  }
  if (includeCookies) {
    headers["Cookie"] = `_sgc_actk=${actk};_sgc_rftk=${rftk};`;
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, { method, body, headers });
  } catch {
    throw new Error(
      "Error de conexión con el servidor, por favor intente nuevamente.",
      { cause: "SERVER_ERROR" },
    );
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = data as NestErrorBody | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(", ")
      : (errorBody?.message ?? "Ocurrió un error inesperado en el servidor.");
    throw new Error(message, { cause: errorBody?.statusCode ?? res.status });
  }

  if (saveCookies) {
    const cookieList = res.headers.getSetCookie();
    cookieList?.forEach((cookie) => {
      const { name, value, options } = parsearSetCookie(cookie);
      cookiesManager.set(name, value, options);
    });
  }
  if (deleteCookies) {
    cookiesManager.delete("_sgc_actk");
    cookiesManager.delete("_sgc_rftk");
  }

  return data as ApiResponse<T>;
}
