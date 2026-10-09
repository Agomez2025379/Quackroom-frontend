import { CommonModule } from "@angular/common"
import { Component, inject, OnInit, signal } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { ApiService } from "../core/api.service"
import { apiErrorMessage } from "../core/api-error"
import { AdminUserInput, Center, CenterInput, User } from "../core/api.models"

type AdminUserForm = {
  nombre_completo: string
  correo_electronico: string
  contrasenia: string
  nombre_rol: User["nombre_rol"]
  telefono: string
  fecha_nacimiento: string
  numero_colegiado: string
  especialidad: string
  biografia: string
  anios_experiencia: number
}

const emptyUserForm = (): AdminUserForm => ({
  nombre_completo: "",
  correo_electronico: "",
  contrasenia: "",
  nombre_rol: "beneficiario",
  telefono: "",
  fecha_nacimiento: "",
  numero_colegiado: "",
  especialidad: "",
  biografia: "",
  anios_experiencia: 0,
})

const emptyCenterForm = (): CenterInput => ({
  nombre_centro: "",
  direccion: "",
  telefono: "",
  servicios_ofrecidos: "",
})

function isAccountStatus(value: string): value is User["estado_cuenta"] {
  return ["activo", "inactivo", "suspendido"].includes(value)
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-stack admin-management">
      <section class="panel admin-form-panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">{{ editingUser() ? "Editar cuenta" : "Nueva cuenta" }}</span>
            <h2>{{ editingUser() ? "Actualizar usuario" : "Agregar usuario" }}</h2>
          </div>
          <button *ngIf="editingUser()" type="button" class="button button--secondary" (click)="cancelEdit()">Cancelar</button>
        </div>
        <p class="admin-hint">Las cuentas profesionales incluyen su perfil y número de colegiado.</p>
        <form class="admin-form-grid" (ngSubmit)="saveUser()">
          <label>Nombre completo
            <input name="nombre_completo" [(ngModel)]="form.nombre_completo" maxlength="150" required />
          </label>
          <label>Correo electrónico
            <input name="correo_electronico" [(ngModel)]="form.correo_electronico" type="email" maxlength="100" [readonly]="!!editingUser()" required />
          </label>
          <label *ngIf="!editingUser()">Contraseña inicial
            <input name="contrasenia" [(ngModel)]="form.contrasenia" type="password" minlength="8" maxlength="72" autocomplete="new-password" required />
          </label>
          <label *ngIf="!editingUser()">Rol
            <select name="nombre_rol" [(ngModel)]="form.nombre_rol">
              <option value="beneficiario">Beneficiario</option>
              <option value="profesional">Profesional</option>
              <option value="administrador">Administrador</option>
            </select>
          </label>
          <label>Teléfono
            <input name="telefono" [(ngModel)]="form.telefono" maxlength="20" />
          </label>
          <label>Fecha de nacimiento
            <input name="fecha_nacimiento" [(ngModel)]="form.fecha_nacimiento" type="date" />
          </label>
          <ng-container *ngIf="form.nombre_rol === 'profesional' && !editingUser()">
            <label>Número de colegiado
              <input name="numero_colegiado" [(ngModel)]="form.numero_colegiado" maxlength="30" required />
            </label>
            <label>Especialidad
              <input name="especialidad" [(ngModel)]="form.especialidad" maxlength="100" required />
            </label>
            <label>Años de experiencia
              <input name="anios_experiencia" [(ngModel)]="form.anios_experiencia" type="number" min="0" required />
            </label>
            <label class="admin-form-grid__wide">Biografía
              <textarea name="biografia" [(ngModel)]="form.biografia" maxlength="2000"></textarea>
            </label>
          </ng-container>
          <p *ngIf="error()" class="api-alert admin-form-grid__wide" role="alert">{{ error() }}</p>
          <p *ngIf="success()" class="success-alert admin-form-grid__wide" role="status">{{ success() }}</p>
          <div class="form-actions admin-form-grid__wide">
            <button class="button" type="submit" [disabled]="saving()">
              {{ saving() ? "Guardando…" : editingUser() ? "Guardar cambios" : "Crear usuario" }}
            </button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="section-head admin-list-heading">
          <div>
            <span class="eyebrow">Cuentas registradas</span>
            <h2>Usuarios</h2>
          </div>
          <span class="results-count">{{ users().length }} en esta página</span>
        </div>
        <form class="admin-filter" (ngSubmit)="searchUsers()">
          <input name="search" [(ngModel)]="search" placeholder="Buscar por nombre…" aria-label="Buscar usuarios por nombre" />
          <button class="button button--secondary" type="submit">Buscar</button>
        </form>
        <p *ngIf="loading()" class="loading-state">Cargando usuarios…</p>
        <p *ngIf="listError() && !loading()" class="api-alert" role="alert">{{ listError() }}</p>
        <p *ngIf="!loading() && users().length === 0 && !listError()" class="empty-state">No se encontraron usuarios.</p>
        <div class="admin-table-wrap" *ngIf="users().length">
          <table class="admin-table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr *ngFor="let user of users()">
                <td><strong>{{ user.nombre_completo }}</strong><small>{{ user.correo_electronico }}</small></td>
                <td><span class="badge badge--activo">{{ user.nombre_rol }}</span></td>
                <td>
                  <select
                    [ngModel]="user.estado_cuenta"
                    (ngModelChange)="saveStatus(user, $event)"
                    [ngModelOptions]="{ standalone: true }"
                    [attr.aria-label]="'Estado de ' + user.nombre_completo"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </td>
                <td><button type="button" class="text-button" (click)="editUser(user)">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="admin-pagination" *ngIf="totalPages() > 1">
          <button type="button" class="button button--secondary" [disabled]="page() <= 1 || loading()" (click)="loadUsers(page() - 1)">Anterior</button>
          <span>Página {{ page() }} de {{ totalPages() }}</span>
          <button type="button" class="button button--secondary" [disabled]="page() >= totalPages() || loading()" (click)="loadUsers(page() + 1)">Siguiente</button>
        </div>
      </section>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly users = signal<User[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly error = signal("")
  readonly success = signal("")
  readonly listError = signal("")
  readonly page = signal(1)
  readonly totalPages = signal(1)
  readonly editingUser = signal<User | null>(null)
  form = emptyUserForm()
  search = ""

  ngOnInit(): void {
    this.loadUsers()
  }

  loadUsers(page = 1): void {
    this.page.set(page)
    this.loading.set(true)
    this.listError.set("")
    this.api.listAdminUsers(page, this.search).subscribe({
      next: (result) => {
        this.users.set(result.data)
        this.page.set(result.page)
        this.totalPages.set(result.totalPages)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.listError.set(apiErrorMessage(error))
        this.loading.set(false)
      },
    })
  }

  searchUsers(): void {
    this.loadUsers(1)
  }

  saveUser(): void {
    this.saving.set(true)
    this.error.set("")
    this.success.set("")
    const editing = this.editingUser()
    if (editing) {
      this.api.updateUser(editing.id_usuario, {
        nombre_completo: this.form.nombre_completo.trim(),
        telefono: this.form.telefono.trim() || null,
        fecha_nacimiento: this.form.fecha_nacimiento || null,
      }).subscribe({
        next: () => {
          this.saving.set(false)
          this.success.set("Los datos del usuario se actualizaron.")
          this.cancelEdit()
          this.loadUsers(this.page())
        },
        error: (error: unknown) => {
          this.error.set(apiErrorMessage(error))
          this.saving.set(false)
        },
      })
      return
    }

    const input: AdminUserInput = {
      nombre_completo: this.form.nombre_completo.trim(),
      correo_electronico: this.form.correo_electronico.trim(),
      contrasenia: this.form.contrasenia,
      nombre_rol: this.form.nombre_rol,
      telefono: this.form.telefono.trim() || null,
      fecha_nacimiento: this.form.fecha_nacimiento || null,
      ...(this.form.nombre_rol === "profesional"
        ? {
            numero_colegiado: this.form.numero_colegiado.trim(),
            especialidad: this.form.especialidad.trim(),
            biografia: this.form.biografia.trim() || null,
            anios_experiencia: Number(this.form.anios_experiencia),
          }
        : {}),
    }
    this.api.createAdminUser(input).subscribe({
      next: () => {
        this.saving.set(false)
        this.form = emptyUserForm()
        this.success.set("El usuario se creó correctamente.")
        this.loadUsers(1)
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error))
        this.saving.set(false)
      },
    })
  }

  editUser(user: User): void {
    this.editingUser.set(user)
    this.error.set("")
    this.success.set("")
    this.form = {
      ...emptyUserForm(),
      nombre_completo: user.nombre_completo,
      correo_electronico: user.correo_electronico,
      nombre_rol: user.nombre_rol,
      telefono: user.telefono ?? "",
      fecha_nacimiento: user.fecha_nacimiento?.slice(0, 10) ?? "",
    }
  }

  cancelEdit(): void {
    this.editingUser.set(null)
    this.form = emptyUserForm()
  }

  saveStatus(user: User, value: string): void {
    if (!isAccountStatus(value) || value === user.estado_cuenta) return
    const previous = user.estado_cuenta
    user.estado_cuenta = value
    this.error.set("")
    this.api.updateUserStatus(user.id_usuario, value).subscribe({
      next: (updated) => {
        user.estado_cuenta = updated.estado_cuenta
        this.success.set(`Estado de ${user.nombre_completo} actualizado.`)
      },
      error: (error: unknown) => {
        user.estado_cuenta = previous
        this.error.set(apiErrorMessage(error))
      },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-stack admin-management">
      <section class="panel admin-form-panel">
        <div class="section-head">
          <div>
            <span class="eyebrow">{{ editingCenter() ? "Editar organización" : "Nueva organización" }}</span>
            <h2>{{ editingCenter() ? "Actualizar centro de apoyo" : "Agregar centro de apoyo" }}</h2>
          </div>
          <button *ngIf="editingCenter()" type="button" class="button button--secondary" (click)="cancelEdit()">Cancelar</button>
        </div>
        <form class="admin-form-grid" (ngSubmit)="saveCenter()">
          <label>Nombre de la organización
            <input name="nombre_centro" [(ngModel)]="form.nombre_centro" maxlength="150" required />
          </label>
          <label>Teléfono de contacto
            <input name="telefono" [(ngModel)]="form.telefono" maxlength="20" required />
          </label>
          <label class="admin-form-grid__wide">Dirección
            <input name="direccion" [(ngModel)]="form.direccion" maxlength="200" required />
          </label>
          <label class="admin-form-grid__wide">Servicios ofrecidos
            <textarea name="servicios_ofrecidos" [(ngModel)]="form.servicios_ofrecidos" required></textarea>
          </label>
          <p *ngIf="error()" class="api-alert admin-form-grid__wide" role="alert">{{ error() }}</p>
          <p *ngIf="success()" class="success-alert admin-form-grid__wide" role="status">{{ success() }}</p>
          <div class="form-actions admin-form-grid__wide">
            <button class="button" type="submit" [disabled]="saving()">
              {{ saving() ? "Guardando…" : editingCenter() ? "Guardar cambios" : "Crear organización" }}
            </button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="section-head admin-list-heading">
          <div><span class="eyebrow">Directorio</span><h2>Organizaciones y centros de apoyo</h2></div>
          <span class="results-count">{{ centers().length }} en esta página</span>
        </div>
        <form class="admin-filter" (ngSubmit)="searchCenters()">
          <input name="search" [(ngModel)]="search" placeholder="Buscar por nombre o servicio…" aria-label="Buscar organizaciones" />
          <button class="button button--secondary" type="submit">Buscar</button>
        </form>
        <p *ngIf="loading()" class="loading-state">Cargando organizaciones…</p>
        <p *ngIf="listError() && !loading()" class="api-alert" role="alert">{{ listError() }}</p>
        <p *ngIf="!loading() && centers().length === 0 && !listError()" class="empty-state">No hay organizaciones registradas.</p>
        <div class="admin-center-list">
          <article class="admin-center-card" *ngFor="let center of centers()">
            <div>
              <h3>{{ center.nombre_centro }}</h3>
              <p>{{ center.direccion }}</p>
              <p>{{ center.telefono }}</p>
              <p>{{ center.servicios_ofrecidos }}</p>
            </div>
            <div class="admin-center-actions">
              <button type="button" class="text-button" (click)="editCenter(center)">Editar</button>
              <button type="button" class="text-button text-button--danger" (click)="deleteCenter(center)" [disabled]="deletingId() === center.id_centro">
                {{ deletingId() === center.id_centro ? "Eliminando…" : "Eliminar" }}
              </button>
            </div>
          </article>
        </div>
        <div class="admin-pagination" *ngIf="totalPages() > 1">
          <button type="button" class="button button--secondary" [disabled]="page() <= 1 || loading()" (click)="loadCenters(page() - 1)">Anterior</button>
          <span>Página {{ page() }} de {{ totalPages() }}</span>
          <button type="button" class="button button--secondary" [disabled]="page() >= totalPages() || loading()" (click)="loadCenters(page() + 1)">Siguiente</button>
        </div>
      </section>
    </div>
  `,
})
export class AdminCentersComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly centers = signal<Center[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly deletingId = signal<number | null>(null)
  readonly error = signal("")
  readonly success = signal("")
  readonly listError = signal("")
  readonly page = signal(1)
  readonly totalPages = signal(1)
  readonly editingCenter = signal<Center | null>(null)
  form = emptyCenterForm()
  search = ""

  ngOnInit(): void {
    this.loadCenters()
  }

  loadCenters(page = 1): void {
    this.page.set(page)
    this.loading.set(true)
    this.listError.set("")
    this.api.listAdminCenters(page, this.search).subscribe({
      next: (result) => {
        this.centers.set(result.data)
        this.page.set(result.page)
        this.totalPages.set(result.totalPages)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.listError.set(apiErrorMessage(error))
        this.loading.set(false)
      },
    })
  }

  searchCenters(): void {
    this.loadCenters(1)
  }

  saveCenter(): void {
    this.saving.set(true)
    this.error.set("")
    this.success.set("")
    const editing = this.editingCenter()
    const input: CenterInput = {
      nombre_centro: this.form.nombre_centro.trim(),
      direccion: this.form.direccion.trim(),
      telefono: this.form.telefono.trim(),
      servicios_ofrecidos: this.form.servicios_ofrecidos.trim(),
    }
    const request = editing
      ? this.api.updateCenter(editing.id_centro, input)
      : this.api.createCenter(input)
    request.subscribe({
      next: () => {
        this.saving.set(false)
        this.form = emptyCenterForm()
        this.editingCenter.set(null)
        this.success.set(editing ? "La organización se actualizó." : "La organización se creó.")
        this.loadCenters(editing ? this.page() : 1)
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error))
        this.saving.set(false)
      },
    })
  }

  editCenter(center: Center): void {
    this.editingCenter.set(center)
    this.error.set("")
    this.success.set("")
    this.form = {
      nombre_centro: center.nombre_centro,
      direccion: center.direccion,
      telefono: center.telefono,
      servicios_ofrecidos: center.servicios_ofrecidos,
    }
  }

  cancelEdit(): void {
    this.editingCenter.set(null)
    this.form = emptyCenterForm()
  }

  deleteCenter(center: Center): void {
    if (!window.confirm(`¿Eliminar la organización "${center.nombre_centro}"? Esta acción no se puede deshacer.`)) return
    this.deletingId.set(center.id_centro)
    this.error.set("")
    this.success.set("")
    this.api.deleteCenter(center.id_centro).subscribe({
      next: () => {
        this.deletingId.set(null)
        this.success.set("La organización se eliminó.")
        this.loadCenters(this.page())
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error))
        this.deletingId.set(null)
      },
    })
  }
}
