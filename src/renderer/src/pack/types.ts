/**
 * Re-export pack shapes for renderer code.
 * Canonical definitions live in src/shared/pack/types.ts (main/preload).
 */

export type {
  CheckOutcome,
  PackManifest,
  PackPayload,
  PackExportResult,
  PackImportResult,
  QueryResultGrid,
  QueryRunResult,
  SqlCheck,
  SqlQuestion,
  StorageStatus
} from '../../../shared/pack/types'
