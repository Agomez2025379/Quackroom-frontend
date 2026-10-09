import { inject, Injectable, signal } from "@angular/core"
import { Observable, switchMap, tap } from "rxjs"
import { ApiService } from "./api.service"
import { LoginResult, User } from "./api.models"

const TOKEN_KEY = "quackroom_token"
const USER_KEY = "quackroom_user"

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly api = inject(ApiService)
  readonly user = signal<User | null>(this.readUser())

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY)
  }

  get authenticated(): boolean {
    return this.token !== null
  }

  signIn(email: string, password: string): Observable<LoginResult> {
    return this.api.login(email, password).pipe(tap((result) => this.store(result)))
  }

  registerAndSignIn(input: {
    nombre_completo: string
    correo_electronico: string
    contrasenia: string
    fecha_nacimiento: string
    id_rol: number
  }): Observable<LoginResult> {
    return this.api.register(input).pipe(
      switchMap(() => this.signIn(input.correo_electronico, input.contrasenia)),
    )
  }

  refreshUser(): Observable<User> {
    return this.api.currentUser().pipe(
      tap((user) => {
        this.user.set(user)
        sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      }),
    )
  }

  signOut(): void {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    this.user.set(null)
  }

  updateUser(user: User): void {
    this.user.set(user)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  private store(result: LoginResult): void {
    sessionStorage.setItem(TOKEN_KEY, result.token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.usuario))
    this.user.set(result.usuario)
  }

  private readUser(): User | null {
    const value = sessionStorage.getItem(USER_KEY)
    if (!value) return null
    try {
      return JSON.parse(value) as User
    } catch {
      sessionStorage.removeItem(USER_KEY)
      return null
    }
  }
}
