import { CanActivateFn, Router } from "@angular/router"
import { inject } from "@angular/core"
import { AuthService } from "./auth.service"

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  return (
    auth.user()?.nombre_rol === "administrador" ||
    inject(Router).createUrlTree(["/"])
  )
}
