import { HttpClient, HttpParams } from "@angular/common/http"
import { inject, Injectable } from "@angular/core"
import { map, Observable } from "rxjs"
import {
  ApiResponse,
  Appointment,
  Center,
  JournalEntryInput,
  LoginResult,
  MoodEntry,
  PaginatedResponse,
  Resource,
  User,
} from "./api.models"

declare global {
  interface Window {
    QUACKROOM_CONFIG?: { apiUrl?: string }
  }
}

const apiUrl = (
  window.QUACKROOM_CONFIG?.apiUrl ??
  "/api"
).replace(/\/+$/, "")

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient)

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${apiUrl}/auth/login`, {
        correo_electronico: email,
        contrasenia: password,
      })
      .pipe(map((response) => response.data))
  }

  register(input: {
    nombre_completo: string
    correo_electronico: string
    contrasenia: string
    fecha_nacimiento: string
    id_rol: number
  }): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${apiUrl}/auth/register`, input)
      .pipe(map((response) => response.data))
  }

  currentUser(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${apiUrl}/auth/me`)
      .pipe(map((response) => response.data))
  }

  updateUser(
    id: number,
    update: Pick<User, "nombre_completo" | "telefono" | "fecha_nacimiento">,
  ): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${apiUrl}/usuarios/${id}`, update)
      .pipe(map((response) => response.data))
  }

  appointments(): Observable<Appointment[]> {
    return this.http
      .get<PaginatedResponse<Appointment>>(`${apiUrl}/citas`, {
        params: { page: 1, limit: 50 },
      })
      .pipe(map((response) => response.data))
  }

  createJournalEntry(input: JournalEntryInput): Observable<MoodEntry> {
    return this.http
      .post<ApiResponse<MoodEntry>>(`${apiUrl}/diario-emocional`, input)
      .pipe(map((response) => response.data))
  }

  journalEntries(): Observable<MoodEntry[]> {
    return this.http
      .get<PaginatedResponse<MoodEntry>>(
        `${apiUrl}/diario-emocional/mi-historial`,
        { params: { page: 1, limit: 30 } },
      )
      .pipe(map((response) => response.data))
  }

  resources(search = ""): Observable<Resource[]> {
    let params = new HttpParams().set("page", 1).set("limit", 50)
    if (search.trim()) params = params.set("search", search.trim())
    return this.http
      .get<PaginatedResponse<Resource>>(`${apiUrl}/recursos`, { params })
      .pipe(map((response) => response.data))
  }

  centers(search = ""): Observable<Center[]> {
    let params = new HttpParams().set("page", 1).set("limit", 50)
    if (search.trim()) params = params.set("search", search.trim())
    return this.http
      .get<PaginatedResponse<Center>>(`${apiUrl}/centros-atencion`, { params })
      .pipe(map((response) => response.data))
  }

  dashboardStats(): Observable<ApiResponse<Record<string, unknown>>> {
    return this.http.get<ApiResponse<Record<string, unknown>>>(
      `${apiUrl}/dashboard/stats`,
    )
  }
}
