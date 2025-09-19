import type { ApiResponse, Product, CartAddResult } from '@/shared/types'

export class CartService {
  private static readonly CART_URL = 'https://www.zalando-lounge.pl/api/phoenix/stockcart/cart'

  private static readonly DEFAULT_HEADERS = {
    'accept': '*/*',
    'accept-language': 'pl,en-US;q=0.9,en;q=0.8',
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'origin': 'https://www.zalando-lounge.pl',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
  }

  /**
   * Add multiple products to cart
   */
  static async addProductsToCart(products: Product[], campaignId: string, maxItems: number): Promise<CartAddResult> {
    let successCount = 0
    let failedCount = 0
    const productsToProcess = products.slice(0, maxItems)

    console.log(`🛒 Adding ${productsToProcess.length} products to cart...`)

    for (let i = 0; i < productsToProcess.length; i++) {
      const product = productsToProcess[i]
      const result = await this.addSingleProductToCart(product, campaignId, i + 1, productsToProcess.length)

      if (result.success) {
        successCount++
      } else {
        failedCount++
      }

      // Delay between products
      if (i < productsToProcess.length - 1) {
        await this.delay(500)
      }
    }

    console.log(`🛒 Cart operation completed: ${successCount} added, ${failedCount} failed`)
    return { successCount, failedCount }
  }

  /**
   * Add a single product to cart (with variant fallback)
   */
  private static async addSingleProductToCart(
    product: Product,
    campaignId: string,
    index: number,
    total: number
  ): Promise<{ success: boolean }> {
    try {
      const productId = product.sku || product.id || product.simple_key

      if (!productId) {
        console.error('❌ No product ID found for product:', product)
        return { success: false }
      }

      const simples = product.simples || []
      if (!simples.length) {
        console.error('❌ No simples/variants found for product:', productId)
        return { success: false }
      }

      // Try up to 3 variants
      for (let variantIndex = 0; variantIndex < Math.min(simples.length, 3); variantIndex++) {
        const variant = simples[variantIndex]

        if (!variant.sku || variant.stockStatus !== 'AVAILABLE') {
          console.log(`⚠️ Variant ${variantIndex + 1} not available:`, variant.stockStatus)
          continue
        }

        console.log(`🛒 Adding product ${index}/${total} variant ${variantIndex + 1}: ${productId} -> ${variant.sku}`)

        const success = await this.addVariantToCart(productId, variant.sku, campaignId)

        if (success) {
          console.log(`✅ Added product ${productId} variant ${variantIndex + 1} to cart`)
          return { success: true }
        }

        // Small delay between variant attempts
        await this.delay(300)
      }

      return { success: false }
    } catch (error) {
      console.error(`❌ Error adding product to cart:`, error)
      return { success: false }
    }
  }

  /**
   * Add a specific variant to cart
   */
  private static async addVariantToCart(
    configSku: string,
    simpleSku: string,
    campaignId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.CART_URL}/items`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...this.DEFAULT_HEADERS,
          'referer': `https://www.zalando-lounge.pl/campaigns/${campaignId}`
        },
        body: JSON.stringify({
          quantity: 1,
          campaignIdentifier: campaignId,
          configSku,
          simpleSku,
          additional: { reco: 0 }
        })
      })

      if (response.ok) {
        return true
      } else {
        const errorText = await response.text()
        console.error(`❌ Failed to add variant to cart:`, response.status, response.statusText)
        console.error(`❌ Error response:`, errorText.substring(0, 200) + '...')
        return false
      }
    } catch (error) {
      console.error(`❌ Error in cart API call:`, error)
      return false
    }
  }

  /**
   * Extend cart reservation
   */
  static async extendReservation(): Promise<ApiResponse<void>> {
    try {
      console.log('🛒 Extending cart reservation...')

      const response = await fetch(this.CART_URL, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          ...this.DEFAULT_HEADERS,
          'content-length': '0',
          'referer': 'https://www.zalando-lounge.pl/event',
          'x-requested-with': 'XMLHttpRequest'
        }
      })

      if (response.ok) {
        console.log('✅ Cart reservation extended successfully')
        return { success: true }
      } else {
        console.warn('⚠️ Cart extension failed:', response.status, response.statusText)
        return {
          success: false,
          error: `Cart extension failed: ${response.status} ${response.statusText}`
        }
      }
    } catch (error) {
      console.error('❌ Error extending cart:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}