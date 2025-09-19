import type { ApiResponse, ProductSearchFilters, Product } from '@/shared/types'

export class ApiService {
  private static readonly BASE_URL = 'https://www.zalando-lounge.pl/api/phoenix'

  private static readonly DEFAULT_HEADERS = {
    'accept': '*/*',
    'accept-language': 'pl,en-US;q=0.9,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  }

  /**
   * Search for products in a specific campaign
   */
  static async searchProducts(campaignId: string, filters: ProductSearchFilters): Promise<ApiResponse<Product[]>> {
    try {
      const params = this.buildSearchParams(filters)
      const url = `${this.BASE_URL}/catalog/events/${campaignId}/articles?${params.toString()}`

      console.log('🌐 API Request URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: this.DEFAULT_HEADERS
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const products = this.extractProducts(data)

      return {
        success: true,
        data: products
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Build URL search parameters from filters
   */
  private static buildSearchParams(filters: ProductSearchFilters): URLSearchParams {
    const params = new URLSearchParams()

    if (filters.brandCodes) { params.append('brand_codes', filters.brandCodes) }
    if (filters.categoryIds) { params.append('category_ids', filters.categoryIds) }
    if (filters.gender) { params.append('gender', filters.gender) }
    if (filters.shoeSizes) { params.append('sizes.shoes', filters.shoeSizes) }
    if (filters.clothingSizes) { params.append('sizes.clothing', filters.clothingSizes) }
    if (filters.priceMax) { params.append('price_max', filters.priceMax) }

    // Standard parameters
    params.append('size', '60')
    params.append('fields', '1')
    params.append('sort', filters.sort || 'relevance')
    params.append('no_soldout', '1')

    return params
  }

  /**
   * Extract products from API response (handles different response structures)
   */
  private static extractProducts(data: any): Product[] {
    if (Array.isArray(data)) {
      return data
    }

    if (data?.configs && Array.isArray(data.configs)) {
      return data.configs
    }

    if (data?.articles && Array.isArray(data.articles)) {
      return data.articles
    }

    return []
  }
}