import { z } from "zod";

/**
 * Auth contracts shared by the web app and the API.
 * Mirrors the backend's /api/auth request/response shapes.
 */

export const USER_ROLES = ["admin", "coach", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** The authenticated user as returned by the backend (/api/auth/me, login, register). */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  coachId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

/** Envelope returned by login/register/refresh on the backend. */
export interface AuthResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  user?: AuthUser;
  tokens?: AuthTokens;
}

// ── Request schemas (validated on both sides) ────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[a-z]/, "Incluye una minúscula")
  .regex(/[A-Z]/, "Incluye una mayúscula")
  .regex(/\d/, "Incluye un número")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Incluye un carácter especial");

export const registerSchema = z.object({
  email: z.string().trim().email("Ingresa un email válido"),
  username: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(30, "Máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  password: passwordSchema,
  firstName: z.string().trim().min(1, "Requerido").max(50),
  lastName: z.string().trim().min(1, "Requerido").max(50),
});
export type RegisterInput = z.infer<typeof registerSchema>;
