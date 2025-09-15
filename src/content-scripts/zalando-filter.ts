// Simple logging function that saves to storage for debug logger
function logToStorage(level: string, message: string) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      url: window.location.href,
      source: 'CONTENT_SCRIPT'
    }

    // Get existing logs and add new one
    chrome.storage.local.get(['debugLogs']).then(result => {
      const logs = result.debugLogs || []
      logs.push(entry)

      // Keep only last 1000 logs
      const logsToSave = logs.slice(-1000)
      chrome.storage.local.set({ debugLogs: logsToSave })
    }).catch(() => {
      // Fail silently if storage is not available
    })
  } catch (error) {
    // Fail silently
  }
}

interface FilterConfig {
  brand?: string[]
  size?: string[]
  color?: string
  maxPrice?: number
  sortMethod?: string
  itemsToAdd?: number
  category?: {
    gender?: string // 'Kobiety' | 'Mężczyźni'
    clothingCategory?: string // 'Wszystkie w kategorii Odzież' or specific subcategory
    shoesCategory?: string // 'Wszystkie w kategorii Buty' or specific subcategory
    accessoriesCategory?: string // 'Wszystkie w kategorii Akcesoria' or specific subcategory
    equipmentCategory?: string // 'Wszystkie w kategorii Sprzęt' or specific subcategory
  }
}

class ZalandoFilter {
  private config: FilterConfig = {}
  private retryCount = 0
  private maxRetries = 15 // More attempts for reliability
  private retryDelay = 50 // Ultra-fast retries

  constructor() {
    this.init()
    this.checkForAutoReservation()
  }

  private async init() {
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔵 Content script received message:', message)

      if (message.type === 'PING') {
        console.log('🏓 Content script received PING, sending PONG')
        sendResponse({ pong: true })
        return true
      }

      if (message.type === 'APPLY_FILTERS') {
        console.log('🔵 Starting filter application with config:', message.config)
        this.applyFilters(message.config)
          .then(() => {
            console.log('✅ Filter application completed successfully')
            sendResponse({ success: true })

            // Start product reservations AFTER successful filtering
            if (message.config.itemsToAdd && message.config.itemsToAdd > 0) {
              console.log(`🛒 Starting product reservations for ${message.config.itemsToAdd} items`)
              setTimeout(() => {
                // Parse sizes if needed (config.size is already string[] from popup)
                const sizeFilters = Array.isArray(message.config.size) ? message.config.size :
                  (message.config.size ? [message.config.size] : [])

                console.log(`📏 Using size filters for reservation:`, sizeFilters)

                this.startProductReservationsWithWait(message.config.itemsToAdd, sizeFilters)
                  .catch(error => {
                    console.error('❌ Product reservation failed:', error)
                  })
              }, 1000) // Start reservations 1 second after successful filtering
            }
          })
          .catch((error) => {
            console.error('❌ Filter application failed:', error)
            sendResponse({ success: false, error: error.message })
          })
        return true // Keep message channel open for async response
      }

    })

    console.log('🟢 Zalando Filter content script loaded on:', window.location.href)
  }

  private async checkForAutoReservation(): Promise<void> {
    try {
      // Check if this page was opened for automatic reservation
      const urlParams = new URLSearchParams(window.location.search)
      const autoReserveId = urlParams.get('autoReserve')

      if (autoReserveId) {
        console.log(`🔄 Auto-reservation triggered for: ${autoReserveId}`)
        logToStorage('LOG', `🔄 Auto-reservation triggered for: ${autoReserveId}`)

        // Get reservation data from localStorage
        const reservationDataStr = localStorage.getItem(autoReserveId)
        if (reservationDataStr) {
          const reservationData = JSON.parse(reservationDataStr)

          console.log(`🛒 Starting auto-reservation with data:`, reservationData)

          // Wait a moment for page to start loading
          setTimeout(async () => {
            try {
              await this.reserveCurrentProduct(reservationData.sizeFilters, reservationData.itemNumber)
            } catch (error) {
              console.error('Auto-reservation failed:', error)
            }
          }, 1000)

          // Clean up
          localStorage.removeItem(autoReserveId)
        } else {
          console.error('Auto-reservation data not found in localStorage')
        }
      }
    } catch (error) {
      console.error('Error checking for auto-reservation:', error)
    }
  }

  private async applyFilters(config: FilterConfig) {
    this.config = config
    console.log('🔧 Applying filters with config:', config)

    // Wait for page to load
    console.log('⏳ Waiting for page to load...')
    await this.waitForPageLoad()
    console.log('✅ Page loaded, proceeding with filters')

    // Pre-check critical elements for instant failure detection
    const criticalElements = [
      '[data-testid="filter-tabs-container-with-header"]',
      '[data-testid="sort-filter"]'
    ]

    for (const selector of criticalElements) {
      if (!document.querySelector(selector)) {
        console.log(`⚡ Pre-warming: ${selector}...`)
      }
    }

    // Log current page structure
    this.logPageStructure()

    // Apply filters in tab order: Category → Brand → Size → Sort

    // 1. Apply category filter first (if specified)
    if (config.category && (config.category.gender || config.category.clothingCategory || config.category.shoesCategory || config.category.accessoriesCategory || config.category.equipmentCategory)) {
      console.log('🏷️ [1/4] Applying category filter:', config.category)
      await this.applyCategoryFilter(config.category)
    } else {
      console.log('⚠️ [1/4] No category filter to apply')
    }

    // 2. Apply brand filter second (if specified)
    if (config.brand && config.brand.length > 0) {
      console.log('🏷️ [2/4] Applying brand filter for brands:', config.brand)
      await this.applyBrandFilter(config.brand)
    } else {
      console.log('⚠️ [2/4] No brand filter to apply')
    }

    // 3. Apply size filter third (if specified)
    if (config.size && config.size.length > 0) {
      console.log('📏 [3/4] Applying size filter for sizes:', config.size)
      await this.applySizeFilter(config.size)
    } else {
      console.log('⚠️ [3/4] No size filter to apply')
    }

    // 4. Apply sorting last (if specified)
    if (config.sortMethod) {
      console.log('🔄 [4/4] Applying sort method:', config.sortMethod)
      await this.applySortFilter(config.sortMethod)
    } else {
      console.log('⚠️ [4/4] No sort method to apply')
    }

    console.log('🎯 Filter application process completed')
  }

  private logPageStructure() {
    console.log('📄 Current page URL:', window.location.href)
    console.log('📄 Page title:', document.title)

    // Log filter tabs container
    const filterTabsContainer = document.querySelector('[data-testid="filter-tabs-container-with-header"]')
    console.log('🗂️ Filter tabs container found:', !!filterTabsContainer)
    if (filterTabsContainer) {
      console.log('🗂️ Filter tabs container HTML:', filterTabsContainer.outerHTML.substring(0, 500) + '...')
    }

    // Log all tab buttons
    const tabButtons = document.querySelectorAll('button[role="tab"]')
    console.log('🔘 Found', tabButtons.length, 'tab buttons')
    tabButtons.forEach((btn, index) => {
      console.log(`🔘 Tab ${index}:`, btn.textContent?.trim(), btn.outerHTML.substring(0, 200) + '...')
    })

    // Log brand items if visible
    const brandItems = document.querySelectorAll('[data-testid="brand-item"]')
    console.log('🏷️ Found', brandItems.length, 'brand items')
    if (brandItems.length > 0) {
      brandItems.forEach((item, index) => {
        if (index < 5) { // Log first 5 items
          console.log(`🏷️ Brand ${index}:`, item.textContent?.trim())
        }
      })
    }
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      // Check if DOM is already interactive or complete
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        resolve()
      } else {
        // Wait for DOM to be interactive (faster than waiting for full load)
        document.addEventListener('DOMContentLoaded', () => resolve())
      }
    })
  }

  private async applyBrandFilter(brands: string[]): Promise<void> {
    console.log('🔍 Applying brand filter for:', brands)

    // Wait for filter tabs to be available
    console.log('⏳ Waiting for filter tabs container...')
    const filterTabsContainer = await this.waitForElement('[data-testid="filter-tabs-container-with-header"]', 3000) // Reduced timeout for faster failure detection
    if (!filterTabsContainer) {
      console.error('❌ Filter tabs container not found after timeout')
      return
    }
    console.log('✅ Filter tabs container found')

    // Find and click the brand tab
    console.log('🔍 Looking for brand tab...')
    const brandTab = await this.findBrandTab()
    if (!brandTab) {
      console.error('❌ Brand tab not found')
      return
    }

    console.log('✅ Brand tab found, clicking...', brandTab.textContent?.trim())
    brandTab.click()

    // Wait for brand list to appear
    console.log('⏳ Waiting for brand list to appear...')
    const subFilterWrapper = await this.waitForElement('[data-testid="sub-filter-wrapper"]', 3000) // Reduced timeout for faster failure detection
    if (!subFilterWrapper) {
      console.error('❌ Brand list did not appear after clicking')
      return
    }
    console.log('✅ Brand list appeared')

    // Find and select matching brands
    console.log('🔍 Selecting matching brands...')
    await this.selectMatchingBrands(brands)
  }

  private async findBrandTab(): Promise<HTMLElement | null> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const tabButtons = document.querySelectorAll('button[role="tab"]')
      console.log(`🔍 Attempt ${attempts + 1}: Found ${tabButtons.length} tab buttons`)

      for (let i = 0; i < tabButtons.length; i++) {
        const button = tabButtons[i]
        const textContent = button.textContent?.toLowerCase() || ''
        console.log(`🔘 Tab ${i}: "${textContent}"`)

        if (textContent.includes('marka')) {
          console.log(`✅ Found brand tab at index ${i}: "${textContent}"`)
          return button as HTMLElement
        }
      }

      await this.delay(50) // Ultra-fast brand tab search
      attempts++
      console.log(`⚠️ Brand tab not found in attempt ${attempts}, retrying...`)
    }

    console.error('❌ Brand tab not found after all attempts')
    return null
  }

  private async selectMatchingBrands(targetBrands: string[]): Promise<void> {
    const maxAttempts = 20
    let attempts = 0

    while (attempts < maxAttempts) {
      const brandItems = document.querySelectorAll('[data-testid="brand-item"]')
      console.log(`🔍 Attempt ${attempts + 1}: Found ${brandItems.length} brand items`)

      if (brandItems.length > 0) {
        let selectedCount = 0
        let allBrands: string[] = []

        // First, collect all available brands for logging
        brandItems.forEach((item, index) => {
          const brandText = item.textContent?.trim() || ''
          allBrands.push(brandText)
          if (index < 10) { // Log first 10 brands
            console.log(`🏷️ Available brand ${index}: "${brandText}"`)
          }
        })

        if (allBrands.length > 10) {
          console.log(`🏷️ ... and ${allBrands.length - 10} more brands`)
        }

        console.log(`🎯 Looking for target brands:`, targetBrands)

        // Now try to match and select brands
        for (const item of brandItems) {
          const brandText = item.textContent?.trim() || ''
          const isPressed = item.getAttribute('aria-pressed') === 'true'

          // Check if this brand matches any of our target brands
          for (const targetBrand of targetBrands) {
            const matches = this.brandMatches(brandText, targetBrand.trim())

            if (matches) {
              console.log(`✅ Match found: "${brandText}" matches target "${targetBrand}"`)

              if (!isPressed) {
                console.log(`🖱️ Clicking brand: "${brandText}"`)
                try {
                  (item as HTMLElement).click()
                  selectedCount++
                  await this.delay(30) // Minimal delay between clicks
                } catch (clickError) {
                  console.error('Error clicking brand:', clickError)
                }
              } else {
                console.log(`⚠️ Brand "${brandText}" already selected`)
              }
              break
            }
          }
        }

        try {
          // Count already selected brands that match our targets
          let alreadySelectedCount = 0
          brandItems.forEach((item) => {
            const brandText = item.textContent?.trim() || ''
            const isPressed = item.getAttribute('aria-pressed') === 'true'

            if (isPressed) {
              for (const targetBrand of targetBrands) {
                if (this.brandMatches(brandText, targetBrand.trim())) {
                  alreadySelectedCount++
                  break
                }
              }
            }
          })

          console.log(`📊 Selection summary: ${selectedCount} new selections, ${alreadySelectedCount} already selected`)

          // If we have all target brands selected (new + already selected), we're done
          const totalMatched = selectedCount + alreadySelectedCount
          if (totalMatched >= targetBrands.length) {
            console.log(`✅ All ${totalMatched} target brands are now selected (${selectedCount} new, ${alreadySelectedCount} pre-selected)`)
            return
          } else if (selectedCount > 0) {
            console.log(`✅ Successfully selected ${selectedCount} new brands`)
            return
          } else {
            console.log(`⚠️ No new brands selected in this attempt`)
          }
        } catch (logError) {
          console.error('Error in logging:', logError)
        }
      }

      await this.delay(50) // Optimized for faster retry
      attempts++
      console.log(`⚠️ Retrying brand selection, attempt ${attempts}...`)
    }

    console.error('❌ Could not find matching brands after maximum attempts')
  }

  private brandMatches(brandText: string, targetBrand: string): boolean {
    const normalizedBrandText = brandText.toLowerCase()
    const normalizedTarget = targetBrand.toLowerCase()

    // Exact match
    if (normalizedBrandText === normalizedTarget) {
      return true
    }

    // Check if brand text contains target (e.g., "adidas Originals" contains "adidas")
    if (normalizedBrandText.includes(normalizedTarget)) {
      return true
    }

    // Check if target contains brand text (e.g., target "adidas originals" contains "adidas")
    if (normalizedTarget.includes(normalizedBrandText)) {
      return true
    }

    return false
  }

  private async waitForElement(selector: string, timeout: number = 3000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector)
        if (element) {
          obs.disconnect()
          resolve(element)
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      setTimeout(() => {
        observer.disconnect()
        resolve(null)
      }, timeout)
    })
  }

  private async applySizeFilter(targetSizes: string[]): Promise<void> {
    console.log('📏 Applying size filter for:', targetSizes)

    // Find and click the size tab first
    const sizeTab = await this.findSizeTab()
    if (!sizeTab) {
      console.error('❌ Size tab not found')
      return
    }

    console.log('✅ Size tab found, clicking...')
    sizeTab.click()

    // Wait for size category tabs to appear
    console.log('⏳ Waiting for size category tabs to appear...')
    await this.waitForElement('[class*="SizeTabs-"]', 3000)

    // Find and click the shoes tab for shoe sizes
    const shoesTab = await this.findShoesTab()
    if (shoesTab) {
      console.log('✅ Shoes tab found, clicking...')
      shoesTab.click()
      await this.delay(200)
    }

    // Wait for size list to appear
    console.log('⏳ Waiting for size list to appear...')
    await this.waitForElement('[data-testid="sub-filter-wrapper"]', 3000)

    // Find and select matching sizes
    await this.selectMatchingSizes(targetSizes)
  }

  private async findSizeTab(): Promise<HTMLElement | null> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const tabButtons = document.querySelectorAll('button[role="tab"]')
      console.log(`🔍 Looking for size tab, attempt ${attempts + 1}`)

      for (let i = 0; i < tabButtons.length; i++) {
        const button = tabButtons[i]
        const textContent = button.textContent?.toLowerCase() || ''
        console.log(`🔘 Size tab search ${i}: "${textContent}"`)

        if (textContent.includes('rozmiar')) {
          console.log(`✅ Found size tab at index ${i}: "${textContent}"`)
          return button as HTMLElement
        }
      }

      await this.delay(50) // Optimized for faster tab search
      attempts++
    }

    console.error('❌ Size tab not found after all attempts')
    return null
  }

  private async findShoesTab(): Promise<HTMLElement | null> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      // Look for size category tabs using both current and potential future class names
      const sizeTabs = document.querySelectorAll('button[role="tab"][aria-selected]')
      console.log(`🔍 Looking for shoes tab, attempt ${attempts + 1}, found ${sizeTabs.length} size tabs`)

      for (let i = 0; i < sizeTabs.length; i++) {
        const button = sizeTabs[i]
        const textContent = button.textContent?.toLowerCase() || ''
        console.log(`🔘 Size category tab ${i}: "${textContent}"`)

        if (textContent.includes('obuwie') || textContent.includes('shoes')) {
          console.log(`✅ Found shoes tab at index ${i}: "${textContent}"`)
          return button as HTMLElement
        }
      }

      await this.delay(50)
      attempts++
    }

    console.log('⚠️ Shoes tab not found, continuing without specific shoe category selection')
    return null
  }

  private async selectMatchingSizes(targetSizes: string[]): Promise<void> {
    console.log('📏 Selecting sizes for targets:', targetSizes)

    // Generate all size variations for all target sizes
    const sizesToSelect: string[] = []
    targetSizes.forEach(size => {
      const variations = this.generateSizeVariations(size.trim())
      sizesToSelect.push(...variations)
    })

    // Remove duplicates
    const uniqueSizesToSelect = [...new Set(sizesToSelect)]
    console.log('🎯 Will look for all sizes:', uniqueSizesToSelect)

    const maxAttempts = 20
    let attempts = 0

    while (attempts < maxAttempts) {
      // Look for size checkboxes using the structure we found
      const sizeCheckboxes = document.querySelectorAll('li[class*="SizeCheckboxWrapperLi-"] input[type="checkbox"]')
      console.log(`🔍 Attempt ${attempts + 1}: Found ${sizeCheckboxes.length} size checkboxes`)

      if (sizeCheckboxes.length > 0) {
        let selectedCount = 0

        for (const checkbox of sizeCheckboxes) {
          try {
            // Get the label text for this checkbox - it's the span in the same label element
            const labelElement = checkbox.closest('label')?.querySelector('span:last-child')
            const sizeText = labelElement?.textContent?.trim() || ''

            if (uniqueSizesToSelect.includes(sizeText)) {
              console.log(`✅ Found matching size: "${sizeText}"`)

              // Check if not already selected
              if (!checkbox.checked) {
                console.log(`🖱️ Clicking size checkbox: "${sizeText}"`)
                logToStorage('LOG', `🖱️ Clicking size checkbox: "${sizeText}" (count before: ${selectedCount})`)

                try {
                  (checkbox as HTMLElement).click()
                  selectedCount = selectedCount + 1  // Explicit increment
                  logToStorage('LOG', `✅ Clicked size checkbox, new count: ${selectedCount}`)
                  await this.delay(30)
                } catch (clickError) {
                  logToStorage('ERROR', `Failed to click size checkbox: ${clickError}`)
                  console.error('Failed to click size checkbox:', clickError)
                }
              } else {
                console.log(`⚠️ Size "${sizeText}" already selected`)
                logToStorage('LOG', `⚠️ Size "${sizeText}" already selected`)
              }
            }
          } catch (error) {
            console.error('Error processing size checkbox:', error)
          }
        }

        // Count already selected sizes that match our targets
        let alreadySelectedCount = 0
        sizeCheckboxes.forEach((checkbox) => {
          const labelElement = checkbox.closest('label')?.querySelector('span:last-child')
          const sizeText = labelElement?.textContent?.trim() || ''

          if (checkbox.checked && uniqueSizesToSelect.includes(sizeText)) {
            alreadySelectedCount++
          }
        })

        // Safe logging with type checking
        const countValue = selectedCount
        const countType = typeof countValue

        logToStorage('LOG', `Size selection completed: ${countValue} new, ${alreadySelectedCount} already selected (type: ${countType})`)

        // If we have matching sizes (new + already selected), we're done
        const totalMatched = countValue + alreadySelectedCount
        if (totalMatched > 0) {
          console.log(`✅ Successfully selected ${totalMatched} sizes (${countValue} new, ${alreadySelectedCount} pre-selected)`)
          logToStorage('LOG', `✅ Successfully selected ${totalMatched} sizes total`)
          return
        } else {
          console.log(`⚠️ No matching sizes found in this attempt`)
          logToStorage('LOG', `⚠️ No matching sizes found in this attempt`)
        }
      }

      await this.delay(50) // Optimized for faster retry for sizes
      attempts++
    }

    console.error('❌ Could not find matching sizes after maximum attempts')
  }

  private generateSizeVariations(baseSize: string): string[] {
    const variations: string[] = [baseSize]

    // Add half size (e.g., 46 -> 46.5)
    const halfSize = `${baseSize}.5`
    variations.push(halfSize)

    // Add fractional variations that might exist
    const fractional1_3 = `${baseSize} 1/3`
    const fractional2_3 = `${baseSize} 2/3`
    variations.push(fractional1_3, fractional2_3)

    console.log(`📏 Generated size variations for "${baseSize}":`, variations)
    return variations
  }

  private async applyCategoryFilter(categoryConfig: FilterConfig['category']): Promise<void> {
    console.log('📂 Applying category filter:', categoryConfig)

    // Find and click the category tab first
    const categoryTab = await this.findCategoryTab()
    if (!categoryTab) {
      console.error('❌ Category tab not found')
      return
    }

    console.log('✅ Category tab found, clicking...')
    categoryTab.click()

    // Wait for category list to appear
    console.log('⏳ Waiting for category list to appear...')
    const categoryFilter = await this.waitForElement('[data-testid="category-filter"]', 3000) // Reduced timeout for faster failure detection
    if (!categoryFilter) {
      console.error('❌ Category filter did not appear after clicking')
      return
    }
    console.log('✅ Category filter appeared')

    // Apply gender filter first if specified
    if (categoryConfig?.gender) {
      console.log('🚹 Selecting gender first:', categoryConfig.gender)
      await this.selectGender(categoryConfig.gender)

      // Wait for categories to load after gender selection
      console.log('⏳ Waiting for categories to load after gender selection...')
      await this.delay(300) // Reduced gender selection wait
      console.log('✅ Ready to apply category filters')
    }

    // Apply specific category filters only if gender is selected
    if (categoryConfig?.gender) {
      if (categoryConfig?.clothingCategory) {
        console.log('🎯 Applying clothing category filter after gender selection')
        await this.selectClothingCategory(categoryConfig.clothingCategory)
      }

      if (categoryConfig?.shoesCategory) {
        console.log('🎯 Applying shoes category filter after gender selection')
        await this.selectShoesCategory(categoryConfig.shoesCategory)
      }

      if (categoryConfig?.accessoriesCategory) {
        console.log('🎯 Applying accessories category filter after gender selection')
        await this.selectAccessoriesCategory(categoryConfig.accessoriesCategory)
      }

      if (categoryConfig?.equipmentCategory) {
        console.log('🎯 Applying equipment category filter after gender selection')
        await this.selectEquipmentCategory(categoryConfig.equipmentCategory)
      }
    } else {
      console.log('⚠️ No gender selected, skipping category filters')
    }
  }

  private async findCategoryTab(): Promise<HTMLElement | null> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const tabButtons = document.querySelectorAll('button[role="tab"]')
      console.log(`🔍 Looking for category tab, attempt ${attempts + 1}`)

      for (let i = 0; i < tabButtons.length; i++) {
        const button = tabButtons[i]
        const textContent = button.textContent?.toLowerCase() || ''
        console.log(`🔘 Category tab search ${i}: "${textContent}"`)

        if (textContent.includes('kategorie')) {
          console.log(`✅ Found category tab at index ${i}: "${textContent}"`)
          return button as HTMLElement
        }
      }

      await this.delay(50)
      attempts++
    }

    console.error('❌ Category tab not found after all attempts')
    return null
  }

  private async selectGender(targetGender: string): Promise<void> {
    console.log('👤 Selecting gender:', targetGender)
    logToStorage('LOG', `👤 Starting gender selection: ${targetGender}`)

    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      // Look for gender category items (li elements)
      const genderItems = document.querySelectorAll('[data-testid="category-filter-level-one-category"]')
      console.log(`🔍 Gender selection attempt ${attempts + 1}: Found ${genderItems.length} gender items`)
      logToStorage('LOG', `🔍 Gender selection attempt ${attempts + 1}: Found ${genderItems.length} gender items`)

      for (const item of genderItems) {
        const genderText = item.getAttribute('aria-label') || ''
        console.log(`🔍 Checking gender item: "${genderText}"`)
        logToStorage('LOG', `🔍 Checking gender item: "${genderText}"`)

        // Check if this matches our target gender
        const isMatch =
          genderText.toLowerCase().includes(targetGender.toLowerCase()) ||
          (targetGender.toLowerCase().includes('mężczyz') && genderText.toLowerCase().includes('mężczyz')) ||
          (targetGender.toLowerCase().includes('kobiet') && genderText.toLowerCase().includes('kobiet'))

        if (isMatch) {
          console.log(`✅ Found matching gender item: "${genderText}"`)
          logToStorage('LOG', `✅ Found matching gender item: "${genderText}"`)

          // Find the button inside this item
          const button = item.querySelector('button[type="button"]')
          if (button) {
            const isPressed = button.getAttribute('aria-pressed') === 'true'
            const isSelected = item.getAttribute('data-selected') === 'true'

            console.log(`🔍 Button state - pressed: ${isPressed}, selected: ${isSelected}`)
            logToStorage('LOG', `🔍 Button state - pressed: ${isPressed}, selected: ${isSelected}`)

            if (!isPressed && !isSelected) {
              console.log(`🖱️ Clicking gender button: "${genderText}"`)
              logToStorage('LOG', `🖱️ Clicking gender button: "${genderText}"`);  // Added semicolon
              (button as HTMLElement).click()
              await this.delay(200) // Fast gender selection
              return
            } else {
              console.log(`⚠️ Gender "${genderText}" already selected`)
              logToStorage('LOG', `⚠️ Gender "${genderText}" already selected`)
              return
            }
          } else {
            console.error('❌ No button found in gender item')
            logToStorage('ERROR', 'No button found in gender item')
          }
        }
      }

      await this.delay(50) // Faster category polling
      attempts++
    }

    console.error('❌ Could not find matching gender after maximum attempts')
    logToStorage('ERROR', `Could not find matching gender "${targetGender}" after ${maxAttempts} attempts`)
  }

  private async selectClothingCategory(targetCategory: string): Promise<void> {
    console.log('👕 Selecting clothing category:', targetCategory)
    await this.selectCategoryByType(targetCategory, 'Odzież')
  }

  private async selectShoesCategory(targetCategory: string): Promise<void> {
    console.log('👟 Selecting shoes category:', targetCategory)
    await this.selectCategoryByType(targetCategory, 'Buty')
  }

  private async selectAccessoriesCategory(targetCategory: string): Promise<void> {
    console.log('🎒 Selecting accessories category:', targetCategory)
    await this.selectCategoryByType(targetCategory, 'Akcesoria')
  }

  private async selectEquipmentCategory(targetCategory: string): Promise<void> {
    console.log('⚽ Selecting equipment category:', targetCategory)
    await this.selectCategoryByType(targetCategory, 'Sprzęt')
  }

  private async selectCategoryByType(targetCategory: string, categoryType: string): Promise<void> {
    console.log(`📂 Selecting ${categoryType} category: ${targetCategory}`)
    logToStorage('LOG', `📂 Starting ${categoryType} category selection: ${targetCategory}`)

    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      // First, look for "Wszystkie artykuły w X" buttons (main category buttons)
      const mainCategoryButtons = document.querySelectorAll('.Button-sc-1oi1sg7-1')
      console.log(`🔍 Category attempt ${attempts + 1}: Found ${mainCategoryButtons.length} main category buttons`)
      logToStorage('LOG', `🔍 Category attempt ${attempts + 1}: Found ${mainCategoryButtons.length} main category buttons`)

      // Check if user wants "Wszystkie w kategorii X"
      if (targetCategory.startsWith('Wszystkie w kategorii')) {
        for (const button of mainCategoryButtons) {
          const categoryText = button.textContent?.trim() || ''
          console.log(`🔍 Checking main category button: "${categoryText}"`)

          if (categoryText.includes('Wszystkie artykuły w') &&
              categoryText.toLowerCase().includes(categoryType.toLowerCase())) {

            console.log(`✅ Found matching main category: "${categoryText}"`)
            logToStorage('LOG', `✅ Found matching main category: "${categoryText}"`)

            const isPressed = button.getAttribute('aria-pressed') === 'true'
            if (!isPressed) {
              console.log(`🖱️ Clicking main category button: "${categoryText}"`)
              logToStorage('LOG', `🖱️ Clicking main category button: "${categoryText}"`);
              (button as HTMLElement).click()
              await this.delay(150) // Faster click delay
              return
            } else {
              console.log(`⚠️ Main category "${categoryText}" already selected`)
              logToStorage('LOG', `⚠️ Main category "${categoryText}" already selected`)
              return
            }
          }
        }
      } else {
        // Look for specific subcategory buttons
        const subCategoryButtons = document.querySelectorAll('.Button-sc-1dkllpt-0')
        console.log(`🔍 Found ${subCategoryButtons.length} sub-category buttons`)
        logToStorage('LOG', `🔍 Found ${subCategoryButtons.length} sub-category buttons`)

        for (const button of subCategoryButtons) {
          const categoryText = button.textContent?.trim() || ''
          console.log(`🔍 Checking sub-category button: "${categoryText}"`)

          if (categoryText.toLowerCase().includes(targetCategory.toLowerCase()) ||
              targetCategory.toLowerCase().includes(categoryText.toLowerCase())) {

            console.log(`✅ Found matching sub-category: "${categoryText}"`)
            logToStorage('LOG', `✅ Found matching sub-category: "${categoryText}"`)

            const isPressed = button.getAttribute('aria-pressed') === 'true'
            if (!isPressed) {
              console.log(`🖱️ Clicking sub-category button: "${categoryText}"`)
              logToStorage('LOG', `🖱️ Clicking sub-category button: "${categoryText}"`);
              (button as HTMLElement).click()
              await this.delay(150) // Faster click delay
              return
            } else {
              console.log(`⚠️ Sub-category "${categoryText}" already selected`)
              logToStorage('LOG', `⚠️ Sub-category "${categoryText}" already selected`)
              return
            }
          }
        }
      }

      await this.delay(50) // Faster category polling
      attempts++
    }

    console.error(`❌ Could not find matching ${categoryType} category after maximum attempts`)
    logToStorage('ERROR', `Could not find matching ${categoryType} category "${targetCategory}" after ${maxAttempts} attempts`)
  }

  private async applySortFilter(sortMethod: string): Promise<void> {
    console.log('🔄 Applying sort filter:', sortMethod)
    logToStorage('LOG', `🔄 Starting sort filter: ${sortMethod}`)

    // Find and click the sort tab first
    const sortTab = await this.findSortTab()
    if (!sortTab) {
      console.error('❌ Sort tab not found')
      logToStorage('ERROR', 'Sort tab not found')
      return
    }

    console.log('✅ Sort tab found, clicking...')
    sortTab.click()

    // Wait for sort options to appear
    console.log('⏳ Waiting for sort options to appear...')
    await this.waitForElement('[data-testid="sub-filter-wrapper"]', 3000)

    // Find and select matching sort option
    await this.selectSortOption(sortMethod)
  }

  private async findSortTab(): Promise<HTMLElement | null> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const tabButtons = document.querySelectorAll('button[role="tab"]')
      console.log(`🔍 Looking for sort tab, attempt ${attempts + 1}`)

      for (let i = 0; i < tabButtons.length; i++) {
        const button = tabButtons[i]
        const textContent = button.textContent?.toLowerCase() || ''
        console.log(`🔘 Sort tab search ${i}: "${textContent}"`)

        // Look for "Sortowanie" with any additional text (like "SortowaniePopularne")
        if (textContent.includes('sortowanie')) {
          console.log(`✅ Found sort tab at index ${i}: "${textContent}"`)
          return button as HTMLElement
        }
      }

      await this.delay(50)
      attempts++
    }

    console.error('❌ Sort tab not found after all attempts')
    return null
  }

  private async selectSortOption(targetSort: string): Promise<void> {
    console.log('🔄 Selecting sort option:', targetSort)
    logToStorage('LOG', `🔄 Selecting sort option: ${targetSort}`)

    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      // Look for sort checkboxes using the specific data-testid
      const sortCheckboxes = document.querySelectorAll('[data-testid="sort-button"]')
      console.log(`🔍 Sort option attempt ${attempts + 1}: Found ${sortCheckboxes.length} sort checkboxes`)

      if (sortCheckboxes.length > 0) {
        for (const checkbox of sortCheckboxes) {
          // Get the label text from the parent label element
          const label = checkbox.closest('label')
          const span = label?.querySelector('span')
          const optionText = span?.textContent?.trim() || ''
          console.log(`🔍 Checking sort option: "${optionText}"`)

          // Skip empty options
          if (!optionText) {
            continue
          }

          // Check if this matches our target sort method
          const isMatch =
            optionText.toLowerCase().includes(targetSort.toLowerCase()) ||
            (targetSort.toLowerCase() === 'popularne' && optionText.toLowerCase().includes('popularne')) ||
            (targetSort.toLowerCase() === 'nowości' && optionText.toLowerCase().includes('nowości')) ||
            (targetSort.toLowerCase() === 'najniższa cena' && optionText.toLowerCase().includes('najniższa cena')) ||
            (targetSort.toLowerCase() === 'najwyższa cena' && optionText.toLowerCase().includes('najwyższa cena')) ||
            (targetSort.toLowerCase() === 'wyprzedaż' && (optionText.toLowerCase().includes('wyprzedaż') || optionText.toLowerCase().includes('kwyprzedaż')))

          if (isMatch) {
            console.log(`✅ Found matching sort option: "${optionText}"`)
            logToStorage('LOG', `✅ Found matching sort option: "${optionText}"`)

            const isChecked = (checkbox as HTMLInputElement).checked
            if (!isChecked) {
              console.log(`🖱️ Clicking sort checkbox: "${optionText}"`)
              logToStorage('LOG', `🖱️ Clicking sort checkbox: "${optionText}"`);
              (checkbox as HTMLElement).click()
              await this.delay(150) // Faster click delay
              return
            } else {
              console.log(`⚠️ Sort option "${optionText}" already selected`)
              logToStorage('LOG', `⚠️ Sort option "${optionText}" already selected`)
              return
            }
          }
        }
      }

      await this.delay(50)
      attempts++
    }

    console.error('❌ Could not find matching sort option after maximum attempts')
    logToStorage('ERROR', `Could not find matching sort option "${targetSort}" after ${maxAttempts} attempts`)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ========================================
  // PRODUCT RESERVATION SYSTEM
  // ========================================

  private async startProductReservationsWithWait(itemsToAdd: number, userSizeFilters?: string[]): Promise<void> {
    try {
      console.log(`🔍 Waiting for products to appear after filtering...`)

      // Smart waiting - check for products with retries
      let products = 0
      const maxWaitAttempts = 10 // 10 attempts = 5 seconds max

      for (let attempt = 1; attempt <= maxWaitAttempts; attempt++) {
        products = this.countAvailableProducts()
        console.log(`🔄 Attempt ${attempt}: Found ${products} products`)

        if (products > 0) {
          console.log(`✅ Products found after ${attempt} attempts`)
          break
        }

        await this.delay(500) // Wait 500ms between attempts
      }

      if (products === 0) {
        console.error('❌ No products found after waiting')
        logToStorage('ERROR', 'No products found after waiting')
        return
      }

      // Start reservations
      await this.startProductReservations(itemsToAdd, userSizeFilters)

    } catch (error) {
      console.error('❌ Product reservation wait failed:', error)
      logToStorage('ERROR', `Product reservation wait failed: ${error}`)
    }
  }

  private async startProductReservations(itemsToAdd: number, userSizeFilters?: string[]): Promise<void> {
    try {
      console.log(`🔍 Looking for ${itemsToAdd} products to reserve...`)
      logToStorage('LOG', `🔍 Looking for ${itemsToAdd} products to reserve...`)

      // Count available product cards
      const availableProducts = this.countAvailableProducts()

      if (availableProducts === 0) {
        console.error('❌ No products found on current page')
        logToStorage('ERROR', 'No products found on current page')
        return
      }

      const itemsToProcess = Math.min(itemsToAdd, availableProducts)
      console.log(`✅ Found ${availableProducts} products, will reserve ${itemsToProcess}`)
      logToStorage('LOG', `✅ Found ${availableProducts} products, will reserve ${itemsToProcess}`)

      // Open each product in new tab by targeting specific product cards
      const reservationPromises = Array.from({ length: itemsToProcess }, (_, index) =>
        this.openProductCardInNewTab(index, userSizeFilters, index + 1)
      )

      // Execute all reservations in parallel
      const results = await Promise.allSettled(reservationPromises)

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      console.log(`🎯 Reservation completed: ${successful} successful, ${failed} failed`)
      logToStorage('LOG', `🎯 Reservation completed: ${successful} successful, ${failed} failed`)

    } catch (error) {
      console.error('❌ Product reservation failed:', error)
      logToStorage('ERROR', `Product reservation failed: ${error}`)
    }
  }

  private countAvailableProducts(): number {
    try {
      console.log('🔍 Debugging product search...')

      // Debug: Check if articleListWrapper exists
      const articleList = document.querySelector('#articleListWrapper')
      console.log('🔍 articleListWrapper found:', !!articleList)

      if (!articleList) {
        console.error('❌ Article list container not found')
        // Try alternative selectors
        const alternatives = [
          '.ListWrapper-sc-do0tac-0',
          '[class*="ListWrapper"]',
          'ul[id*="article"]'
        ]

        for (const alt of alternatives) {
          const altElement = document.querySelector(alt)
          console.log(`🔍 Alternative selector "${alt}":`, !!altElement)
          if (altElement) {
            const cards = altElement.querySelectorAll('[data-testid="lux-article-card"]')
            console.log(`📦 Found ${cards.length} product cards using alternative selector`)
            return cards.length
          }
        }

        return 0
      }

      // Debug: Check innerHTML
      console.log('🔍 articleListWrapper innerHTML length:', articleList.innerHTML.length)
      console.log('🔍 articleListWrapper children count:', articleList.children.length)

      // Try different selectors for product cards
      const selectors = [
        '[data-testid="lux-article-card"]',
        '.ArticleWrapper-sc-hib3gs-0',
        'li[id^="article-"]'
      ]

      for (const selector of selectors) {
        const cards = articleList.querySelectorAll(selector)
        console.log(`🔍 Selector "${selector}": ${cards.length} cards found`)
        if (cards.length > 0) {
          return cards.length
        }
      }

      console.log('❌ No product cards found with any selector')
      return 0

    } catch (error) {
      console.error('❌ Failed to count products:', error)
      return 0
    }
  }

  private extractProductUrlsFromCurrentPage(maxItems: number): string[] {
    const urls: string[] = []

    try {
      // Find the article list container
      const articleList = document.querySelector('#articleListWrapper')
      if (!articleList) {
        console.error('❌ Article list container not found')
        return urls
      }

      // Get all product links within the container
      const productLinks = articleList.querySelectorAll('li[id^="article-"] a[href*="/articles/"]')
      console.log(`📦 Found ${productLinks.length} products in article list`)

      // Extract URLs (limit to maxItems)
      const itemsToProcess = Math.min(maxItems, productLinks.length)
      for (let i = 0; i < itemsToProcess; i++) {
        const link = productLinks[i] as HTMLAnchorElement
        if (link.href) {
          // Convert relative URLs to absolute
          const fullUrl = new URL(link.href, window.location.origin).href
          urls.push(fullUrl)
        }
      }

      console.log(`🔗 Extracted ${urls.length} product URLs`)
      return urls

    } catch (error) {
      console.error('❌ Failed to extract product URLs:', error)
      return urls
    }
  }

  private async openProductCardInNewTab(cardIndex: number, userSizeFilters: string[] = [], itemNumber: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🚀 [${itemNumber}] Opening product card ${cardIndex} in new tab`)
        logToStorage('LOG', `🚀 [${itemNumber}] Opening product card ${cardIndex}`)

        // Find the specific product card
        const articleList = document.querySelector('#articleListWrapper')
        if (!articleList) {
          reject(new Error('Article list not found'))
          return
        }

        const productCards = articleList.querySelectorAll('[data-testid="lux-article-card"]')
        console.log(`📦 Found ${productCards.length} product cards`)

        if (cardIndex >= productCards.length) {
          reject(new Error(`Product card ${cardIndex} not found`))
          return
        }

        const targetCard = productCards[cardIndex] as HTMLElement
        const productLink = targetCard.querySelector('a[href*="/articles/"]') as HTMLAnchorElement

        if (!productLink || !productLink.href) {
          reject(new Error(`Product link not found in card ${cardIndex}`))
          return
        }

        const productUrl = productLink.href
        console.log(`🔗 [${itemNumber}] Product URL: ${productUrl}`)

        // Set up reservation data for localStorage
        const reservationId = `reservation_${itemNumber}_${Date.now()}`
        const reservationData = {
          sizeFilters: userSizeFilters,
          itemNumber: itemNumber,
          timestamp: Date.now()
        }

        localStorage.setItem(reservationId, JSON.stringify(reservationData))

        // Create a new tab with reservation parameter
        const urlWithReservation = `${productUrl}${productUrl.includes('?') ? '&' : '?'}autoReserve=${reservationId}`

        // Open in new tab
        const newTab = window.open(urlWithReservation, '_blank')

        if (!newTab) {
          reject(new Error('Failed to open new tab'))
          return
        }

        console.log(`✅ [${itemNumber}] Product opened in new tab`)

        // Clean up localStorage after some time
        setTimeout(() => {
          localStorage.removeItem(reservationId)
        }, 30000)

        resolve()

      } catch (error) {
        console.error(`❌ [${itemNumber}] Failed to open product card:`, error)
        reject(error)
      }
    })
  }

  private async reserveProductInNewTab(productUrl: string, userSizeFilters: string[] = [], itemNumber: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🚀 [${itemNumber}] Opening product in new tab: ${productUrl}`)
        logToStorage('LOG', `🚀 [${itemNumber}] Opening product: ${productUrl}`)

        // Open in new tab
        const newTab = window.open(productUrl, '_blank')

        if (!newTab) {
          reject(new Error('Failed to open new tab'))
          return
        }

        // Set up a unique identifier for this reservation
        const reservationId = `reservation_${itemNumber}_${Date.now()}`

        // Store reservation data in localStorage for the new tab to pick up
        const reservationData = {
          sizeFilters: userSizeFilters,
          itemNumber: itemNumber,
          timestamp: Date.now()
        }

        localStorage.setItem(reservationId, JSON.stringify(reservationData))

        // Add URL parameter to signal reservation needed
        const urlWithReservation = `${productUrl}${productUrl.includes('?') ? '&' : '?'}autoReserve=${reservationId}`

        // Navigate to the URL with reservation parameter
        newTab.location.href = urlWithReservation

        // Clean up localStorage after some time
        setTimeout(() => {
          localStorage.removeItem(reservationId)
        }, 30000) // Clean up after 30 seconds

        resolve()

      } catch (error) {
        console.error(`❌ [${itemNumber}] Failed to reserve product:`, error)
        reject(error)
      }
    })
  }

  private async reserveCurrentProduct(sizeFilters: string[] = [], itemNumber: number): Promise<void> {
    try {
      console.log(`🛒 [${itemNumber}] Starting reservation on: ${window.location.href}`)
      logToStorage('LOG', `🛒 [${itemNumber}] Starting reservation on: ${window.location.href}`)

      // Wait for product page to load
      await this.waitForPageLoad()
      console.log(`✅ [${itemNumber}] Product page loaded`)

      // Find and select size
      const sizeSelected = await this.selectAvailableSize(sizeFilters, itemNumber)
      if (!sizeSelected) {
        throw new Error('No available size found')
      }

      // Add to cart
      await this.addToCart(itemNumber)
      console.log(`🎉 [${itemNumber}] Product successfully added to cart!`)
      logToStorage('LOG', `🎉 [${itemNumber}] Product successfully added to cart!`)

    } catch (error) {
      console.error(`❌ [${itemNumber}] Reservation failed:`, error)
      logToStorage('ERROR', `❌ [${itemNumber}] Reservation failed: ${error}`)
      throw error
    }
  }

  private async selectAvailableSize(userSizeFilters: string[], itemNumber: number): Promise<boolean> {
    try {
      console.log(`👔 [${itemNumber}] Looking for available sizes...`)
      console.log(`📏 [${itemNumber}] User size filters:`, userSizeFilters)

      // Wait for size section to be available
      const sizeSection = await this.waitForElement('#article-size-section', 3000) // Reduced timeout for faster failure detection
      if (!sizeSection) {
        console.error(`❌ [${itemNumber}] Size section not found`)
        return false
      }

      // Get all size radio buttons
      const sizeButtons = sizeSection.querySelectorAll('input[type="radio"][name="size"]')
      console.log(`👔 [${itemNumber}] Found ${sizeButtons.length} size options`)

      // Log all available sizes for debugging
      const availableSizes: string[] = []
      for (const button of sizeButtons) {
        const sizeButton = button as HTMLInputElement
        const label = sizeButton.closest('label')
        if (label) {
          const sizeText = label.textContent?.trim() || ''
          const disabled = sizeButton.disabled
          availableSizes.push(`${sizeText}${disabled ? ' (disabled)' : ''}`)
        }
      }
      console.log(`📋 [${itemNumber}] Available sizes:`, availableSizes)

      // Try to find matching size from user filters
      if (userSizeFilters && userSizeFilters.length > 0) {
        for (const targetSize of userSizeFilters) {
          const trimmedSize = targetSize.trim()

          console.log(`🔍 [${itemNumber}] Looking for target size: "${trimmedSize}"`)

          // Step 1: Try exact match first
          let exactFound = false
          let exactDisabled = false
          for (const button of sizeButtons) {
            const sizeButton = button as HTMLInputElement
            const label = sizeButton.closest('label')

            if (label) {
              const sizeText = label.textContent?.trim() || ''

              if (sizeText === trimmedSize) {
                exactFound = true
                if (!sizeButton.disabled) {
                  console.log(`✅ [${itemNumber}] Exact match found: ${sizeText}`)
                  logToStorage('LOG', `✅ [${itemNumber}] Exact match: ${sizeText}`)

                  sizeButton.click()
                  await this.delay(200)
                  return true
                } else {
                  exactDisabled = true
                  console.log(`⚠️ [${itemNumber}] Exact match found but disabled: ${sizeText}`)
                }
              }
            }
          }

          // Step 2: Try partial match (e.g., "41" matches "41 1/3")
          let partialFound = false
          let partialDisabled = false
          for (const button of sizeButtons) {
            const sizeButton = button as HTMLInputElement
            const label = sizeButton.closest('label')

            if (label) {
              const sizeText = label.textContent?.trim() || ''

              if (sizeText.startsWith(trimmedSize + ' ')) {
                partialFound = true
                if (!sizeButton.disabled) {
                  console.log(`✅ [${itemNumber}] Partial match found: ${sizeText} (target: ${trimmedSize})`)
                  logToStorage('LOG', `✅ [${itemNumber}] Partial match: ${sizeText}`)

                  sizeButton.click()
                  await this.delay(200)
                  return true
                } else {
                  partialDisabled = true
                  console.log(`⚠️ [${itemNumber}] Partial match found but disabled: ${sizeText}`)
                }
              }
            }
          }

          // Log why size wasn't found
          if (exactFound && exactDisabled) {
            console.log(`❌ [${itemNumber}] Size "${trimmedSize}" exists but is sold out`)
          } else if (partialFound && partialDisabled) {
            console.log(`❌ [${itemNumber}] Similar sizes found but all sold out`)
          } else if (!exactFound && !partialFound) {
            console.log(`❌ [${itemNumber}] Size "${trimmedSize}" not found in product`)
          }
        }
      }

      // If no matching size found, DON'T add to cart (better to skip than wrong size)
      console.error(`❌ [${itemNumber}] Target size not found, skipping product (better than wrong size)`)
      logToStorage('ERROR', `❌ [${itemNumber}] Target size "${userSizeFilters.join(',')}" not available, skipping product`)
      return false

    } catch (error) {
      console.error(`❌ [${itemNumber}] Size selection failed:`, error)
      return false
    }
  }

  private async addToCart(itemNumber: number): Promise<void> {
    try {
      console.log(`🛒 [${itemNumber}] Looking for add to cart button...`)

      // Wait for add to cart button
      const addToCartButton = await this.waitForElement('#addToCartButton button', 3000) // Reduced timeout for faster failure detection
      if (!addToCartButton) {
        throw new Error('Add to cart button not found')
      }

      const button = addToCartButton as HTMLButtonElement

      // Check if button is enabled
      if (button.disabled) {
        throw new Error('Add to cart button is disabled (no size selected?)')
      }

      console.log(`🖱️ [${itemNumber}] Clicking add to cart button`)
      logToStorage('LOG', `🖱️ [${itemNumber}] Clicking add to cart button`)

      button.click()

      // Wait a moment for the action to process
      await this.delay(1000)

      // Check for success indicators (could be improved with specific selectors)
      console.log(`✅ [${itemNumber}] Add to cart action completed`)

    } catch (error) {
      console.error(`❌ [${itemNumber}] Add to cart failed:`, error)
      throw error
    }
  }
}

// Initialize when script loads
new ZalandoFilter()