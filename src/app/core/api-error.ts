import { HttpErrorResponse } from "@angular/common/http"

export function apiErrorMessage(
  error: unknown,
  fallback = "No fue posible completar la solicitud.",
): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message
    if (typeof message === "string" && message.trim()) return message
    if (error.status === 0) {
      return "No se pudo conectar con la API. Revisa su disponibilidad y la configuración CORS."
    }
  }
  return fallback
}
