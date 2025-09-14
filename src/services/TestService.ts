import { TabService } from './TabService'

export class TestService {
  static async runTest(campaignId: string, formData: any): Promise<{ success: boolean; message: string }> {
    if (!campaignId) {
      return { success: false, message: 'Proszę wpisać ID kampanii do testowania' }
    }

    try {
      console.log(`=== TEST ROZPOCZĘTY ===`)
      console.log(`Kampania: ${campaignId}`)

      const tabId = await TabService.navigateToCampaign(campaignId)
      console.log(`✅ Strona załadowana`)

      await this.applyFiltersToCurrentTab(tabId, formData)

      return { success: true, message: 'Test zakończony pomyślnie' }
    } catch (error) {
      console.error('Failed to run test:', error)
      return { success: false, message: `Błąd: ${error.message}` }
    }
  }

  private static async applyFiltersToCurrentTab(tabId: number, formData: any): Promise<void> {
    console.log('🔄 Sprawdzam gotowość content script...')

    const contentScriptReady = await TabService.checkContentScriptReady(tabId)

    if (!contentScriptReady) {
      throw new Error('Content script nie odpowiada po 20 próbach')
    }

    console.log('✅ Content script gotowy')
    console.log('🔧 Przygotowuję konfigurację filtrów...')

    const filterConfig = TabService.prepareFilterConfig(formData)
    console.log(`📤 Wysyłam filtry: ${JSON.stringify(filterConfig)}`)

    const response = await TabService.applyFilters(tabId, filterConfig)

    if (response?.success) {
      console.log('✅ Filtry zastosowane pomyślnie!')
    } else {
      throw new Error(response?.error || 'Unknown error')
    }
  }
}