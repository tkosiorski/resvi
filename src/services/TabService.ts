interface FilterConfig {
  brand: string[]
  size: string[]
  color?: string
  maxPrice?: number
  sortMethod?: string
  itemsToAdd?: number
  category?: {
    gender?: string
    clothingCategory?: string
    shoesCategory?: string
    accessoriesCategory?: string
    equipmentCategory?: string
  }
}

export class TabService {
  static async waitForPageLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const checkTabStatus = async () => {
        try {
          const tab = await chrome.tabs.get(tabId)
          if (tab.status === 'complete') {
            setTimeout(resolve, 300)
          } else {
            setTimeout(checkTabStatus, 100)
          }
        } catch (error) {
          resolve()
        }
      }
      checkTabStatus()
    })
  }

  static async checkContentScriptReady(tabId: number): Promise<boolean> {
    const maxAttempts = 20

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' })
        if (response?.pong) {
          return true
        }
      } catch (error) {
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 150))
        }
      }
    }

    return false
  }

  static async applyFilters(tabId: number, filterConfig: FilterConfig) {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'APPLY_FILTERS',
      config: filterConfig
    })

    return response
  }

  static async navigateToCampaign(campaignId: string) {
    const campaignUrl = `https://www.zalando-lounge.pl/campaigns/${campaignId}`
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (activeTab?.id) {
      await chrome.tabs.update(activeTab.id, { url: campaignUrl })
      await this.waitForPageLoad(activeTab.id)
      return activeTab.id
    }

    throw new Error('No active tab found')
  }

  static prepareFilterConfig(formData: any): FilterConfig {
    return {
      brand: formData.brand ? formData.brand.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0) : [],
      size: formData.size ? formData.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
      color: formData.color || undefined,
      maxPrice: formData.maxPrice || undefined,
      sortMethod: formData.sortMethod || undefined,
      itemsToAdd: formData.itemsToAdd || undefined,
      category: (formData.gender || formData.clothingCategory || formData.shoesCategory || formData.accessoriesCategory || formData.equipmentCategory) ? {
        gender: formData.gender || undefined,
        clothingCategory: formData.clothingCategory || undefined,
        shoesCategory: formData.shoesCategory || undefined,
        accessoriesCategory: formData.accessoriesCategory || undefined,
        equipmentCategory: formData.equipmentCategory || undefined
      } : undefined
    }
  }
}