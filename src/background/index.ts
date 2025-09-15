// Background service worker for Resvi Chrome extension
console.log('Resvi background service worker started')

// Extension installation and startup
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Resvi extension installed:', details.reason)

  // Initialize default storage
  await chrome.storage.local.set({
    campaigns: [],
    settings: {
      defaultSortMethod: 'Popularne',
      maxItemsToAdd: 5,
      debugMode: false
    }
  })
})

// Campaign alarm management
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Campaign alarm triggered:', alarm.name)

  if (alarm.name.startsWith('campaign_')) {
    const campaignId = alarm.name.replace('campaign_', '')
    await executeCampaign(campaignId)
  }
})

// Campaign execution function (placeholder)
async function executeCampaign(campaignId: string) {
  console.log('Executing campaign:', campaignId)

  try {
    // Get campaign configuration from storage
    const result = await chrome.storage.local.get(['campaigns'])
    const campaigns = result.campaigns || []
    const campaign = campaigns.find((c: any) => c.id === campaignId)

    if (!campaign) {
      console.error('Campaign not found:', campaignId)
      return
    }

    // Open campaign URL in new tab
    const campaignUrl = `https://www.zalando-lounge.pl/campaigns/${campaignId}/1`
    const tab = await chrome.tabs.create({ url: campaignUrl })

    // TODO: Inject content script for automation
    console.log('Campaign tab opened:', tab.id)

  } catch (error) {
    console.error('Campaign execution failed:', error)
  }
}

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message)

  switch (message.type) {
    case 'SCHEDULE_CAMPAIGN':
      scheduleCampaign(message.campaign)
      sendResponse({ success: true })
      break
    case 'CANCEL_CAMPAIGN':
      cancelCampaign(message.campaignId)
      sendResponse({ success: true })
      break
    default:
      console.warn('Unknown message type:', message.type)
  }

  return true // Keep message channel open for async response
})

// Schedule campaign alarm
async function scheduleCampaign(campaign: any) {
  const alarmName = `campaign_${campaign.id}`

  // Add the configured delay to the execution time
  const delayedExecutionTime = campaign.executionTime + (campaign.executionDelay || 0)

  await chrome.alarms.create(alarmName, {
    when: delayedExecutionTime
  })

  console.log('Campaign scheduled:', alarmName, new Date(campaign.executionTime), `with ${campaign.executionDelay || 0}ms delay`)
}

// Cancel campaign alarm
async function cancelCampaign(campaignId: string) {
  const alarmName = `campaign_${campaignId}`
  await chrome.alarms.clear(alarmName)
  console.log('Campaign cancelled:', alarmName)
}
