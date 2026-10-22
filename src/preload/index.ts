import { contextBridge } from 'electron'

/** Minimal bridge for M1 scaffold — pack/MySQL IPC comes later. */
contextBridge.exposeInMainWorld('portableLeetcode', {
  platform: process.platform,
  editions: ['student', 'teacher'] as const
})
