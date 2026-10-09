export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface User {
  id_usuario: number
  id_rol: number
  nombre_rol: "administrador" | "profesional" | "beneficiario"
  nombre_completo: string
  correo_electronico: string
  telefono: string | null
  fecha_nacimiento: string | null
  estado_cuenta: "activo" | "inactivo" | "suspendido"
  fecha_registro: string
}

export interface LoginResult {
  token: string
  usuario: User
}

export interface Appointment {
  id_cita: number
  id_beneficiario: number
  id_profesional: number
  fecha_hora_programada: string
  enlace_reunion: string | null
  estado_cita: "solicitada" | "confirmada" | "atendida" | "cancelada"
  notas_orientacion: string | null
  fecha_creacion: string
}

export interface Resource {
  id_recurso: number
  id_categoria: number
  titulo: string
  contenido: string
  tipo_recurso: "articulo" | "guia_pdf" | "infografia" | "video"
  url_media: string | null
  fecha_publicacion: string
  categorias_recursos:
    | { id_categoria: number; nombre_categoria: string }
    | { id_categoria: number; nombre_categoria: string }[]
    | null
}

export interface Center {
  id_centro: number
  nombre_centro: string
  direccion: string
  telefono: string
  servicios_ofrecidos: string
}

export interface CenterInput {
  nombre_centro: string
  direccion: string
  telefono: string
  servicios_ofrecidos: string
}

export interface AdminUserInput {
  nombre_completo: string
  correo_electronico: string
  contrasenia: string
  nombre_rol: User["nombre_rol"]
  telefono: string | null
  fecha_nacimiento: string | null
  numero_colegiado?: string
  especialidad?: string
  biografia?: string | null
  anios_experiencia?: number
}

export interface PageResult<T> {
  data: T[]
  page: number
  totalPages: number
}

export interface MoodEntry {
  id_registro_emocional: number
  nivel_animo: number
  emocion_principal: string
  notas_personales: string | null
  fecha_registro: string
}

export interface JournalEntryInput {
  nivel_animo: number
  emocion_principal: string
  notas_personales: string | null
}

export function categoryName(
  category: Resource["categorias_recursos"],
): string {
  if (Array.isArray(category)) return category[0]?.nombre_categoria ?? "Recurso"
  return category?.nombre_categoria ?? "Recurso"
}
