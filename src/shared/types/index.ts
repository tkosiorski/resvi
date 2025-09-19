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

// Component props types
export interface HeaderProps {
  autoExtendCart: boolean
  onCartExtensionToggle: (enabled: boolean) => void
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

// Service types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ProductSearchFilters {
  brandCodes?: string
  categoryIds?: string
  gender?: string
  shoeSizes?: string
  clothingSizes?: string
  priceMax?: string
  sort?: string
}

export interface Product {
  sku?: string
  id?: string
  simple_key?: string
  simples?: ProductVariant[]
}

export interface ProductVariant {
  sku: string
  stockStatus: string
}

export interface CartAddResult {
  successCount: number
  failedCount: number
}

export interface CampaignExecutionResult {
  success: boolean
  data?: {
    totalProducts: number
    successCount: number
    failedCount: number
  }
  error?: string
}