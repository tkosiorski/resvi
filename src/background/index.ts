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
    await extendCartReservation()

    // Schedule next cart extension with random delay (2-7 minutes)
    await scheduleNextCartExtension()
  }
})

// Campaign execution function (V2 API direct)
async function executeCampaign(campaignId: string) {
  console.log('🚀 Executing V2 campaign:', campaignId)

  try {
    // Get campaign configuration from storage
    const result = await chrome.storage.local.get(['campaigns'])
    const campaigns = result.campaigns || []
    const campaign = campaigns.find((c: any) => c.id === campaignId)

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

    // Apply delay if specified
    const delay = campaign.delay || 500 // Default 500ms
    if (delay > 0) {
      console.log(`⏳ Applying delay: ${delay}ms before execution`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Execute V2 workflow with retry mechanism
    const workflowResult = await executeV2WorkflowWithRetry(campaign, 3)

    // Update campaign with execution results
    await updateCampaignResults(campaign.id, workflowResult)

    if (workflowResult.success) {
      console.log('🎯 V2 campaign execution completed successfully!')

      // Only auto-enable cart extension if products were actually added to cart
      const addedCount = workflowResult.data?.successCount || 0
      if (addedCount > 0) {
        console.log(`🛒 Auto-enabling cart extension after adding ${addedCount} products to cart`)
        await toggleCartExtension(true)
      } else {
        console.log('⚠️ No products added to cart - not enabling cart extension')
      }
    } else {
      console.error('❌ V2 campaign execution failed after retries')
    }

  } catch (error) {
    console.error('❌ Campaign execution failed:', error)
    await showNotification('Błąd Kampanii', `❌ ${error}`)
  }
}

// V2 Workflow with retry mechanism
async function executeV2WorkflowWithRetry(campaign: any, maxRetries: number = 3): Promise<{success: boolean, data?: any}> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 V2 Workflow attempt ${attempt}/${maxRetries}`)

    try {
      // Convert campaign to form data format for API
      const formData = {
        brands: campaign.filters.brands,
        size: campaign.filters.size,
        color: campaign.filters.color,
        maxPrice: campaign.filters.maxPrice,
        sortMethod: campaign.sortMethod,
        itemsToAdd: campaign.itemsToAdd,
        gender: '', // Will be inferred by API
        clothingCategory: '', // Will be inferred by API
        shoesCategory: '',
        accessoriesCategory: '',
        equipmentCategory: ''
      }

      console.log('🔧 Converted form data:', formData)

      // Convert to API filters
      const filters = convertFormToFilters(formData)
      console.log('🔧 API filters:', filters)

      // Execute the V2 API calls directly
      const result = await executeV2ApiWorkflow(campaign.id, filters, campaign.itemsToAdd)

      if (result.success) {
        console.log(`✅ V2 Workflow Success on attempt ${attempt}!`, result.data)
        await showNotification(
            'Kampania Zakończona!',
            `✅ Dodano ${result.data?.successCount || campaign.itemsToAdd} produktów do koszyka`
        )
        return { success: true, data: result.data }
      } else {
        console.error(`❌ V2 Workflow Failed on attempt ${attempt}:`, result.error)

        if (attempt === maxRetries) {
          await showNotification('Błąd Kampanii', `❌ ${result.error} (po ${maxRetries} próbach)`)
        } else {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 1s, 2s, 4s, max 10s
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

    } catch (error) {
      console.error(`❌ V2 Workflow Error on attempt ${attempt}:`, error)

      if (attempt === maxRetries) {
        await showNotification('Błąd Kampanii', `❌ ${error} (po ${maxRetries} próbach)`)
      } else {
        // Wait before retry
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return { success: false }
}

// Direct V2 API workflow execution
async function executeV2ApiWorkflow(campaignId: string, filters: any, itemsToAdd: number): Promise<any> {
  const baseUrl = 'https://www.zalando-lounge.pl/api/phoenix'

  try {
    // Build the request parameters
    const params = new URLSearchParams()

    // Add filters
    if (filters.brand_codes) params.append('brand_codes', filters.brand_codes)
    if (filters.category_ids) params.append('category_ids', filters.category_ids)
    if (filters.gender) params.append('gender', filters.gender)
    if (filters['sizes.shoes']) params.append('sizes.shoes', filters['sizes.shoes'])
    if (filters['sizes.clothing']) params.append('sizes.clothing', filters['sizes.clothing'])
    if (filters.price_max) params.append('price_max', filters.price_max)

    // Standard parameters
    params.append('size', '60')
    params.append('fields', '1')
    params.append('sort', filters.sort || 'relevance')
    params.append('no_soldout', '1')

    const url = `${baseUrl}/catalog/events/${campaignId}/articles?${params.toString()}`

    console.log('🌐 V2 API URL:', url)

    // Execute the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'pl,en-US;q=0.9,en;q=0.8',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📦 API Response:', data)

    // Handle different API response structures and extract products
    let products = []
    if (Array.isArray(data)) {
      products = data
    } else if (data?.configs && Array.isArray(data.configs)) {
      products = data.configs
    } else if (data?.articles && Array.isArray(data.articles)) {
      products = data.articles
    }

    console.log(`📊 Found ${products.length} products`)

    if (products.length === 0) {
      return {
        success: false,
        error: 'No products found matching the criteria'
      }
    }

    // Add products to cart
    const cartResults = await addProductsToCart(products.slice(0, itemsToAdd), campaignId)

    return {
      success: true,
      data: {
        totalProducts: products.length,
        successCount: cartResults.successCount,
        failedCount: cartResults.failedCount
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Add products to cart function
async function addProductsToCart(products: any[], campaignId: string): Promise<{successCount: number, failedCount: number}> {
  let successCount = 0
  let failedCount = 0

  console.log(`🛒 Adding ${products.length} products to cart...`)

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    try {
      // Log product structure for debugging
      console.log('🔍 Product structure:', Object.keys(product))
      console.log('🔍 Product simples:', product.simples)

      // Extract product information - check simples array for config keys
      const productId = product.sku || product.id || product.simple_key

      if (!productId) {
        console.error('❌ No product ID found for product:', product)
        console.error('❌ Available keys:', Object.keys(product))
        failedCount++
        continue
      }

      // Look for config keys in simples array (these are the cart-addable variants)
      const simples = product.simples || []
      if (!simples.length) {
        console.error('❌ No simples/variants found for product:', productId)
        failedCount++
        continue
      }

      // Try adding the first available variant to cart
      for (let simpleIndex = 0; simpleIndex < Math.min(simples.length, 3); simpleIndex++) {
        const simple = simples[simpleIndex]
        const simpleSku = simple.sku

        if (!simpleSku) {
          console.error(`❌ No sku found for variant ${simpleIndex}:`, simple)
          continue
        }

        // Check if this size is available
        if (simple.stockStatus !== 'AVAILABLE') {
          console.log(`⚠️ Size not available for variant ${simpleIndex}: ${simple.stockStatus}`)
          continue
        }

        console.log(`🛒 Adding product ${i + 1}/${products.length} variant ${simpleIndex + 1}: ${productId} -> ${simpleSku}`)

        // Add to cart API call using the working V2 format
        const cartResponse = await fetch('https://www.zalando-lounge.pl/api/phoenix/stockcart/cart/items', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'accept': '*/*',
            'accept-language': 'pl,en-US;q=0.9,en;q=0.8',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'referer': `https://www.zalando-lounge.pl/campaigns/${campaignId}`,
            'origin': 'https://www.zalando-lounge.pl',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
          },
          body: JSON.stringify({
            quantity: 1,
            campaignIdentifier: campaignId,
            configSku: productId,
            simpleSku: simpleSku,
            additional: { reco: 0 }
          })
        })

        if (cartResponse.ok) {
          const cartData = await cartResponse.json()
          console.log(`✅ Added product ${productId} variant ${simpleIndex + 1} to cart:`, cartData)
          successCount++
          break // Success - move to next product
        } else {
          const errorText = await cartResponse.text()
          console.error(`❌ Failed to add product ${productId} variant ${simpleIndex + 1} to cart:`, cartResponse.status, cartResponse.statusText)
          console.error(`❌ Error response:`, errorText.substring(0, 200) + '...')

          // If this was the last variant to try, count as failed
          if (simpleIndex === Math.min(simples.length, 3) - 1) {
            failedCount++
          }
        }

        // Small delay between variant attempts
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Small delay between products
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

    } catch (error) {
      console.error(`❌ Error adding product to cart:`, error)
      failedCount++
    }
  }

  console.log(`🛒 Cart operation completed: ${successCount} added, ${failedCount} failed`)
  return { successCount, failedCount }
}

// Simple form to filters converter for background context
function convertFormToFilters(formData: any): any {
  const filters: any = {}

  // Brand codes handling
  if (formData.brands && Array.isArray(formData.brands) && formData.brands.length > 0) {
    filters.brand_codes = formData.brands.join(',')
  }

  // Size handling
  if (formData.size) {
    const sizeNum = parseFloat(formData.size.split(',')[0])
    const isShoeSize = (sizeNum >= 35 && sizeNum <= 50)

    if (isShoeSize) {
      filters['sizes.shoes'] = formData.size
    } else {
      filters['sizes.clothing'] = formData.size
    }
  }

  // Price handling
  if (formData.maxPrice && formData.maxPrice > 0) {
    filters.price_max = (formData.maxPrice * 100).toString() // Convert to cents
  }

  // Sort method mapping
  if (formData.sortMethod) {
    const sortMap: Record<string, string> = {
      'popularne': 'relevance',
      'najniższa cena': 'price_asc',
      'najwyższa cena': 'price_desc',
      'wyprzedaż': 'savings'
    }
    filters.sort = sortMap[formData.sortMethod.toLowerCase()] || 'relevance'
  }

  return filters
}

// Cart extension function
async function extendCartReservation(): Promise<void> {
  try {
    console.log('🛒 Extending cart reservation...')

    const response = await fetch('https://www.zalando-lounge.pl/api/phoenix/stockcart/cart', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'accept': '*/*',
        'accept-language': 'pl,en-US;q=0.9,en;q=0.8',
        'content-type': 'application/json',
        'content-length': '0',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'origin': 'https://www.zalando-lounge.pl',
        'referer': 'https://www.zalando-lounge.pl/event',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest'
      }
    })

    if (response.ok) {
      console.log('✅ Cart reservation extended successfully')
    } else {
      console.warn('⚠️ Cart extension failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Error extending cart:', error)
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
async function updateCampaignResults(campaignId: string, result: {success: boolean, data?: any}) {
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
