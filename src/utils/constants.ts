export const SORT_OPTIONS = [
  'Popularne',
  'Najniższa cena',
  'Najwyższa cena',
  'Wyprzedaż'
] as const

export const GENDER_OPTIONS = [
  { value: '', label: 'Wszystkie' },
  { value: 'Mężczyźni', label: 'Mężczyźni' },
  { value: 'Kobiety', label: 'Kobiety' }
] as const

export const CLOTHING_CATEGORIES = [
  { value: '', label: 'Wszystkie' },
  { value: 'Wszystkie w kategorii Odzież', label: 'Wszystkie w kategorii Odzież' },
  { value: 'T-shirty i koszulki polo', label: 'T-shirty i koszulki polo' },
  { value: 'Swetry i bluzy', label: 'Swetry i bluzy' },
  { value: 'Kurtki i płaszcze', label: 'Kurtki i płaszcze' },
  { value: 'Spodnie', label: 'Spodnie' },
  { value: 'Dresy', label: 'Dresy' },
  { value: 'Koszulki klubowe i akcesoria dla kibiców', label: 'Koszulki klubowe' },
  { value: 'Bielizna', label: 'Bielizna' },
  { value: 'Skarpetki', label: 'Skarpetki' }
] as const

export const SHOES_CATEGORIES = [
  { value: '', label: 'Wszystkie' },
  { value: 'Wszystkie w kategorii Buty', label: 'Wszystkie w kategorii Buty' },
  { value: 'Buty sportowe', label: 'Buty sportowe' }
] as const

export const ACCESSORIES_CATEGORIES = [
  { value: '', label: 'Wszystkie' },
  { value: 'Wszystkie w kategorii Akcesoria', label: 'Wszystkie w kategorii Akcesoria' },
  { value: 'Torby i walizki', label: 'Torby i walizki' },
  { value: 'Zegarki', label: 'Zegarki' },
  { value: 'Czapki i kapelusze', label: 'Czapki i kapelusze' }
] as const

export const EQUIPMENT_CATEGORIES = [
  { value: '', label: 'Wszystkie' },
  { value: 'Wszystkie w kategorii Sprzęt', label: 'Wszystkie w kategorii Sprzęt' },
  { value: 'Piłki i rakiety', label: 'Piłki i rakiety' },
  { value: 'Zegarki sportowe i elektronika', label: 'Zegarki sportowe' }
] as const

export const DEFAULT_FORM_VALUES = {
  campaignId: '',
  brand: 'Salomon',
  size: '46',
  color: '',
  maxPrice: 300,
  sortMethod: 'Popularne',
  itemsToAdd: 5,
  executionTime: '',
  gender: '',
  clothingCategory: '',
  shoesCategory: '',
  accessoriesCategory: '',
  equipmentCategory: ''
} as const

export const STORAGE_KEYS = {
  MAIN_FORM_DATA: 'mainFormData',
  CAMPAIGNS: 'campaigns'
} as const