// Debug Logger - wbudowany w rozszerzenie
export class DebugLogger {
  private static instance: DebugLogger
  private logs: Array<{
    timestamp: string
    level: string
    message: string
    url: string
    source: string
  }> = []

  private constructor() {
    this.setupLogger()
  }

  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger()
    }
    return DebugLogger.instance
  }

  private setupLogger() {
    // Przechwyć console.log/error/warn
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      this.log('LOG', args.join(' '))
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      this.log('ERROR', args.join(' '))
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      this.log('WARN', args.join(' '))
      originalWarn.apply(console, args)
    }

    // Przechwyć błędy JavaScript
    window.addEventListener('error', (e) => {
      this.log('JS_ERROR', `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`)
    })

    // Przechwyć błędy Promise
    window.addEventListener('unhandledrejection', (e) => {
      this.log('PROMISE_ERROR', `Unhandled promise rejection: ${e.reason}`)
    })

    console.log('🔍 Resvi Debug Logger activated!')
  }

  private log(level: string, message: string) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      url: window.location.href,
      source: this.getSource()
    }

    this.logs.push(entry)

    // Zapisz do storage co 5 logów
    if (this.logs.length % 5 === 0) {
      this.saveToStorage()
    }

    // Maksymalnie 1000 logów w pamięci
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-800) // Zostaw ostatnie 800
    }
  }

  private getSource(): string {
    if (window.location.href.includes('popup')) return 'POPUP'
    if (window.location.href.includes('zalando-lounge.pl')) return 'CONTENT_SCRIPT'
    if (typeof chrome !== 'undefined' && chrome.runtime) return 'BACKGROUND'
    return 'UNKNOWN'
  }

  private async saveToStorage() {
    try {
      // Pobierz istniejące logi z storage
      const result = await chrome.storage.local.get(['debugLogs'])
      const existingLogs = result.debugLogs || []

      // Dodaj nowe logi
      const allLogs = [...existingLogs, ...this.logs]

      // Zostaw maksymalnie 5000 logów w storage
      const logsToSave = allLogs.slice(-5000)

      await chrome.storage.local.set({ debugLogs: logsToSave })

      // Wyczyść logi z pamięci (zostały zapisane)
      this.logs = []
    } catch (error) {
      console.error('Failed to save debug logs:', error)
    }
  }

  // Publiczne metody do użycia w kodzie
  public async downloadLogs(): Promise<void> {
    try {
      // Zapisz obecne logi
      await this.saveToStorage()

      // Pobierz wszystkie logi
      const result = await chrome.storage.local.get(['debugLogs'])
      const allLogs = result.debugLogs || []

      const logText = allLogs.map((entry: any) =>
        `[${entry.timestamp}] ${entry.level} (${entry.source}): ${entry.message}\n` +
        `URL: ${entry.url}\n` +
        `---\n`
      ).join('\n')

      const blob = new Blob([logText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resvi-debug-${new Date().toISOString().slice(0, 19)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('📥 Debug log downloaded! Total entries:', allLogs.length)
    } catch (error) {
      console.error('Failed to download logs:', error)
    }
  }

  public async clearLogs(): Promise<void> {
    try {
      await chrome.storage.local.remove(['debugLogs'])
      this.logs = []
      console.log('🧹 Debug logs cleared!')
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  public async showRecentLogs(count: number = 50): Promise<void> {
    try {
      await this.saveToStorage()
      const result = await chrome.storage.local.get(['debugLogs'])
      const allLogs = result.debugLogs || []
      console.table(allLogs.slice(-count))
    } catch (error) {
      console.error('Failed to show logs:', error)
    }
  }

  // Force save na zamknięcie
  public async forceSave(): Promise<void> {
    if (this.logs.length > 0) {
      await this.saveToStorage()
    }
  }
}