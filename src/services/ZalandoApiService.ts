import type { ZalandoFilters, ZalandoApiResponse } from '../shared/types'

export class ZalandoApiService {
  private static instance: ZalandoApiService
  private baseUrl = 'https://www.zalando-lounge.pl/api/phoenix'

  static getInstance(): ZalandoApiService {
    if (!this.instance) {
      this.instance = new ZalandoApiService()
    }
    return this.instance
  }

  // Extract dynamic tokens from current page
  private async extractTokensFromPage(): Promise<{
    xsrfToken?: string
    traceId?: string
    spanId?: string
    b3?: string
  }> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (!activeTab.id) {
          resolve({})
          return
        }

        chrome.scripting.executeScript(
            {
              target: { tabId: activeTab.id },
              func: () => {
                // Extract XSRF token from meta tag or cookies
                const xsrfMeta = document.querySelector('meta[name="csrf-token"]')
                const xsrfToken = xsrfMeta?.getAttribute('content') ||
                    document.cookie.split(';')
                        .find(c => c.trim().startsWith('XSRF-TOKEN='))
                        ?.split('=')[1]

                // Generate trace IDs (similar to what browser does)
                const traceId = Math.random().toString(16).substr(2, 16)
                const spanId = Math.random().toString(16).substr(2, 16)
                const b3 = `${traceId}-${spanId}-1`

                return { xsrfToken, traceId, spanId, b3 }
              }
            },
            (results) => {
              if (results && results[0] && results[0].result) {
                resolve(results[0].result)
              } else {
                resolve({})
              }
            }
        )
      })
    })
  }

  // Get current cookies for Zalando domain
  private async getCookiesString(): Promise<string> {
    return new Promise((resolve) => {
      chrome.cookies.getAll({ domain: '.zalando-lounge.pl' }, (cookies) => {
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        resolve(cookieString)
      })
    })
  }

  // Main method to fetch products with filters
  async fetchProducts(campaignId: string, filters: ZalandoFilters): Promise<ZalandoApiResponse> {
    try {
      console.log('🔥 [V2 API] Starting product fetch with filters:', filters)

      // Get tokens and cookies
      const tokens = await this.extractTokensFromPage()
      await this.getCookiesString() // Get cookies for future use

      console.log('🔑 [V2 API] Extracted tokens:', tokens)

      // Build query parameters based on capture analysis
      const params = new URLSearchParams()

      // Brand filtering
      if (filters.brand_codes) params.append('brand_codes', filters.brand_codes)

      // Size filtering (based on product type)
      if (filters['sizes.shoes']) params.append('sizes.shoes', filters['sizes.shoes'])
      if (filters['sizes.clothing']) params.append('sizes.clothing', filters['sizes.clothing'])
      if (filters.size_values) params.append('size_values', filters.size_values)

      // Category filtering
      if (filters.category_ids) params.append('category_ids', filters.category_ids)
      if (filters.category_codes) params.append('category_codes', filters.category_codes)

      // Gender filtering
      if (filters.gender) params.append('gender', filters.gender)

      // Color filtering
      if (filters.color_ids) params.append('color_ids', filters.color_ids)

      // Price filtering
      if (filters.price_min) params.append('price_min', filters.price_min)
      if (filters.price_max) params.append('price_max', filters.price_max)

      // Material filtering
      if (filters.material_ids) params.append('material_ids', filters.material_ids)

      // Sorting
      if (filters.sort) params.append('sort', filters.sort)
      else params.append('sort', 'relevance') // Default sort

      // Stock filtering
      if (filters.no_soldout) params.append('no_soldout', filters.no_soldout)
      else params.append('no_soldout', '1') // Default: hide sold out

      // Pagination parameters
      params.append('size', filters.size || '60') // Items per page
      params.append('fields', filters.fields || '1') // Response fields

      const url = `${this.baseUrl}/catalog/events/${campaignId}/articles?${params.toString()}`
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🌐 [V2 API] REQUEST URL:')
      console.log(url)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Prepare headers (based on your cURL)
      const headers: Record<string, string> = {
        'accept': '*/*',
        'accept-language': 'pl,en-US;q=0.9,en;q=0.8,ru;q=0.7,de;q=0.6',
        'client_type': 'web',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://www.zalando-lounge.pl',
        'referer': `https://www.zalando-lounge.pl/campaigns/${campaignId}`,
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'x-sortdown-reserved': 'true',
        'x-touchpoint': 'catalog'
      }

      // Add dynamic tokens if available
      if (tokens.xsrfToken) {
        headers['x-xsrf-token'] = tokens.xsrfToken
      }
      if (tokens.traceId && tokens.spanId) {
        headers['b3'] = tokens.b3!
        headers['ot-tracer-sampled'] = 'true'
        headers['ot-tracer-spanid'] = tokens.spanId
        headers['ot-tracer-traceid'] = tokens.traceId
      }

      console.log('📡 [V2 API] REQUEST HEADERS:')
      console.log(headers)

      // Execute request through content script (to use browser context)
      const response = await this.executeRequestInBrowser(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({"cursor": filters.cursor || ""})
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ [V2 API] RESPONSE RECEIVED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return {
        success: true,
        data: response
      }

    } catch (error) {
      console.error('❌ [V2 API] Request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Execute request through content script to use browser's context
  private async executeRequestInBrowser(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (!activeTab.id) {
          reject(new Error('No active tab found'))
          return
        }

        chrome.scripting.executeScript(
            {
              target: { tabId: activeTab.id },
              func: async (url: string, options: any) => {
                try {
                  const response = await fetch(url, options)
                  const data = await response.json()
                  return { success: true, data, status: response.status }
                } catch (error) {
                  return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Fetch failed',
                    status: 0
                  }
                }
              },
              args: [url, options]
            },
            (results) => {
              if (results && results[0] && results[0].result) {
                const result = results[0].result
                if (result.success) {
                  resolve(result.data)
                } else {
                  reject(new Error(result.error))
                }
              } else {
                reject(new Error('Failed to execute script in browser context'))
              }
            }
        )
      })
    })
  }

  // Fetch filter counts (second request from your cURL)
  async fetchFilterCounts(campaignId: string, filters: ZalandoFilters): Promise<ZalandoApiResponse> {
    try {
      console.log('📊 [V2 API] Fetching filter counts...')

      const tokens = await this.extractTokensFromPage()
      await this.getCookiesString() // Get cookies for future use

      // Build query parameters for filter counts (based on capture analysis)
      const params = new URLSearchParams()

      // Include current filters to get accurate counts
      if (filters.brand_codes) params.append('brand_codes', filters.brand_codes)
      if (filters.category_ids) params.append('category_ids', filters.category_ids)
      if (filters.gender) params.append('gender', filters.gender)
      if (filters.color_ids) params.append('color_ids', filters.color_ids)
      if (filters['sizes.shoes']) params.append('sizes.shoes', filters['sizes.shoes'])
      if (filters.price_min) params.append('price_min', filters.price_min)
      if (filters.price_max) params.append('price_max', filters.price_max)

      // Request all filter types
      params.append('fields', 'category_filter,color_filter,gender_filter,price_filter,size_filter,brand_filter,material_filter')

      // Stock filtering
      if (filters.no_soldout) params.append('no_soldout', filters.no_soldout)
      else params.append('no_soldout', '1')

      // Enhanced size filter sorting
      params.append('use_score_size_filter_sort', 'true')

      const url = `${this.baseUrl}/catalog/events/${campaignId}/filter-counts?${params.toString()}`
      console.log('🌐 [V2 API] Filter counts URL:', url)

      const headers: Record<string, string> = {
        'accept': '*/*',
        'accept-language': 'pl,en-US;q=0.9,en;q=0.8,ru;q=0.7,de;q=0.6',
        'client_type': 'web',
        'dnt': '1',
        'origin': 'https://www.zalando-lounge.pl',
        'referer': `https://www.zalando-lounge.pl/campaigns/${campaignId}`,
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      }

      // Add dynamic tokens
      if (tokens.traceId && tokens.spanId) {
        headers['b3'] = tokens.b3!
        headers['ot-tracer-sampled'] = 'true'
        headers['ot-tracer-spanid'] = tokens.spanId
        headers['ot-tracer-traceid'] = tokens.traceId
      }

      const response = await this.executeRequestInBrowser(url, {
        method: 'GET',
        headers
      })

      return {
        success: true,
        data: response
      }

    } catch (error) {
      console.error('❌ [V2 API] Filter counts failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Convert form data to API filters (enhanced based on sizes.json + brands.json capture analysis)
  static convertFormToFilters(formData: any): ZalandoFilters {
    const filters: ZalandoFilters = {}

    // Brand mapping - handle both old string format and new array format
    console.log('🏷️ Raw brands field:', formData.brands || formData.brand, 'Type:', typeof (formData.brands || formData.brand))

    let brandCodes: string[] = []

    if (formData.brands && Array.isArray(formData.brands) && formData.brands.length > 0) {
      // New format: brands is already an array of brand codes
      brandCodes = formData.brands
      console.log('🏷️ Using brand codes from array:', brandCodes)
    } else if (formData.brand && formData.brand.trim()) {
      // Legacy format: convert brand names to codes
      console.log('🏷️ Processing legacy brand:', formData.brand)
      const brands = formData.brand.split(',').map((b: string) => b.trim().toLowerCase())
      console.log('🏷️ Split brands:', brands)
      // Enhanced brand mapping from capture analysis (brands.json + sizes.json)
      const brandMap: Record<string, string> = {
        'adidas': 'AD5',
        'adidas performance': 'AD5',
        'adidas originals': 'AD7',
        'adidas neo': 'AD1',      // From capture: AD1
        'nike': 'NI',
        'puma': 'PU1',            // From capture: PU1
        'tommy hilfiger': 'TA4',  // From capture: TA4
        'calvin klein': 'CK',
        'under armour': 'UND',
        'new balance': 'NB',
        'converse': 'CN',
        'vans': 'VA',
        'reebok': 'RB',
        // New brands from capture analysis
        'alberto': 'ALB',         // From capture: ALB
        'hugo': 'H1X',           // From capture: H1X
        'salomon': 'SA5',        // From capture: SA5
        'merrell': 'ME1',        // From capture: ME1
        'adq': 'ADQ'             // From capture: ADQ (unknown brand)
      }
      brandCodes = brands.map((brand: string) => brandMap[brand] || brand).filter(Boolean)
      console.log('🏷️ Mapped legacy brands:', brandCodes)
    } else if (formData.shoesCategory && formData.shoesCategory.includes('Buty')) {
      // Default popular shoe brands from brands.json capture
      console.log('👟 No brand specified for shoes, using popular shoe brands')
      brandCodes = ['AD7', 'TA4', 'AD1', 'AD5', 'ALB', 'H1X', 'SA5', 'ME1', 'PU1'] // From capture: most tested brands
    }

    // Set brand_codes filter if we have any
    if (brandCodes.length > 0) {
      filters.brand_codes = brandCodes.join(',')
      console.log('🏷️ Final brand_codes filter:', filters.brand_codes)
    }

    // Size filtering (enhanced based on capture analysis)
    if (formData.size) {
      console.log('👕 Processing size:', formData.size)

      // Determine if it's shoe size or clothing size
      // Auto-detect shoe sizes (typical ranges: 35-50 for shoes)
      const sizeNum = parseFloat(formData.size.split(',')[0]) // Get first size if multiple
      const isShoeSize = (sizeNum >= 35 && sizeNum <= 50) || formData.shoesCategory?.includes('Buty')

      if (isShoeSize) {
        console.log('👟 Detected shoe size, using sizes.shoes')
        // Shoe sizes - from capture analysis support multiple formats:
        // Single: sizes.shoes=43
        // Multiple: sizes.shoes=39|43 (pipe-separated)
        // With fractions: sizes.shoes=46%202%2F3 (URL encoded "46 2/3")
        filters['sizes.shoes'] = formData.size
      } else {
        console.log('👕 Detected clothing size, using sizes.clothing')
        filters['sizes.clothing'] = formData.size
      }
    }

    // Gender mapping
    if (formData.gender && formData.gender.trim() !== '') {
      console.log('👤 Processing gender:', formData.gender)
      const genderMap: Record<string, string> = {
        'mężczyźni': 'MALE',
        'kobiety': 'FEMALE',
        'unisex': 'UNISEX'
      }
      filters.gender = genderMap[formData.gender.toLowerCase()] || formData.gender.toUpperCase()
      console.log('👤 Mapped gender to:', filters.gender)
    } else {
      // Auto-detect gender based on context - default to MALE for shoes when no gender selected
      if (filters['sizes.shoes']) {
        console.log('👤 No gender selected but shoes detected, defaulting to MALE')
        filters.gender = 'MALE'
      } else {
        console.log('👤 No gender selected, skipping gender filter')
      }
    }

    // Category mapping (enhanced from capture analysis)
    console.log('📂 Processing categories...')
    console.log('📂 Form gender:', formData.gender)
    console.log('📂 Form clothing category:', formData.clothingCategory)
    console.log('📂 Form shoes category:', formData.shoesCategory)
    const categoryIds: string[] = []

    // Women's categories
    if (formData.clothingCategory && formData.gender?.toLowerCase() === 'kobiety') {
      console.log('📂 Adding women\'s clothing category')
      categoryIds.push('70097656') // Women's category
    }

    // Men's categories
    if (formData.clothingCategory && formData.gender?.toLowerCase() === 'mężczyźni') {
      console.log('📂 Adding men\'s clothing category')
      categoryIds.push('24128398') // Men's category
    }

    // Shoes categories
    if (formData.shoesCategory && formData.shoesCategory.includes('Buty')) {
      if (formData.gender?.toLowerCase() === 'kobiety') {
        console.log('📂 Adding women\'s shoes category')
        categoryIds.push('92288919') // Women's shoes
      } else if (formData.gender?.toLowerCase() === 'mężczyźni') {
        console.log('📂 Adding men\'s shoes category')
        categoryIds.push('46319661') // Men's shoes
      } else {
        console.log('📂 Adding both shoe categories (no gender selected)')
        categoryIds.push('46319661,92288919') // Both shoe categories
      }
    }

    // Sports categories
    if (formData.equipmentCategory && formData.equipmentCategory.includes('Sport')) {
      if (formData.gender?.toLowerCase() === 'mężczyźni') {
        categoryIds.push('74368050') // Men's sports shoes
      }
      categoryIds.push('192089653') // Sports shoes general
    }

    if (categoryIds.length > 0) {
      filters.category_ids = categoryIds.join(',')
      console.log('📂 Mapped categories:', filters.category_ids)
    }

    // Color mapping (if provided)
    if (formData.color) {
      const colorMap: Record<string, string> = {
        'czarny': '0',
        'biały': '800',
        'niebieski': '500',
        'czerwony': '600',
        'zielony': '400',
        'żółty': '300',
        'różowy': '700',
        'fioletowy': '900'
      }
      const colorId = colorMap[formData.color.toLowerCase()]
      if (colorId) {
        filters.color_ids = colorId
      }
    }

    // Price range (if provided)
    if (formData.priceMin) {
      filters.price_min = (parseFloat(formData.priceMin) * 100).toString() // Convert to cents
    }
    if (formData.priceMax) {
      filters.price_max = (parseFloat(formData.priceMax) * 100).toString() // Convert to cents
    }

    // Sort method mapping
    if (formData.sortMethod) {
      const sortMap: Record<string, string> = {
        'popularne': 'relevance',
        'relevance': 'relevance',
        'najniższa cena': 'price_asc',
        'najwyższa cena': 'price_desc',
        'nowości': 'newest',
        'wyprzedaż': 'savings'
      }
      filters.sort = sortMap[formData.sortMethod.toLowerCase()] || 'relevance'
    }

    // Stock filtering (always exclude sold out by default)
    filters.no_soldout = formData.includeSoldOut === true ? '0' : '1'

    console.log('🎯 Final filters:', filters)
    return filters
  }

  // Helper method to get available filter options for a campaign
  async getAvailableFilters(campaignId: string): Promise<ZalandoApiResponse> {
    try {
      console.log('🔍 [V2 API] Getting available filters for campaign:', campaignId)

      const emptyFilters: ZalandoFilters = {} // Get all available options
      const result = await this.fetchFilterCounts(campaignId, emptyFilters)

      if (result.success && result.data) {
        // Parse the filter data to extract available options
        const filterOptions = this.parseFilterOptions(result.data)

        return {
          success: true,
          data: filterOptions
        }
      }

      return result
    } catch (error) {
      console.error('❌ [V2 API] Get available filters failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Parse filter counts response to extract available options
  private parseFilterOptions(filterData: any): any {
    const options: any = {
      brands: [],
      categories: [],
      sizes: { shoes: [], clothing: [] },
      colors: [],
      priceRange: { min: 0, max: 0 },
      genders: []
    }

    try {
      // Parse brand filter
      if (filterData.brand_filter && Array.isArray(filterData.brand_filter)) {
        options.brands = filterData.brand_filter.map((brand: any) => ({
          code: brand.brandCode,
          name: brand.brandName,
          count: brand.count
        }))
      }

      // Parse category filter
      if (filterData.category_filter && filterData.category_filter.categories) {
        const parseCategories = (categories: any[]): any[] => {
          return categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            count: cat.count,
            parentId: cat.parentId,
            children: cat.categories ? parseCategories(cat.categories) : []
          }))
        }
        options.categories = parseCategories(filterData.category_filter.categories)
      }

      // Parse size filter
      if (filterData.size_filter) {
        if (filterData.size_filter.shoes && filterData.size_filter.shoes.values) {
          options.sizes.shoes = filterData.size_filter.shoes.values.map((size: any) => ({
            value: size.value,
            count: size.count
          }))
        }
        if (filterData.size_filter.dresses && filterData.size_filter.dresses.values) {
          options.sizes.clothing = filterData.size_filter.dresses.values.map((size: any) => ({
            value: size.value,
            count: size.count
          }))
        }
      }

      // Parse color filter
      if (filterData.color_filter && Array.isArray(filterData.color_filter)) {
        options.colors = filterData.color_filter.map((color: any) => ({
          id: color.value,
          count: color.count
        }))
      }

      // Parse price filter
      if (filterData.price_filter) {
        options.priceRange = {
          min: filterData.price_filter.min || 0,
          max: filterData.price_filter.max || 0
        }
      }

      // Parse gender filter (if available)
      if (filterData.gender_filter && Array.isArray(filterData.gender_filter)) {
        options.genders = filterData.gender_filter.map((gender: any) => ({
          value: gender.value,
          count: gender.count
        }))
      }

    } catch (error) {
      console.error('❌ Error parsing filter options:', error)
    }

    return options
  }

  // Method to build pagination filters for next page
  static buildPaginationFilters(currentFilters: ZalandoFilters, cursor: string): ZalandoFilters {
    return {
      ...currentFilters,
      cursor: cursor
    }
  }

  // Method to build combined filters (for advanced filtering)
  static combineFilters(...filterSets: ZalandoFilters[]): ZalandoFilters {
    const combined: ZalandoFilters = {}

    filterSets.forEach(filters => {
      Object.keys(filters).forEach(key => {
        const filterKey = key as keyof ZalandoFilters
        const value = filters[filterKey]

        if (value) {
          if (combined[filterKey]) {
            // Combine values for array-like parameters
            if (filterKey.includes('_codes') || filterKey.includes('_ids') || filterKey.includes('sizes.')) {
              combined[filterKey] = `${combined[filterKey]},${value}`
            } else {
              // For single-value parameters, use the latest value
              combined[filterKey] = value
            }
          } else {
            combined[filterKey] = value
          }
        }
      })
    })

    return combined
  }

  // Helper method for size formatting (based on capture analysis)
  static formatSizeParameter(sizes: string[], productType: 'shoes' | 'clothing' = 'shoes'): string {
    if (productType === 'shoes') {
      // Shoe sizes use pipe separation: "39|43|47"
      // Fractions get URL encoded: "46 2/3" becomes "46%202%2F3"
      return sizes.map(size => {
        // Handle fractional sizes (like "46 2/3")
        if (size.includes(' ')) {
          return encodeURIComponent(size)
        }
        return size
      }).join('|')
    } else {
      // Clothing sizes might use different format
      return sizes.join(',')
    }
  }

  // Helper method for brand codes formatting
  static formatBrandCodes(brandCodes: string[]): string {
    // Brand codes use comma separation: "AD1,AD5,ADQ"
    // From capture: brand_codes=AD1%2CAD5%2CADQ (URL encoded commas)
    return brandCodes.join(',')
  }

  // Method to validate filter combinations (based on capture patterns)
  static validateFilters(filters: ZalandoFilters): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []

    // Check for conflicting size parameters
    if (filters['sizes.shoes'] && filters['sizes.clothing']) {
      warnings.push('Both shoe and clothing sizes specified - may conflict')
    }

    // Validate brand codes format
    if (filters.brand_codes) {
      const codes = filters.brand_codes.split(',')
      codes.forEach(code => {
        if (code.length < 2 || code.length > 4) {
          warnings.push(`Unusual brand code format: ${code}`)
        }
      })
    }

    // Validate shoe sizes format
    if (filters['sizes.shoes']) {
      const sizes = filters['sizes.shoes'].split('|')
      sizes.forEach(size => {
        const decoded = decodeURIComponent(size)
        if (!/^\d+(\.\d+|\s\d+\/\d+)?$/.test(decoded)) {
          warnings.push(`Unusual shoe size format: ${decoded}`)
        }
      })
    }

    return { valid: warnings.length === 0, warnings }
  }

  // Cart functionality methods
  async addToCart(campaignId: string, product: any, targetSize: string): Promise<ZalandoApiResponse> {
    try {
      console.log(`🛒 [V2 API] Adding to cart: ${product.sku}, size: ${targetSize}`)

      // Find the simpleSku for the target size
      const simpleProduct = product.simples?.find((simple: any) => {
        const size = simple.size || simple.filterValue || simple.country_sizes?.eu
        const isAvailable = simple.stockStatus === 'AVAILABLE'

        const matches = size === targetSize && isAvailable

        console.log(`  🔍 Checking size ${size} for ${product.sku}: available=${isAvailable}, stockStatus=${simple.stockStatus}, matches=${matches}`)

        return matches
      })

      if (!simpleProduct) {
        // Log available sizes for debugging
        console.log(`❌ Size ${targetSize} not available for product ${product.sku}`)
        console.log(`   Available sizes:`, product.simples?.map((s: any) => ({
          size: s.size || s.filterValue || s.country_sizes?.eu,
          status: s.stockStatus
        })))

        return {
          success: false,
          error: `Size ${targetSize} not available for product ${product.sku}`
        }
      }

      console.log(`🎯 Found simpleSku: ${simpleProduct.sku} for size ${targetSize}`)

      const tokens = await this.extractTokensFromPage()
      await this.getCookiesString()

      const url = `${this.baseUrl}/stockcart/cart/items`
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🛒 [V2 API] ADD TO CART URL:')
      console.log(url)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      const headers: Record<string, string> = {
        'accept': '*/*',
        'accept-language': 'pl,en-US;q=0.9,en;q=0.8,ru;q=0.7,de;q=0.6',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://www.zalando-lounge.pl',
        'referer': `https://www.zalando-lounge.pl/campaigns/${campaignId}/articles/${product.sku}`,
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      }

      // Add dynamic tokens
      if (tokens.xsrfToken) {
        headers['x-xsrf-token'] = tokens.xsrfToken
      }
      if (tokens.traceId && tokens.spanId) {
        headers['b3'] = tokens.b3!
        headers['ot-tracer-sampled'] = 'true'
        headers['ot-tracer-spanid'] = tokens.spanId
        headers['ot-tracer-traceid'] = tokens.traceId
      }

      console.log('📡 [V2 API] ADD TO CART HEADERS:')
      console.log(headers)

      const body = JSON.stringify({
        quantity: 1,
        campaignIdentifier: campaignId,
        configSku: product.sku,
        simpleSku: simpleProduct.sku,
        additional: { reco: 0 }
      })

      console.log('📦 [V2 API] ADD TO CART BODY:')
      console.log(body)

      const response = await this.executeRequestInBrowser(url, {
        method: 'POST',
        headers,
        body
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ [V2 API] ADD TO CART RESPONSE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      return {
        success: true,
        data: response
      }

    } catch (error) {
      console.error('❌ [V2 API] Add to cart failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getCart(): Promise<ZalandoApiResponse> {
    try {
      console.log('🛒 [V2 API] Getting cart contents...')

      const tokens = await this.extractTokensFromPage()
      await this.getCookiesString()

      const url = `${this.baseUrl}/stockcart/cart`

      const headers: Record<string, string> = {
        'accept': '*/*',
        'accept-language': 'pl,en-US;q=0.9,en;q=0.8,ru;q=0.7,de;q=0.6',
        'dnt': '1',
        'referer': 'https://www.zalando-lounge.pl/',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      }

      // Add dynamic tokens
      if (tokens.traceId && tokens.spanId) {
        headers['b3'] = tokens.b3!
        headers['ot-tracer-sampled'] = 'true'
        headers['ot-tracer-spanid'] = tokens.spanId
        headers['ot-tracer-traceid'] = tokens.traceId
      }

      const response = await this.executeRequestInBrowser(url, {
        method: 'GET',
        headers
      })

      return {
        success: true,
        data: response
      }

    } catch (error) {
      console.error('❌ [V2 API] Get cart failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Add multiple products to cart (bulk adding)
  async addMultipleToCart(campaignId: string, products: any[], targetSize?: string, maxCount: number = 5): Promise<ZalandoApiResponse> {
    try {
      console.log(`🛒 [V2 API] Starting bulk add to cart: ${maxCount} products`)

      const results: any[] = []
      const errors: string[] = []
      let successCount = 0

      // Process products one by one to avoid overwhelming the API
      for (let i = 0; i < Math.min(products.length, maxCount); i++) {
        const product = products[i]
        console.log(`🛒 [${i + 1}/${maxCount}] Processing product: ${product.sku}`)

        try {
          // Find available size for this product with more robust validation
          let sizeToAdd = targetSize

          // If no target size specified, find first available size
          if (!sizeToAdd) {
            const availableSimple = product.simples?.find((simple: any) =>
                simple.stockStatus === 'AVAILABLE'
            )
            sizeToAdd = availableSimple?.size || availableSimple?.filterValue || availableSimple?.country_sizes?.eu
          }

          if (!sizeToAdd) {
            console.log(`⚠️ No available size for product ${product.sku}`)
            errors.push(`No available size for product ${product.sku}`)
            continue
          }

          // Add to cart
          const cartResult = await this.addToCart(campaignId, product, sizeToAdd)

          if (cartResult.success) {
            successCount++
            results.push({
              sku: product.sku,
              size: sizeToAdd,
              success: true,
              response: cartResult.data
            })
            console.log(`✅ [${i + 1}/${maxCount}] Added ${product.sku} (size ${sizeToAdd})`)
          } else {
            errors.push(`Failed to add ${product.sku}: ${cartResult.error}`)
            results.push({
              sku: product.sku,
              size: sizeToAdd,
              success: false,
              error: cartResult.error
            })
            console.log(`❌ [${i + 1}/${maxCount}] Failed ${product.sku}: ${cartResult.error}`)
          }

          // Small delay between requests to be respectful to the API
          if (i < maxCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error processing ${product.sku}: ${errorMsg}`)
          console.error(`❌ Error processing product ${product.sku}:`, error)
        }
      }

      console.log(`🎯 [V2 API] Bulk add completed: ${successCount}/${maxCount} successful`)

      return {
        success: successCount > 0,
        data: {
          totalAttempted: Math.min(products.length, maxCount),
          successCount,
          failedCount: Math.min(products.length, maxCount) - successCount,
          results,
          errors: errors.length > 0 ? errors : undefined
        }
      }

    } catch (error) {
      console.error('❌ [V2 API] Bulk add to cart failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Complete workflow: filter products and add specified number to cart
  async filterAndAddToCart(campaignId: string, filters: ZalandoFilters, targetSize?: string, productCount: number = 1): Promise<ZalandoApiResponse> {
    try {
      console.log(`🎯 [V2 API] Starting complete workflow: filter + add ${productCount} products to cart`)

      // Step 1: Get filtered products
      const productsResult = await this.fetchProducts(campaignId, filters)
      if (!productsResult.success || !productsResult.data?.configs?.length) {
        return {
          success: false,
          error: 'No products found with these filters'
        }
      }

      const products = productsResult.data.configs
      console.log(`📦 Found ${products.length} products`)

      // Log first few products to understand structure
      if (products.length > 0) {
        console.log('📦 Sample product structure:')
        console.log('Product 0:', JSON.stringify(products[0], null, 2))

        if (products[0].simples) {
          console.log('📦 Available sizes in first product:')
          products[0].simples.forEach((simple: any, index: number) => {
            console.log(`  Size ${index}:`, simple.size, 'Stock:', simple.stock?.quantity || 0)
          })
        }
      }

      // Step 2: Filter products by target size (if specified) and availability
      let suitableProducts = products

      if (targetSize) {
        console.log(`🔍 Filtering products for size: ${targetSize}`)

        // Filter products that have the target size available
        suitableProducts = products.filter((product: any) => {
          const sizes = product.simples || []

          // Find matching sizes for this product
          const matchingSizes = sizes.filter((simple: any) => {
            const size = simple.size || simple.filterValue || simple.country_sizes?.eu
            const isAvailable = simple.stockStatus === 'AVAILABLE'

            const matches = size === targetSize && isAvailable

            if (size === targetSize) {
              console.log(`  📦 Product ${product.sku} size ${size}: available=${isAvailable}, stockStatus=${simple.stockStatus}, matches=${matches}`)
            }

            return matches
          })

          const hasValidSize = matchingSizes.length > 0
          if (hasValidSize) {
            console.log(`  ✅ Product ${product.sku} has valid size ${targetSize}`)
          }

          return hasValidSize
        })

        console.log(`📦 Found ${suitableProducts.length} products with size ${targetSize} after strict filtering`)
      } else {
        // Filter products that have at least one available size
        suitableProducts = products.filter((product: any) => {
          const sizes = product.simples || []
          const hasAvailableSize = sizes.some((simple: any) => {
            return simple.stockStatus === 'AVAILABLE'
          })

          if (hasAvailableSize) {
            console.log(`  ✅ Product ${product.sku} has available sizes`)
          }

          return hasAvailableSize
        })
        console.log(`📦 Found ${suitableProducts.length} products with available sizes`)
      }

      if (suitableProducts.length === 0) {
        return {
          success: false,
          error: targetSize ? `No products found with size ${targetSize}` : 'No products with available sizes'
        }
      }

      // Step 3: Add products to cart (up to specified count)
      if (productCount === 1) {
        // Single product workflow (original behavior)
        const targetProduct = suitableProducts[0]
        const sizeToAdd = targetSize || targetProduct.simples?.find((s: any) => s.stockStatus === 'AVAILABLE')?.size || 'M'

        console.log(`🛒 Adding single product to cart: SKU=${targetProduct.sku}, Size=${sizeToAdd}`)
        const cartResult = await this.addToCart(campaignId, targetProduct, sizeToAdd)

        if (cartResult.success) {
          console.log('🎉 [V2 API] Single product workflow successful!')
          return {
            success: true,
            data: {
              totalProducts: 1,
              products: [targetProduct],
              cartResponse: cartResult.data,
              addedSize: sizeToAdd
            }
          }
        } else {
          return cartResult
        }
      } else {
        // Multiple products workflow
        console.log(`🛒 Starting bulk add: ${productCount} products`)
        const bulkResult = await this.addMultipleToCart(campaignId, suitableProducts, targetSize, productCount)

        if (bulkResult.success) {
          console.log('🎉 [V2 API] Bulk workflow successful!')
          return {
            success: true,
            data: {
              totalProducts: productCount,
              ...bulkResult.data
            }
          }
        } else {
          return bulkResult
        }
      }

    } catch (error) {
      console.error('❌ [V2 API] Complete workflow failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}