import { CommonModule, DatePipe } from "@angular/common"
import { Component, inject, OnInit, signal } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { Router, RouterLink } from "@angular/router"
import { ApiService } from "../core/api.service"
import { apiErrorMessage } from "../core/api-error"
import { AuthService } from "../core/auth.service"
import {
  Appointment,
  Center,
  categoryName,
  JournalEntryInput,
  MoodEntry,
  Resource,
  User,
} from "../core/api.models"

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <div class="dashboard">
      <section class="welcome-card">
        <div>
          <span class="eyebrow">Tu espacio personal</span>
          <h2>Hola, {{ auth.user()?.nombre_completo }}. ¿Cómo te sientes hoy?</h2>
          <p>Este espacio te acompaña con orientación, recursos y herramientas para cuidar de ti.</p>
          <a class="button" routerLink="/bitacora">Registrar cómo me siento <span>→</span></a>
        </div>
        <div class="welcome-illustration" aria-hidden="true"><img src="/assets/welcome-duck.svg" alt="" /></div>
      </section>

      <p class="api-alert" role="alert" *ngIf="error()">{{ error() }}</p>
      <div class="home-grid" *ngIf="!isAdmin">
        <div class="column">
          <section class="panel">
            <div class="section-head">
              <div><span class="eyebrow">Próximas citas</span><h2>Tus espacios de orientación</h2></div>
              <a routerLink="/citas" class="text-link">Ver citas →</a>
            </div>
            <p *ngIf="appointments().length === 0 && !loading()" class="empty-state">No tienes citas registradas todavía.</p>
            <article class="session-body" *ngFor="let appointment of appointments()">
              <div class="date-block">
                <strong>{{ appointment.fecha_hora_programada | date: "dd" }}</strong>
                <span>{{ appointment.fecha_hora_programada | date: "MMM" | uppercase }}</span>
              </div>
              <div class="session-info">
                <h3>Orientación · profesional #{{ appointment.id_profesional }}</h3>
                <p>{{ appointment.fecha_hora_programada | date: "medium" }}</p>
                <span class="badge" [class]="'badge badge--' + appointment.estado_cita">{{ appointment.estado_cita }}</span>
              </div>
              <a *ngIf="appointment.enlace_reunion" class="button" [href]="appointment.enlace_reunion" target="_blank" rel="noopener noreferrer">Unirme</a>
            </article>
            <p *ngIf="loading()" class="loading-state">Cargando citas…</p>
          </section>

          <section class="panel">
            <div class="section-head">
              <div><span class="eyebrow">Bitácora emocional</span><h2>Registros recientes</h2></div>
              <a routerLink="/bitacora" class="text-link">Abrir bitácora →</a>
            </div>
            <p *ngIf="entries().length === 0 && !loading()" class="empty-state">Aún no hay registros en tu bitácora.</p>
            <div class="recent-entry" *ngFor="let entry of entries()">
              <span class="mood-chip">{{ entry.nivel_animo }}/5</span>
              <div><strong>{{ entry.emocion_principal }}</strong><p>{{ entry.fecha_registro | date: "mediumDate" }}</p></div>
            </div>
          </section>
        </div>

        <div class="column">
          <section class="panel quick-actions">
            <div class="section-head"><div><span class="eyebrow">Accesos rápidos</span><h2>¿Qué necesitas hoy?</h2></div></div>
            <a routerLink="/bitacora" class="action-row"><span class="action-icon">✎</span><span><strong>Escribir en mi bitácora</strong><small>Registra cómo te sientes</small></span><span>›</span></a>
            <a routerLink="/citas" class="action-row"><span class="action-icon action-icon--green">▦</span><span><strong>Consultar mis citas</strong><small>Revisa tu acompañamiento</small></span><span>›</span></a>
            <a routerLink="/recursos" class="action-row"><span class="action-icon action-icon--yellow">▣</span><span><strong>Explorar recursos</strong><small>Contenido para acompañarte</small></span><span>›</span></a>
          </section>
          <section class="quote-card"><p>“No tienes que tener todo resuelto. Dar un pequeño paso también es avanzar.”</p><span>Tu recordatorio de hoy</span></section>
        </div>
      </div>

      <section>
        <div class="section-head resources-title">
          <div><span class="eyebrow">Recomendado para ti</span><h2>Recursos publicados</h2></div>
          <a routerLink="/recursos">Ver todos →</a>
        </div>
        <div class="resource-grid">
          <article class="resource-card" *ngFor="let resource of resources()">
            <div class="resource-art"><span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span></div>
            <div class="resource-copy">
              <span class="category">{{ resource.tipo_recurso | uppercase }}</span>
              <h3>{{ resource.titulo }}</h3>
              <p>{{ categoryName(resource) }}</p>
              <a class="text-link" *ngIf="resource.url_media" [href]="resource.url_media" target="_blank" rel="noopener noreferrer">Abrir recurso →</a>
            </div>
          </article>
        </div>
        <p *ngIf="resources().length === 0 && !loading()" class="empty-state">No hay recursos publicados disponibles.</p>
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly auth = inject(AuthService)
  readonly isAdmin = this.auth.user()?.nombre_rol === "administrador"
  readonly appointments = signal<Appointment[]>([])
  readonly entries = signal<MoodEntry[]>([])
  readonly resources = signal<Resource[]>([])
  readonly loading = signal(true)
  readonly error = signal("")
  readonly categoryName = (resource: Resource) => categoryName(resource.categorias_recursos)

  ngOnInit(): void {
    let completed = 0
    const expectedRequests = this.isAdmin ? 1 : 3
    const done = () => {
      completed += 1
      if (completed === expectedRequests) this.loading.set(false)
    }
    if (!this.isAdmin) {
      this.api.appointments().subscribe({
        next: (data) => { this.appointments.set(data.slice(0, 2)); done() },
        error: (error: unknown) => { this.error.set(apiErrorMessage(error)); done() },
      })
      this.api.journalEntries().subscribe({
        next: (data) => { this.entries.set(data.slice(0, 3)); done() },
        error: (error: unknown) => { this.error.set(apiErrorMessage(error)); done() },
      })
    }
    this.api.resources().subscribe({
      next: (data) => { this.resources.set(data.slice(0, 3)); done() },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); done() },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="page-stack">
      <div class="hero-line"><div><h2>Tus espacios de orientación</h2><p>Consulta las citas vinculadas a tu cuenta.</p></div></div>
      <p class="api-alert" *ngIf="error()" role="alert">{{ error() }}</p>
      <p class="loading-state" *ngIf="loading()">Cargando tus citas…</p>
      <p class="empty-state" *ngIf="!loading() && appointments().length === 0">No hay citas registradas.</p>
      <div class="appointment-list">
        <article class="appointment-card" *ngFor="let appointment of appointments()">
          <div class="date-block"><strong>{{ appointment.fecha_hora_programada | date: "dd" }}</strong><span>{{ appointment.fecha_hora_programada | date: "MMM" | uppercase }}</span></div>
          <div class="professional-avatar">Q</div>
          <div class="appointment-main">
            <div><span [class]="'badge badge--' + appointment.estado_cita">{{ appointment.estado_cita }}</span><h3>Orientación · profesional #{{ appointment.id_profesional }}</h3><p>Solicitud #{{ appointment.id_cita }}</p></div>
            <div class="appointment-meta"><span>{{ appointment.fecha_hora_programada | date: "fullDate" }}</span><span>{{ appointment.fecha_hora_programada | date: "shortTime" }}</span></div>
          </div>
          <a class="button button--secondary" *ngIf="appointment.enlace_reunion" [href]="appointment.enlace_reunion" target="_blank" rel="noopener noreferrer">Entrar a la sesión</a>
        </article>
      </div>
      <p class="help-note">Para solicitar una cita, contacta a tu centro de apoyo o al equipo de QuackRoom. La API actual requiere el identificador del profesional asignado.</p>
    </div>
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly appointments = signal<Appointment[]>([])
  readonly loading = signal(true)
  readonly error = signal("")

  ngOnInit(): void {
    this.api.appointments().subscribe({
      next: (data) => { this.appointments.set(data); this.loading.set(false) },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); this.loading.set(false) },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="journal-grid">
      <section class="panel journal-form">
        <span class="eyebrow">Registro personal</span>
        <h2>¿Cómo está tu mundo interior?</h2>
        <p>No hay respuestas correctas. Este espacio es solo tuyo.</p>
        <form (ngSubmit)="save()">
          <label>Ánimo ({{ form.nivel_animo }} de 5)
            <input type="range" min="1" max="5" name="mood" [(ngModel)]="form.nivel_animo" />
          </label>
          <label>Emoción principal
            <select name="emotion" [(ngModel)]="form.emocion_principal" required>
              <option value="" disabled>Selecciona una emoción</option>
              <option>Tranquilidad</option><option>Alegría</option><option>Preocupación</option>
              <option>Tristeza</option><option>Enojo</option><option>Esperanza</option><option>Gratitud</option>
            </select>
          </label>
          <label>¿Quieres contar algo más?
            <textarea name="notes" [(ngModel)]="notes" placeholder="Escribe libremente. Tus notas son privadas…"></textarea>
          </label>
          <p class="api-alert" *ngIf="error()" role="alert">{{ error() }}</p>
          <p class="success-alert" *ngIf="saved()">Registro guardado correctamente.</p>
          <button class="button" type="submit" [disabled]="saving() || !form.emocion_principal">{{ saving() ? "Guardando…" : "Guardar registro" }}</button>
        </form>
      </section>
      <section class="panel">
        <div class="section-head"><div><span class="eyebrow">Tu historial</span><h2>Registros anteriores</h2></div></div>
        <p class="loading-state" *ngIf="loading()">Cargando historial…</p>
        <p class="empty-state" *ngIf="!loading() && entries().length === 0">Todavía no tienes registros.</p>
        <article class="recent-entry" *ngFor="let entry of entries()">
          <span class="mood-chip">{{ entry.nivel_animo }}/5</span>
          <div><strong>{{ entry.emocion_principal }}</strong><p>{{ entry.fecha_registro | date: "medium" }}</p><p *ngIf="entry.notas_personales">{{ entry.notas_personales }}</p></div>
        </article>
      </section>
    </div>
  `,
})
export class JournalComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly entries = signal<MoodEntry[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly saved = signal(false)
  readonly error = signal("")
  form: JournalEntryInput = { nivel_animo: 3, emocion_principal: "", notas_personales: null }
  notes = ""

  ngOnInit(): void {
    this.loadEntries()
  }

  save(): void {
    this.saving.set(true)
    this.saved.set(false)
    this.error.set("")
    this.api.createJournalEntry({
      ...this.form,
      notas_personales: this.notes.trim() || null,
    }).subscribe({
      next: () => {
        this.saving.set(false)
        this.saved.set(true)
        this.form = { nivel_animo: 3, emocion_principal: "", notas_personales: null }
        this.notes = ""
        this.loadEntries()
      },
      error: (error: unknown) => {
        this.saving.set(false)
        this.error.set(apiErrorMessage(error))
      },
    })
  }

  private loadEntries(): void {
    this.api.journalEntries().subscribe({
      next: (data) => { this.entries.set(data); this.loading.set(false) },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); this.loading.set(false) },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-stack">
      <div class="filter-bar">
        <div class="search"><span aria-hidden="true">⌕</span><input name="search" [(ngModel)]="search" (keyup.enter)="load()" placeholder="Buscar por título o tema…" /></div>
        <button class="button" type="button" (click)="load()">Buscar</button>
      </div>
      <p class="api-alert" *ngIf="error()" role="alert">{{ error() }}</p>
      <p class="loading-state" *ngIf="loading()">Cargando recursos…</p>
      <p class="empty-state" *ngIf="!loading() && resources().length === 0">No se encontraron recursos.</p>
      <div class="resource-grid resource-grid--catalog">
        <article class="resource-card" *ngFor="let resource of resources()">
          <div class="resource-art"><span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span></div>
          <div class="resource-copy">
            <span class="category">{{ resource.tipo_recurso | uppercase }}</span>
            <h3>{{ resource.titulo }}</h3>
            <p>{{ categoryName(resource) }}</p>
            <p>{{ resource.contenido }}</p>
            <a class="text-link" *ngIf="resource.url_media" [href]="resource.url_media" target="_blank" rel="noopener noreferrer">Abrir recurso →</a>
          </div>
        </article>
      </div>
    </div>
  `,
})
export class ResourcesComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly resources = signal<Resource[]>([])
  readonly loading = signal(true)
  readonly error = signal("")
  search = ""
  readonly categoryName = (resource: Resource) => categoryName(resource.categorias_recursos)

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.error.set("")
    this.api.resources(this.search).subscribe({
      next: (data) => { this.resources.set(data); this.loading.set(false) },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); this.loading.set(false) },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="centers-layout">
      <section class="centers-list">
        <div class="search"><span aria-hidden="true">⌕</span><input name="search" [(ngModel)]="search" (keyup.enter)="load()" placeholder="Buscar por nombre o servicio" /><button type="button" (click)="load()">Buscar</button></div>
        <p class="results-count">{{ centers().length }} centros</p>
        <p class="loading-state" *ngIf="loading()">Cargando centros…</p>
        <p class="api-alert" *ngIf="error()" role="alert">{{ error() }}</p>
        <p class="empty-state" *ngIf="!loading() && centers().length === 0">No se encontraron centros de apoyo.</p>
        <article class="center-card" *ngFor="let center of centers()">
          <span class="center-icon"><span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span></span>
          <div><h3>{{ center.nombre_centro }}</h3><p>⌖ {{ center.direccion }}</p><p>{{ center.servicios_ofrecidos }}</p><a [href]="'tel:' + center.telefono">☎ {{ center.telefono }}</a></div>
        </article>
      </section>
      <section class="map-panel centers-info">
        <span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span>
        <h2>Centros de apoyo</h2>
        <p>La lista muestra los datos de contacto publicados por la API. Contacta directamente con el centro para confirmar horarios y disponibilidad.</p>
      </section>
    </div>
  `,
})
export class CentersComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly centers = signal<Center[]>([])
  readonly loading = signal(true)
  readonly error = signal("")
  search = ""

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.error.set("")
    this.api.centers(this.search).subscribe({
      next: (data) => { this.centers.set(data); this.loading.set(false) },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); this.loading.set(false) },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-layout">
      <aside class="profile-summary">
        <div class="profile-avatar">{{ form.nombre_completo.slice(0, 1) || "Q" }}</div>
        <h2>{{ form.nombre_completo }}</h2><p>{{ email }}</p>
        <span class="badge badge--activo">Cuenta activa</span>
      </aside>
      <section class="panel profile-form">
        <span class="eyebrow">Datos personales</span><h2>Tu perfil</h2>
        <p class="loading-state" *ngIf="loading()">Cargando perfil…</p>
        <form (ngSubmit)="save()" *ngIf="!loading()">
          <div class="form-grid">
            <label>Nombre completo<input name="name" [(ngModel)]="form.nombre_completo" required /></label>
            <label>Correo electrónico<input [value]="email" type="email" readonly /></label>
            <label>Teléfono<input name="phone" [(ngModel)]="phone" /></label>
            <label>Fecha de nacimiento<input name="birthday" [(ngModel)]="birthday" type="date" /></label>
          </div>
          <p class="api-alert" *ngIf="error()" role="alert">{{ error() }}</p>
          <p class="success-alert" *ngIf="saved()">Cambios guardados.</p>
          <div class="form-actions"><button class="button" type="submit" [disabled]="saving()">{{ saving() ? "Guardando…" : "Guardar cambios" }}</button></div>
        </form>
      </section>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService)
  private readonly auth = inject(AuthService)
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly saved = signal(false)
  readonly error = signal("")
  form = { nombre_completo: "" }
  email = ""
  phone = ""
  birthday = ""
  userId = 0

  ngOnInit(): void {
    this.api.currentUser().subscribe({
      next: (user) => this.setUser(user),
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); this.loading.set(false) },
    })
  }

  save(): void {
    this.saving.set(true)
    this.saved.set(false)
    this.error.set("")
    this.api.updateUser(this.userId, {
      nombre_completo: this.form.nombre_completo,
      telefono: this.phone || null,
      fecha_nacimiento: this.birthday || null,
    }).subscribe({
      next: (user) => { this.auth.updateUser(user); this.setUser(user); this.saving.set(false); this.saved.set(true) },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error)); this.saving.set(false) },
    })
  }

  private setUser(user: User): void {
    this.userId = user.id_usuario
    this.form.nombre_completo = user.nombre_completo
    this.email = user.correo_electronico
    this.phone = user.telefono ?? ""
    this.birthday = user.fecha_nacimiento?.slice(0, 10) ?? ""
    this.loading.set(false)
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="auth-page">
      <section class="auth-story">
        <div class="auth-brand"><span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span><strong>QuackRoom</strong></div>
        <div><span class="eyebrow">Un espacio para pertenecer</span><h1>Tu bienestar merece escucha, tiempo y acompañamiento.</h1><p>Orientación psicoemocional no clínica, recursos y comunidad en un entorno seguro e inclusivo.</p></div>
        <div class="auth-illustration"><span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span></div>
        <blockquote>“A veces, encontrar nuestro lugar comienza por sentirnos escuchados.”</blockquote>
      </section>
      <section class="auth-form-wrap">
        <div class="auth-mobile-brand"><span class="duck-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="/assets/duck.svg#duck-mark"></use></svg></span><strong>QuackRoom</strong></div>
        <form class="auth-card" (ngSubmit)="signIn()">
          <span class="eyebrow">{{ register() ? "Crea tu espacio" : "Bienvenida de nuevo" }}</span>
          <h2>{{ register() ? "Comienza tu recorrido" : "Inicia sesión" }}</h2>
          <p>{{ register() ? "Crea una cuenta de beneficiario para continuar." : "Continúa cuidando de ti, a tu ritmo." }}</p>
          <label *ngIf="register()">Nombre completo<input type="text" name="name" [(ngModel)]="name" autocomplete="name" required /></label>
          <label>Correo electrónico<input type="email" name="email" [(ngModel)]="email" autocomplete="email" required /></label>
          <label>Contraseña<input type="password" name="password" [(ngModel)]="password" autocomplete="current-password" minlength="8" required /></label>
          <label *ngIf="register()">Fecha de nacimiento<input type="date" name="birthday" [(ngModel)]="birthday" required /></label>
          <p class="api-alert" *ngIf="error()" role="alert">{{ error() }}</p>
          <button class="button" type="submit" [disabled]="loading() || (register() && !birthday)">{{ loading() ? "Conectando…" : (register() ? "Crear mi cuenta →" : "Entrar a QuackRoom →") }}</button>
          <div class="auth-switch"><span>{{ register() ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?" }}</span><button type="button" (click)="toggleMode()">{{ register() ? "Inicia sesión" : "Regístrate" }}</button></div>
          <small>El registro crea una cuenta de beneficiario. La autenticación se realiza con la API de QuackRoom.</small>
        </form>
      </section>
    </main>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  readonly loading = signal(false)
  readonly error = signal("")
  readonly register = signal(false)
  name = ""
  email = ""
  password = ""
  birthday = ""

  toggleMode(): void {
    this.register.update((value) => !value)
    this.error.set("")
  }

  signIn(): void {
    this.loading.set(true)
    this.error.set("")
    const result = this.register()
      ? this.auth.registerAndSignIn({
          nombre_completo: this.name.trim(),
          correo_electronico: this.email.trim(),
          contrasenia: this.password,
          fecha_nacimiento: this.birthday,
          id_rol: 2,
        })
      : this.auth.signIn(this.email.trim(), this.password)
    result.subscribe({
      next: () => {
        this.loading.set(false)
        void this.router.navigate(["/"])
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error, "No se pudo iniciar sesión."))
        this.loading.set(false)
      },
    })
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <header class="admin-heading">
        <div>
          <span class="eyebrow">Indicadores</span>
          <h2>Resumen de la plataforma</h2>
          <p>Una mirada rápida a la actividad y el bienestar de la comunidad.</p>
        </div>
        <span class="admin-heading__badge" *ngIf="!loading() && !error() && indicators().length">
          <span aria-hidden="true"></span> Datos actualizados
        </span>
      </header>

      <p class="loading-state admin-message" *ngIf="loading()">Cargando estadísticas…</p>
      <p class="api-alert admin-message" *ngIf="error()" role="alert">{{ error() }}</p>
      <p class="help-note admin-message" *ngIf="!loading() && !error() && indicators().length === 0">La API no devolvió indicadores.</p>

      <div class="indicator-grid" *ngIf="!loading() && !error()">
        <article
          class="indicator-card"
          *ngFor="let item of indicators()"
          [class]="'indicator-card indicator-card--' + item.tone"
        >
          <div class="indicator-card__top">
            <span class="indicator-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="indicator-card__caption">{{ item.caption }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <div class="indicator-value">
            <strong>{{ item.value }}</strong>
            <span *ngIf="item.unit">{{ item.unit }}</span>
          </div>
          <div class="indicator-progress" *ngIf="item.progress !== undefined">
            <span [style.width.%]="item.progress"></span>
          </div>
          <ul class="indicator-details" *ngIf="item.details.length">
            <li *ngFor="let detail of item.details">
              <span class="indicator-details__label">{{ detail.label }}</span>
              <span class="indicator-details__value">{{ detail.value }}</span>
              <span class="indicator-details__meter" *ngIf="item.showMeters">
                <span [style.width.%]="detail.percent"></span>
              </span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      display: grid;
      gap: 1.5rem;
      padding-bottom: 2rem;
    }

    .admin-heading {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 0.25rem 0 0.25rem;
    }

    .admin-heading h2 {
      margin: 0.35rem 0 0;
      color: #183b36;
      font-size: clamp(1.5rem, 3vw, 2rem);
      letter-spacing: -0.035em;
    }

    .admin-heading p {
      margin: 0.55rem 0 0;
      color: #687b77;
      font-size: 0.95rem;
    }

    .admin-heading__badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex: 0 0 auto;
      padding: 0.55rem 0.8rem;
      border: 1px solid #dcebe4;
      border-radius: 999px;
      background: #f3faf6;
      color: #39735d;
      font-size: 0.78rem;
      font-weight: 650;
    }

    .admin-heading__badge span {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: #55a77e;
    }

    .admin-message {
      margin: 0;
    }

    .indicator-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 245px), 1fr));
      gap: 1rem;
    }

    .indicator-card {
      --indicator: #497e72;
      --indicator-soft: #eef6f2;
      min-width: 0;
      padding: 1.25rem;
      overflow: hidden;
      border: 1px solid #e5ece9;
      border-radius: 1.1rem;
      background: #fff;
      box-shadow: 0 8px 24px rgb(25 64 54 / 5%);
    }

    .indicator-card--blue {
      --indicator: #497c9b;
      --indicator-soft: #eff6fa;
    }

    .indicator-card--green {
      --indicator: #43866a;
      --indicator-soft: #eff8f2;
    }

    .indicator-card--violet {
      --indicator: #7a70a9;
      --indicator-soft: #f4f2fa;
    }

    .indicator-card--amber {
      --indicator: #a27b3e;
      --indicator-soft: #fbf6eb;
    }

    .indicator-card__top {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 2rem;
    }

    .indicator-icon {
      display: grid;
      width: 2rem;
      height: 2rem;
      place-items: center;
      border-radius: 0.65rem;
      background: var(--indicator-soft);
      color: var(--indicator);
      font-size: 1rem;
      font-weight: 700;
    }

    .indicator-card__caption {
      color: #71817d;
      font-size: 0.75rem;
      font-weight: 650;
      letter-spacing: 0.045em;
      text-transform: uppercase;
    }

    .indicator-card h3 {
      margin: 1rem 0 0;
      color: #263d38;
      font-size: 1rem;
      font-weight: 650;
    }

    .indicator-value {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      margin-top: 0.5rem;
      color: #1d3933;
    }

    .indicator-value strong {
      font-size: 2rem;
      font-weight: 750;
      letter-spacing: -0.055em;
      line-height: 1.1;
    }

    .indicator-value span {
      color: #73837e;
      font-size: 0.85rem;
    }

    .indicator-progress,
    .indicator-details__meter {
      display: block;
      height: 0.35rem;
      overflow: hidden;
      border-radius: 99px;
      background: var(--indicator-soft);
    }

    .indicator-progress {
      margin-top: 0.85rem;
    }

    .indicator-progress span,
    .indicator-details__meter span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--indicator);
    }

    .indicator-details {
      display: grid;
      gap: 0.72rem;
      margin: 1.1rem 0 0;
      padding: 0;
      list-style: none;
    }

    .indicator-details li {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.35rem 0.75rem;
      color: #536660;
      font-size: 0.83rem;
    }

    .indicator-details__label {
      min-width: 0;
      overflow-wrap: anywhere;
      text-transform: capitalize;
    }

    .indicator-details__value {
      color: #263d38;
      font-weight: 700;
    }

    .indicator-details__meter {
      grid-column: 1 / -1;
      height: 0.25rem;
    }

    @media (max-width: 560px) {
      .admin-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.9rem;
      }

      .indicator-card {
        padding: 1.1rem;
      }
    }
  `],
})
export class AdminComponent implements OnInit {
  private readonly api = inject(ApiService)
  readonly loading = signal(true)
  readonly error = signal("")
  readonly indicators = signal<AdminIndicator[]>([])

  ngOnInit(): void {
    this.api.dashboardStats().subscribe({
      next: (response) => {
        this.indicators.set(this.formatIndicators(response.data))
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error))
        this.loading.set(false)
      },
    })
  }

  private formatIndicators(data: Record<string, unknown>): AdminIndicator[] {
    return Object.entries(data).map(([key, value]) => {
      const config = indicatorConfig[key] ?? {
        title: key.replaceAll("_", " "),
        caption: "Indicador",
        icon: "•",
        tone: "green" as const,
      }

      if (key === "citasPorEstado" || key === "usuariosPorRol") {
        const details = this.numberDetails(value, key === "citasPorEstado" ? appointmentLabels : roleLabels)
        const total = details.reduce((sum, detail) => sum + detail.value, 0)
        return {
          ...config,
          value: String(total),
          unit: key === "citasPorEstado" ? "citas en total" : "personas en total",
          details,
          showMeters: false,
        }
      }

      if (key === "categoriasConMasContenido") {
        const details = Array.isArray(value)
          ? value.flatMap((category) => {
              if (!isRecord(category) || typeof category["nombre_categoria"] !== "string") return []
              const count = typeof category["total_recursos"] === "number" ? category["total_recursos"] : 0
              return [{ label: category["nombre_categoria"], value: count, percent: 0 }]
            })
          : []
        const maxCount = Math.max(1, ...details.map((detail) => detail.value))
        return {
          ...config,
          value: String(details.length),
          unit: details.length === 1 ? "categoría" : "categorías",
          details: details.map((detail) => ({
            ...detail,
            percent: (detail.value / maxCount) * 100,
          })),
          showMeters: true,
        }
      }

      const numericValue = typeof value === "number" ? value : null
      return {
        ...config,
        value: numericValue === null ? this.displayValue(value) : String(numericValue),
        unit: numericValue === null ? undefined : "de 5",
        details: [],
        showMeters: false,
        progress: numericValue === null ? undefined : Math.max(0, Math.min(100, (numericValue / 5) * 100)),
      }
    })
  }

  private numberDetails(value: unknown, labels: Record<string, string>): AdminDetail[] {
    if (!isRecord(value)) return []
    return Object.entries(value).flatMap(([key, count]) =>
      typeof count === "number"
        ? [{ label: labels[key] ?? key.replaceAll("_", " "), value: count, percent: 0 }]
        : [],
    )
  }

  private displayValue(value: unknown): string {
    if (typeof value === "string") return value
    if (value === null || value === undefined) return "—"
    if (typeof value === "number" || typeof value === "boolean") return String(value)
    return "Disponible"
  }
}

interface AdminDetail {
  label: string
  value: number
  percent: number
}

interface AdminIndicator {
  title: string
  caption: string
  icon: string
  tone: "blue" | "green" | "violet" | "amber"
  value: string
  unit?: string
  details: AdminDetail[]
  showMeters: boolean
  progress?: number
}

const indicatorConfig: Record<string, Pick<AdminIndicator, "title" | "caption" | "icon" | "tone">> = {
  citasPorEstado: { title: "Citas por estado", caption: "Acompañamiento", icon: "▦", tone: "blue" },
  usuariosPorRol: { title: "Usuarios por perfil", caption: "Comunidad", icon: "◉", tone: "green" },
  promedioNivelAnimo: { title: "Nivel de ánimo promedio", caption: "Bienestar emocional", icon: "☺", tone: "violet" },
  promedioCalificacion: { title: "Calificación promedio", caption: "Experiencia", icon: "★", tone: "amber" },
  categoriasConMasContenido: { title: "Recursos por categoría", caption: "Biblioteca", icon: "▤", tone: "blue" },
}

const appointmentLabels: Record<string, string> = {
  atendida: "Atendidas",
  cancelada: "Canceladas",
  confirmada: "Confirmadas",
  solicitada: "Solicitadas",
}

const roleLabels: Record<string, string> = {
  profesional: "Profesionales",
  beneficiario: "Beneficiarios",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
