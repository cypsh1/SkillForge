export function downloadFile(
  filename: string,
  content: string,
  mimeType?: string
): void {
  const blob = new Blob([content], {
    type: mimeType ?? "text/plain;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadJson(filename: string, data: unknown): void {
  const content = JSON.stringify(data, null, 2)
  downloadFile(filename, content, "application/json;charset=utf-8")
}
