import MultiSelectBrands from './MultiSelectBrands'

interface CampaignPlanningProps {
  campaignId: string
  executionTime: string
  delay: number
  brands: string[]
  size: string
  sortMethod: string
  itemsToAdd: number
  gender: string
  clothingCategory: string
  shoesCategory: string
  accessoriesCategory: string
  equipmentCategory: string
  onCampaignIdChange: (value: string) => void
  onExecutionTimeChange: (value: string) => void
  onDelayChange: (value: number) => void
  onBrandsChange: (value: string[]) => void
  onSizeChange: (value: string) => void
  onSortMethodChange: (value: string) => void
  onItemsToAddChange: (value: number) => void
  onGenderChange: (value: string) => void
  onClothingCategoryChange: (value: string) => void
  onShoesCategoryChange: (value: string) => void
  onAccessoriesCategoryChange: (value: string) => void
  onEquipmentCategoryChange: (value: string) => void
  onScheduleCampaign: () => Promise<void>
}

export default function CampaignPlanning({
  campaignId,
  executionTime,
  delay,
  brands,
  size,
  sortMethod,
  itemsToAdd,
  gender,
  clothingCategory,
  shoesCategory,
  accessoriesCategory,
  equipmentCategory,
  onCampaignIdChange,
  onExecutionTimeChange,
  onDelayChange,
  onBrandsChange,
  onSizeChange,
  onSortMethodChange,
  onItemsToAddChange,
  onGenderChange,
  onClothingCategoryChange,
  onShoesCategoryChange,
  onAccessoriesCategoryChange,
  onEquipmentCategoryChange,
  onScheduleCampaign
}: CampaignPlanningProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          Planowanie Kampanii
        </h2>
        <p className="text-sm text-gray-600 mt-1">Ustaw kampanię, filtry i czas automatycznego wykonania</p>
      </div>
      <div className="p-4 space-y-6">
        {/* Campaign Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
            Harmonogram
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Kampanii
              </label>
              <input
                type="text"
                value={campaignId}
                onChange={(e) => onCampaignIdChange(e.target.value)}
                placeholder="np. ZZO3RYK"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Czas Wykonania
              </label>
              <input
                type="datetime-local"
                value={executionTime}
                onChange={(e) => onExecutionTimeChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opóźnienie (ms)
              </label>
              <input
                type="number"
                value={delay}
                onChange={(e) => onDelayChange(parseInt(e.target.value) || 500)}
                min="0"
                max="10000"
                step="100"
                placeholder="500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Domyślnie 500ms</p>
            </div>
          </div>
        </div>

        {/* Basic Filters */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            Podstawowe Filtry
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <MultiSelectBrands
              selectedBrands={brands}
              onBrandsChange={onBrandsChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rozmiar
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => onSizeChange(e.target.value)}
                placeholder="46 lub 46,47,48"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
            Kategorie
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Płeć
              </label>
              <select
                value={gender}
                onChange={(e) => onGenderChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="">Wszystkie</option>
                <option value="Mężczyźni">Mężczyźni</option>
                <option value="Kobiety">Kobiety</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Odzież
                </label>
                <select
                  value={clothingCategory}
                  onChange={(e) => onClothingCategoryChange(e.target.value)}
                  disabled={!!(shoesCategory || accessoriesCategory || equipmentCategory)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${(shoesCategory || accessoriesCategory || equipmentCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                >
                  <option value="">{(shoesCategory || accessoriesCategory || equipmentCategory) ? 'Zablokowane' : 'Wszystkie'}</option>
                  <option value="Wszystkie w kategorii Odzież">Wszystkie w kategorii Odzież</option>
                  <option value="T-shirty i koszulki polo">T-shirty i koszulki polo</option>
                  <option value="Swetry i bluzy">Swetry i bluzy</option>
                  <option value="Kurtki i płaszcze">Kurtki i płaszcze</option>
                  <option value="Spodnie">Spodnie</option>
                  <option value="Dresy">Dresy</option>
                  <option value="Koszulki klubowe i akcesoria dla kibiców">Koszulki klubowe</option>
                  <option value="Bielizna">Bielizna</option>
                  <option value="Skarpetki">Skarpetki</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buty
                </label>
                <select
                  value={shoesCategory}
                  onChange={(e) => onShoesCategoryChange(e.target.value)}
                  disabled={!!(clothingCategory || accessoriesCategory || equipmentCategory)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${(clothingCategory || accessoriesCategory || equipmentCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                >
                  <option value="">{(clothingCategory || accessoriesCategory || equipmentCategory) ? 'Zablokowane' : 'Wszystkie'}</option>
                  <option value="Wszystkie w kategorii Buty">Wszystkie w kategorii Buty</option>
                  <option value="Buty sportowe">Buty sportowe</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Akcesoria
                </label>
                <select
                  value={accessoriesCategory}
                  onChange={(e) => onAccessoriesCategoryChange(e.target.value)}
                  disabled={!!(clothingCategory || shoesCategory || equipmentCategory)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${(clothingCategory || shoesCategory || equipmentCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                >
                  <option value="">{(clothingCategory || shoesCategory || equipmentCategory) ? 'Zablokowane' : 'Wszystkie'}</option>
                  <option value="Wszystkie w kategorii Akcesoria">Wszystkie w kategorii Akcesoria</option>
                  <option value="Torby i walizki">Torby i walizki</option>
                  <option value="Zegarki">Zegarki</option>
                  <option value="Czapki i kapelusze">Czapki i kapelusze</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprzęt
                </label>
                <select
                  value={equipmentCategory}
                  onChange={(e) => onEquipmentCategoryChange(e.target.value)}
                  disabled={!!(clothingCategory || shoesCategory || accessoriesCategory)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${(clothingCategory || shoesCategory || accessoriesCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                >
                  <option value="">{(clothingCategory || shoesCategory || accessoriesCategory) ? 'Zablokowane' : 'Wszystkie'}</option>
                  <option value="Wszystkie w kategorii Sprzęt">Wszystkie w kategorii Sprzęt</option>
                  <option value="Piłki i rakiety">Piłki i rakiety</option>
                  <option value="Zegarki sportowe i elektronika">Zegarki sportowe</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Dodatkowe Ustawienia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metoda Sortowania
              </label>
              <select
                value={sortMethod}
                onChange={(e) => onSortMethodChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="Popularne">Popularne</option>
                <option value="Najniższa cena">Najniższa cena</option>
                <option value="Najwyższa cena">Najwyższa cena</option>
                <option value="Wyprzedaż">Wyprzedaż</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ilość Produktów
              </label>
              <input
                type="number"
                value={itemsToAdd}
                onChange={(e) => onItemsToAddChange(parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={onScheduleCampaign}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all transform hover:scale-105"
          >
            📅 Zaplanuj Kampanię
          </button>
        </div>
      </div>
    </div>
  )
}