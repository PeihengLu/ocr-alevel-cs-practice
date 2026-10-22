/**
 * Draft pack shape for PortableLeetcode (.plpack = zip + manifest).
 * Full import/export + MySQL wiring lands after scaffold.
 */

export interface PackManifest {
  packId: string
  version: string
  title: string
  createdAt: string
  minAppVersion: string
  checksum?: string
}

export interface SqlQuestion {
  id: string
  title: string
  prompt: string
  starterQuery: string
  /** Expected result / check stubs — format TBD in pack format work. */
  checks: unknown[]
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  schemaRef?: string
}

export interface PackPayload {
  manifest: PackManifest
  questions: SqlQuestion[]
  /** Relative paths or inline SQL stubs for schema + seed. */
  sqlAssets: Record<string, string>
}

export type PackImportResult =
  | { ok: true; pack: PackPayload; merged: number; retired: number }
  | { ok: false; error: string }

export type PackExportResult =
  | { ok: true; path: string }
  | { ok: false; error: string }
