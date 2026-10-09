import { HttpClient, HttpParams } from "@angular/common/http"
import { inject, Injectable } from "@angular/core"
import { map, Observable } from "rxjs"
import {
  ApiResponse,
  AdminUserInput,
  Appointment,
  Center,
  CenterInput,
  JournalEntryInput,
  LoginResult,
  MoodEntry,
  PaginatedResponse,
  PageResult,
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

  createAdminUser(input: AdminUserInput): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${apiUrl}/usuarios`, input)
      .pipe(map((response) => response.data))
  }

  listAdminUsers(page: number, search = ""): Observable<PageResult<User>> {
    let params = new HttpParams().set("page", page).set("limit", 20)
    if (search.trim()) params = params.set("search", search.trim())
    return this.http
      .get<ApiResponse<User[]> & { meta?: { page: number; totalPaginas: number } }>(
        `${apiUrl}/usuarios`,
        { params },
      )
      .pipe(
        map((response) => ({
          data: response.data,
          page: response.meta?.page ?? page,
          totalPages: response.meta?.totalPaginas ?? 1,
        })),
      )
  }

  updateUserStatus(id: number, estado_cuenta: User["estado_cuenta"]): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${apiUrl}/usuarios/${id}/estado`, { estado_cuenta })
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

  listAdminCenters(page: number, search = ""): Observable<PageResult<Center>> {
    let params = new HttpParams().set("page", page).set("limit", 20)
    if (search.trim()) params = params.set("search", search.trim())
    return this.http
      .get<
        ApiResponse<Center[]> & {
          pagination?: { page: number; totalPages: number }
        }
      >(`${apiUrl}/centros-atencion`, { params })
      .pipe(
        map((response) => ({
          data: response.data,
          page: response.pagination?.page ?? page,
          totalPages: response.pagination?.totalPages ?? 1,
        })),
      )
  }

  createCenter(input: CenterInput): Observable<Center> {
    return this.http
      .post<ApiResponse<Center>>(`${apiUrl}/centros-atencion`, input)
      .pipe(map((response) => response.data))
  }

  updateCenter(id: number, input: CenterInput): Observable<Center> {
    return this.http
      .put<ApiResponse<Center>>(`${apiUrl}/centros-atencion/${id}`, input)
      .pipe(map((response) => response.data))
  }

  deleteCenter(id: number): Observable<void> {
    return this.http.delete<void>(`${apiUrl}/centros-atencion/${id}`)
  }

  dashboardStats(): Observable<ApiResponse<Record<string, unknown>>> {
    return this.http.get<ApiResponse<Record<string, unknown>>>(
      `${apiUrl}/dashboard/stats`,
    )
  }
}
