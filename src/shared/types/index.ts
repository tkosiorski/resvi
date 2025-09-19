// Core domain types
export interface Campaign {
  id: string
  executionTime: number
  delay?: number
  filters: CampaignFilters
  sortMethod: string
  itemsToAdd: number
  success?: boolean
  addedToCart?: number
  totalFound?: number
}

export interface CampaignFilters {
  brands: string[]
  size: string
  color: string
  maxPrice: number
}

export interface FormData {
  campaignId: string
  executionTime: string
  delay: number
  brands: string[]
  size: string
  color: string
  maxPrice: number
  gender: string
  clothingCategory: string
  shoesCategory: string
  accessoriesCategory: string
  equipmentCategory: string
  sortMethod: string
  itemsToAdd: number
}

// API related types
export interface ZalandoFilters {
  // Brand filtering
  brand_codes?: string  // Comma-separated brand codes (e.g., 'AD5,PU1')

  // Size filtering
  'sizes.shoes'?: string      // Shoe sizes (e.g., '44,45')
  'sizes.clothing'?: string   // Clothing sizes (e.g., 'M,L')
  size_values?: string        // Generic size values

  // Category filtering
  category_ids?: string       // Category IDs (e.g., '46319661,70097656')
  category_codes?: string     // Category codes

  // Gender filtering
  gender?: string            // MALE, FEMALE, UNISEX

  // Color filtering
  color_ids?: string         // Color IDs (e.g., '0,800')

  // Price filtering
  price_min?: string         // Minimum price in cents
  price_max?: string         // Maximum price in cents

  // Sorting and pagination
  sort?: string              // relevance, price_asc, price_desc, newest
  size?: string              // Page size (default 60)
  cursor?: string            // Pagination cursor

  // Stock filtering
  no_soldout?: string        // '0' include, '1' exclude sold out

  // Additional filters
  material_ids?: string      // Material filter IDs
  fields?: string            // Response fields
}

export interface ZalandoApiResponse {
  success: boolean
  data?: any
  error?: string
}

// Component props types
export interface HeaderProps {
  autoExtendCart: boolean
  onCartExtensionToggle: (enabled: boolean) => void
}

export interface CampaignSchedulingProps {
  campaignId: string
  executionTime: string
  delay: number
  onCampaignIdChange: (value: string) => void
  onExecutionTimeChange: (value: string) => void
  onDelayChange: (value: number) => void
  onScheduleCampaign: () => Promise<void>
}

export interface MultiSelectBrandsProps {
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void
}

export interface ActiveCampaignsProps {
  campaigns: Campaign[]
  onCancelCampaign: (campaignId: string) => Promise<void>
  onClearHistory?: () => Promise<void>
}

export interface Brand {
  code: string
  name: string
}


// Service response types
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Campaign execution results
export interface CampaignExecutionResult {
  success: boolean
  data?: {
    totalProducts?: number
    successCount?: number
    failedCount?: number
  }
  error?: string
}