import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { ensureMysqlSidecar, stopMysqlSidecar } from './db/portableMysql'
import { registerIpcHandlers } from './ipc'
import { initBank } from './store/bank'

const isDev = !app.isPackaged
let quitting = false

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    show: false,
    title: 'PortableLeetcode',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  registerIpcHandlers()

  try {
    await ensureMysqlSidecar()
  } catch (err) {
    console.error('[portable-leetcode] MySQL sidecar failed:', err)
  }

  const status = await initBank()
  console.info('[portable-leetcode] storage:', status)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', (event) => {
  if (quitting) return
  event.preventDefault()
  quitting = true
  void stopMysqlSidecar()
    .catch((err) => {
      console.error('[portable-leetcode] error stopping mysqld:', err)
    })
    .finally(() => {
      app.exit(0)
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
