import { CampaignService } from '@/services/CampaignService'
import { CartService } from '@/services/CartService'
import type { Campaign, CampaignExecutionResult } from '@/shared/types'

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
      debugMode: false,
      autoExtendCart: false
    }
  })
})

// Campaign alarm management
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Campaign alarm triggered:', alarm.name)

  if (alarm.name.startsWith('campaign_')) {
    const campaignId = alarm.name.replace('campaign_', '')
    await executeCampaign(campaignId)
  } else if (alarm.name === 'cart_extension') {
    await CartService.extendReservation()

    // Schedule next cart extension with random delay (2-7 minutes)
    await scheduleNextCartExtension()
  }
})

// Campaign execution function
async function executeCampaign(campaignId: string) {
  console.log('🚀 Executing campaign:', campaignId)

  try {
    // Get campaign configuration from storage
    const result = await chrome.storage.local.get(['campaigns'])
    const campaigns = result.campaigns || []
    const campaign: Campaign = campaigns.find((c: any) => c.id === campaignId)

    if (!campaign) {
      console.error('❌ Campaign not found:', campaignId)
      await showNotification('Błąd Kampanii', '❌ Kampania nie została znaleziona')
      return
    }

    console.log('📋 Campaign config:', {
      id: campaign.id,
      brands: campaign.filters.brands,
      size: campaign.filters.size,
      itemsToAdd: campaign.itemsToAdd,
      sortMethod: campaign.sortMethod,
      delay: campaign.delay
    })

    // Execute campaign using service
    const executionResult = await CampaignService.executeCampaign(campaign)

    // Update campaign with execution results
    await updateCampaignResults(campaign.id, executionResult)

    if (executionResult.success) {
      console.log('🎯 Campaign execution completed successfully!')

      const addedCount = executionResult.data?.successCount || 0
      await showNotification(
        'Kampania Zakończona!',
        `✅ Dodano ${addedCount} produktów do koszyka`
      )

      // Auto-enable cart extension if products were added
      if (addedCount > 0) {
        console.log(`🛒 Auto-enabling cart extension after adding ${addedCount} products to cart`)
        await toggleCartExtension(true)
      } else {
        console.log('⚠️ No products added to cart - not enabling cart extension')
      }
    } else {
      console.error('❌ Campaign execution failed:', executionResult.error)
      await showNotification('Błąd Kampanii', `❌ ${executionResult.error}`)
    }

  } catch (error) {
    console.error('❌ Campaign execution failed:', error)
    await showNotification('Błąd Kampanii', `❌ ${error}`)
  }
}


// Helper function for notifications
async function showNotification(title: string, message: string) {
  try {
    if (chrome.notifications) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
      })
      console.log('📱 Notification shown:', title, message)
    } else {
      console.log('📱 Notification (chrome.notifications not available):', title, message)
    }
  } catch (error) {
    console.error('Failed to show notification:', error)
    console.log('📱 Notification fallback:', title, message)
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
    case 'TOGGLE_CART_EXTENSION':
      toggleCartExtension(message.enabled)
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

  await chrome.alarms.create(alarmName, {
    when: campaign.executionTime
  })

  console.log('Campaign scheduled:', alarmName, new Date(campaign.executionTime))
}

// Cancel campaign alarm
async function cancelCampaign(campaignId: string) {
  const alarmName = `campaign_${campaignId}`
  await chrome.alarms.clear(alarmName)
  console.log('Campaign cancelled:', alarmName)
}

// Update campaign with execution results
async function updateCampaignResults(campaignId: string, result: CampaignExecutionResult) {
  try {
    const storage = await chrome.storage.local.get(['campaigns'])
    const campaigns = storage.campaigns || []

    const campaignIndex = campaigns.findIndex((c: any) => c.id === campaignId)
    if (campaignIndex !== -1) {
      campaigns[campaignIndex].success = result.success
      if (result.data) {
        campaigns[campaignIndex].addedToCart = result.data.successCount || 0
        campaigns[campaignIndex].totalFound = result.data.totalProducts || 0
      }

      await chrome.storage.local.set({ campaigns })
      console.log(`📊 Updated campaign ${campaignId} results:`, {
        success: result.success,
        addedToCart: campaigns[campaignIndex].addedToCart,
        totalFound: campaigns[campaignIndex].totalFound
      })
    }
  } catch (error) {
    console.error('❌ Failed to update campaign results:', error)
  }
}

// Cart extension control functions
async function toggleCartExtension(enabled: boolean) {
  console.log('🛒 Cart extension toggled:', enabled)

  // Update settings in storage
  const result = await chrome.storage.local.get(['settings'])
  const settings = result.settings || {}
  settings.autoExtendCart = enabled
  await chrome.storage.local.set({ settings })

  if (enabled) {
    // Start the cart extension alarm with random delay (2-7 minutes)
    await scheduleNextCartExtension()
    console.log('🟢 Cart extension alarm started (random 2-7 minute intervals)')
  } else {
    // Stop the cart extension alarm
    await chrome.alarms.clear('cart_extension')
    console.log('🔴 Cart extension alarm stopped')
  }
}

// Initialize cart extension on startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['settings'])
  const settings = result.settings || {}

  if (settings.autoExtendCart) {
    console.log('🔄 Restoring cart extension alarm on startup')
    await scheduleNextCartExtension()
  }
})

// Helper functions for random cart extension timing
function getRandomDelayMinutes(): number {
  // Random delay between 2-7 minutes
  return Math.floor(Math.random() * 6) + 2 // 2 + (0-5) = 2-7 minutes
}

async function scheduleNextCartExtension(): Promise<void> {
  const delayMinutes = getRandomDelayMinutes()

  await chrome.alarms.create('cart_extension', {
    delayInMinutes: delayMinutes
  })

  console.log(`⏰ Next cart extension scheduled in ${delayMinutes} minutes`)
}
