export const isValidCampaignId = (id: string): boolean => {
  return id.trim().length > 0
}

export const isValidExecutionTime = (time: string): boolean => {
  return time.trim().length > 0 && new Date(time).getTime() > Date.now()
}