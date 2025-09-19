import { useState, useEffect } from 'react'
import type { Campaign } from '@/shared/types'

export function useCampaigns() {
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    loadActiveCampaigns()
  }, [])

  const loadActiveCampaigns = async () => {
    try {
      const result = await chrome.storage.local.get(['campaigns'])
      setActiveCampaigns(result.campaigns || [])
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    }
  }

  const scheduleCampaign = async (campaign: Campaign) => {
    try {
      const result = await chrome.storage.local.get(['campaigns'])
      const campaigns = result.campaigns || []
      campaigns.push(campaign)
      await chrome.storage.local.set({ campaigns })

      await chrome.runtime.sendMessage({
        type: 'SCHEDULE_CAMPAIGN',
        campaign
      })

      loadActiveCampaigns()
      return true
    } catch (error) {
      console.error('Failed to schedule campaign:', error)
      return false
    }
  }

  const cancelCampaign = async (campaignId: string) => {
    try {
      const result = await chrome.storage.local.get(['campaigns'])
      const campaigns = result.campaigns.filter((c: Campaign) => c.id !== campaignId)
      await chrome.storage.local.set({ campaigns })

      await chrome.runtime.sendMessage({
        type: 'CANCEL_CAMPAIGN',
        campaignId
      })

      loadActiveCampaigns()
      return true
    } catch (error) {
      console.error('Failed to cancel campaign:', error)
      return false
    }
  }

  const clearHistory = async () => {
    try {
      const result = await chrome.storage.local.get(['campaigns'])
      const now = Date.now()
      const futureCampaigns = result.campaigns?.filter((c: Campaign) => c.executionTime > now) || []
      await chrome.storage.local.set({ campaigns: futureCampaigns })

      loadActiveCampaigns()
      return true
    } catch (error) {
      console.error('Failed to clear campaign history:', error)
      return false
    }
  }

  return {
    activeCampaigns,
    scheduleCampaign,
    cancelCampaign,
    clearHistory,
    loadActiveCampaigns
  }
}