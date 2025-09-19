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