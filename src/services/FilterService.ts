import type { Campaign, FormData, ProductSearchFilters } from '@/shared/types'

export class FilterService {
  /**
   * Convert campaign filters to API search filters
   */
  static convertCampaignToApiFilters(campaign: Campaign): ProductSearchFilters {
    const filters: ProductSearchFilters = {}

    // Brand codes handling
    if (campaign.filters.brands && campaign.filters.brands.length > 0) {
      filters.brandCodes = campaign.filters.brands.join(',')
    }

    // Size handling
    if (campaign.filters.size) {
      const sizeNum = parseFloat(campaign.filters.size.split(',')[0])
      const isShoeSize = (sizeNum >= 35 && sizeNum <= 50)

      if (isShoeSize) {
        filters.shoeSizes = campaign.filters.size
      } else {
        filters.clothingSizes = campaign.filters.size
      }
    }

    // Price handling
    if (campaign.filters.maxPrice && campaign.filters.maxPrice > 0) {
      filters.priceMax = (campaign.filters.maxPrice * 100).toString() // Convert to cents
    }

    // Sort method mapping
    if (campaign.sortMethod) {
      filters.sort = this.mapSortMethod(campaign.sortMethod)
    }

    return filters
  }

  /**
   * Convert form data to API search filters
   */
  static convertFormToApiFilters(formData: FormData): ProductSearchFilters {
    const filters: ProductSearchFilters = {}

    // Brand codes handling
    if (formData.brands && formData.brands.length > 0) {
      filters.brandCodes = formData.brands.join(',')
    }

    // Size handling
    if (formData.size) {
      const sizeNum = parseFloat(formData.size.split(',')[0])
      const isShoeSize = (sizeNum >= 35 && sizeNum <= 50)

      if (isShoeSize) {
        filters.shoeSizes = formData.size
      } else {
        filters.clothingSizes = formData.size
      }
    }

    // Price handling
    if (formData.maxPrice && formData.maxPrice > 0) {
      filters.priceMax = (formData.maxPrice * 100).toString() // Convert to cents
    }

    // Sort method mapping
    if (formData.sortMethod) {
      filters.sort = this.mapSortMethod(formData.sortMethod)
    }

    return filters
  }

  /**
   * Map user-friendly sort method to API sort parameter
   */
  private static mapSortMethod(sortMethod: string): string {
    const sortMap: Record<string, string> = {
      'popularne': 'relevance',
      'najniższa cena': 'price_asc',
      'najwyższa cena': 'price_desc',
      'wyprzedaż': 'savings'
    }

    return sortMap[sortMethod.toLowerCase()] || 'relevance'
  }
}