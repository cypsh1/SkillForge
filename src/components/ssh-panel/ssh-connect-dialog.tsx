import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, FolderOpen } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  connectSSH,
  disconnectSSH,
  DEFAULT_SSH_PORT,
  DEFAULT_REMOTE_PATH,
  type SSHConfig,
  type ConnectionInfo,
} from "@/lib/remote-fs"
import { isTauri } from "@/lib/tauri-fs"
import { loadAppConfig, saveAppConfig } from "@/lib/app-config"

interface SSHConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: ConnectionInfo | null
  onConnected: (info: ConnectionInfo) => void
  onDisconnected: () => void
}

export function SSHConnectDialog({
  open,
  onOpenChange,
  connection,
  onConnected,
  onDisconnected,
}: SSHConnectDialogProps) {
  const { t } = useTranslation()
  const [host, setHost] = useState("")
  const [port, setPort] = useState(String(DEFAULT_SSH_PORT))
  const [user, setUser] = useState("root")
  const [keyPath, setKeyPath] = useState("")
  const [remotePath, setRemotePath] = useState(DEFAULT_REMOTE_PATH)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")
  const [configLoaded, setConfigLoaded] = useState(false)

  // Load saved config on first open
  useEffect(() => {
    if (!open || configLoaded || connection?.connected) return
    if (!isTauri()) return

    loadAppConfig().then((config) => {
      const saved = config.sshConnections[0]
      if (saved) {
        setHost(saved.host)
        setPort(String(saved.port))
        setUser(saved.user)
        setKeyPath(saved.keyPath)
        setRemotePath(saved.remotePath)
      }
      setConfigLoaded(true)
    }).catch(() => {
      setConfigLoaded(true)
    })
  }, [open, configLoaded, connection?.connected])

  const handleBrowseKey = useCallback(async () => {
    if (!isTauri()) return
    const { open: dialogOpen } = await import("@tauri-apps/plugin-dialog")
    const selected = await dialogOpen({
      multiple: false,
      title: t("workspace.ssh.selectKey"),
    })
    if (selected) {
      setKeyPath(String(selected))
    }
  }, [t])

  const handleConnect = useCallback(async () => {
    setError("")
    setConnecting(true)
    try {
      const config: SSHConfig = {
        host: host.trim(),
        port: parseInt(port, 10) || DEFAULT_SSH_PORT,
        user: user.trim(),
        keyPath: keyPath.trim(),
        remotePath: remotePath.trim(),
      }
      const info = await connectSSH(config)

      // Save config for next session
      if (isTauri()) {
        try {
          const appConfig = await loadAppConfig()
          appConfig.sshConnections = [{
            name: host.trim(),
            ...config,
          }]
          await saveAppConfig(appConfig)
        } catch {
          // non-critical: config save failure doesn't block connection
        }
      }

      onConnected(info)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setConnecting(false)
    }
  }, [host, port, user, keyPath, remotePath, onConnected, onOpenChange])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectSSH()
      onDisconnected()
    } catch {
      // ignore
    }
  }, [onDisconnected])

  const canConnect = host.trim() && user.trim() && keyPath.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t("workspace.ssh.connectTitle")}</DialogTitle>

        {connection?.connected ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              {t("workspace.ssh.connectedTo", { host: connection.host })}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("workspace.ssh.remotePath")}: <span className="font-mono">{connection.remote_path}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              {t("workspace.ssh.disconnect")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div>
                <Label className="text-xs">{t("workspace.ssh.host")}</Label>
                <Input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="openclaw"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">{t("workspace.ssh.port")}</Label>
                <Input
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="22"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">{t("workspace.ssh.user")}</Label>
              <Input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="root"
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">{t("workspace.ssh.keyPath")}</Label>
              <div className="flex gap-1.5">
                <Input
                  value={keyPath}
                  onChange={(e) => setKeyPath(e.target.value)}
                  placeholder="~/.ssh/id_rsa"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 shrink-0"
                  onClick={handleBrowseKey}
                >
                  <FolderOpen className="size-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">{t("workspace.ssh.remotePath")}</Label>
              <Input
                value={remotePath}
                onChange={(e) => setRemotePath(e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                size="sm"
                disabled={!canConnect || connecting}
                onClick={handleConnect}
              >
                {connecting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {connecting
                  ? t("workspace.ssh.connecting")
                  : t("workspace.ssh.connect")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
