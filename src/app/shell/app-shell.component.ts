import { HttpErrorResponse } from "@angular/common/http"
import { Component, inject, OnInit, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router"
import { filter } from "rxjs"
import { apiErrorMessage } from "../core/api-error"
import { AuthService } from "../core/auth.service"

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app-shell.component.html",
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService)
  readonly router = inject(Router)
  readonly menuOpen = signal(false)
  readonly apiMessage = signal("")
  readonly path = signal(this.router.url.split("?")[0])

  ngOnInit(): void {
    this.auth.refreshUser().subscribe({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.auth.signOut()
          void this.router.navigate(["/login"])
          return
        }
        this.apiMessage.set(apiErrorMessage(error))
      },
    })
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.path.set(event.urlAfterRedirects.split("?")[0]))
  }

  get title(): string {
    return (
      {
        "/": "Inicio",
        "/citas": "Citas de orientación",
        "/bitacora": "Bitácora emocional",
        "/recursos": "Recursos educativos",
        "/centros": "Centros de apoyo",
        "/perfil": "Mi perfil",
        "/admin": "Panel administrativo",
      }[this.path()] ?? "QuackRoom"
    )
  }

  get subtitle(): string {
    return (
      {
        "/": "Un espacio seguro para cuidar de ti",
        "/citas": "Gestiona tus espacios de acompañamiento",
        "/bitacora": "Reconoce cómo te sientes, a tu ritmo",
        "/recursos": "Herramientas sencillas para tu bienestar",
        "/centros": "Organizaciones que pueden acompañarte",
        "/perfil": "Gestiona tus datos y preferencias",
        "/admin": "Indicadores de impacto en tiempo real",
      }[this.path()] ?? ""
    )
  }

  closeMenu(): void {
    this.menuOpen.set(false)
  }

  signOut(): void {
    this.auth.signOut()
    void this.router.navigate(["/login"])
  }
}
