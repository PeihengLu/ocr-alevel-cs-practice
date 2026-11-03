declare module 'sql.js' {
  export type SqlValue = number | string | Uint8Array | null

  export interface QueryExecResult {
    columns: string[]
    values: SqlValue[][]
  }

  export interface Statement {
    bind(values?: SqlValue[]): boolean
    step(): boolean
    getAsObject(): Record<string, SqlValue>
    free(): boolean
  }

  export interface Database {
    run(sql: string, params?: SqlValue[]): Database
    exec(sql: string): QueryExecResult[]
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }

  export interface InitSqlJsConfig {
    wasmBinary?: ArrayBuffer | Uint8Array
  }

  export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>
}
