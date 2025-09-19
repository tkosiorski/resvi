import { ApiService } from './ApiService'
import { CartService } from './CartService'
import { FilterService } from './FilterService'
import type { Campaign, CampaignExecutionResult } from '@/shared/types'

export class CampaignService {
  private static readonly MAX_RETRIES = 3

  /**
   * Execute a campaign with retry mechanism
   */
  static async executeCampaign(campaign: Campaign): Promise<CampaignExecutionResult> {
    console.log('🚀 Executing campaign:', campaign.id)

    // Apply pre-execution delay
    if (campaign.delay && campaign.delay > 0) {
      console.log(`⏳ Applying delay: ${campaign.delay}ms before execution`)
      await this.delay(campaign.delay)
    }

    return this.executeWithRetry(campaign, this.MAX_RETRIES)
  }

  /**
   * Execute campaign with retry logic
   */
  private static async executeWithRetry(
    campaign: Campaign,
    maxRetries: number
  ): Promise<CampaignExecutionResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Campaign execution attempt ${attempt}/${maxRetries}`)

      try {
        const result = await this.executeSingleAttempt(campaign)

        if (result.success) {
          console.log(`✅ Campaign execution successful on attempt ${attempt}!`)
          return result
        } else {
          console.error(`❌ Campaign execution failed on attempt ${attempt}:`, result.error)

          if (attempt < maxRetries) {
            const delay = this.calculateRetryDelay(attempt)
            console.log(`⏳ Waiting ${delay}ms before retry...`)
            await this.delay(delay)
          }
        }
      } catch (error) {
        console.error(`❌ Campaign execution error on attempt ${attempt}:`, error)

        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt)
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await this.delay(delay)
        }
      }
    }

    return {
      success: false,
      error: `Campaign failed after ${maxRetries} attempts`
    }
  }

  /**
   * Execute a single campaign attempt
   */
  private static async executeSingleAttempt(campaign: Campaign): Promise<CampaignExecutionResult> {
    try {
      // Convert campaign filters to API format
      const apiFilters = FilterService.convertCampaignToApiFilters(campaign)
      console.log('🔧 API filters:', apiFilters)

      // Search for products
      const searchResult = await ApiService.searchProducts(campaign.id, apiFilters)

      if (!searchResult.success || !searchResult.data) {
        return {
          success: false,
          error: searchResult.error || 'Failed to search products'
        }
      }

      const products = searchResult.data
      console.log(`📊 Found ${products.length} products`)

      if (products.length === 0) {
        return {
          success: false,
          error: 'No products found matching the criteria'
        }
      }

      // Add products to cart
      const cartResult = await CartService.addProductsToCart(
        products,
        campaign.id,
        campaign.itemsToAdd
      )

      return {
        success: true,
        data: {
          totalProducts: products.length,
          successCount: cartResult.successCount,
          failedCount: cartResult.failedCount
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  private static calculateRetryDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 1s, 2s, 4s, max 10s
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}