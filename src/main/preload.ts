import { contextBridge, ipcRenderer } from 'electron'
import type { Api, Command, Update } from '../shared'

const api: Api = {
  onUpdate: cb => ipcRenderer.on('update', (_e, u: Update) => cb(u)),
  ready: () => ipcRenderer.send('ready'),
  send: (cmd: Command) => ipcRenderer.send('command', cmd),
}

contextBridge.exposeInMainWorld('koikoi', api)
