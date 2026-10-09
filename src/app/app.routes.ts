import { Routes } from "@angular/router"
import { authGuard } from "./core/auth.guard"
import { AppShellComponent } from "./shell/app-shell.component"
import {
  AppointmentsComponent,
  AdminComponent,
  CentersComponent,
  HomeComponent,
  JournalComponent,
  LoginComponent,
  ProfileComponent,
  ResourcesComponent,
} from "./pages/pages"

export const appRoutes: Routes = [
  { path: "login", component: LoginComponent },
  {
    path: "",
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: "", component: HomeComponent },
      { path: "citas", component: AppointmentsComponent },
      { path: "bitacora", component: JournalComponent },
      { path: "recursos", component: ResourcesComponent },
      { path: "centros", component: CentersComponent },
      { path: "perfil", component: ProfileComponent },
      { path: "admin", component: AdminComponent },
    ],
  },
  { path: "**", redirectTo: "" },
]
