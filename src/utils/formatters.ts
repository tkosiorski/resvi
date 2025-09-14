export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('pl-PL')
}

export const formatTime = (): string => {
  return new Date().toLocaleTimeString('pl-PL')
}

export const createLogEntry = (message: string): string => {
  const timestamp = formatTime()
  return `[${timestamp}] ${message}`
}

export const isValidCampaignId = (id: string): boolean => {
  return id.trim().length > 0
}

export const isValidExecutionTime = (time: string): boolean => {
  return time.trim().length > 0 && new Date(time).getTime() > Date.now()
}