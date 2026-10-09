import { provideHttpClient, withInterceptors } from "@angular/common/http"
import { provideZoneChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"
import { provideRouter } from "@angular/router"
import { AppComponent } from "./app/app.component"
import { appRoutes } from "./app/app.routes"
import { authInterceptor } from "./app/core/auth.interceptor"

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((error: unknown) => {
  console.error("No se pudo iniciar QuackRoom", error)
})
