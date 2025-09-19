import Header from '../../components/Header'
import CampaignPlanning from '../../components/CampaignPlanning'
import ActiveCampaigns from '../../components/ActiveCampaigns'
import { useFormData } from '../../hooks/useFormData'
import { useCampaigns } from '../../hooks/useCampaigns'
import { useCartExtension } from '../../hooks/useCartExtension'
import { isValidCampaignId, isValidExecutionTime } from '../../shared/utils/formatters'
import type { Campaign, FormData } from '../../shared/types'

export default function Popup() {
  const { formData, updateField, resetCategoryFields } = useFormData()
  const { activeCampaigns, scheduleCampaign, cancelCampaign, clearHistory } = useCampaigns()
  const { autoExtendCart, toggleCartExtension } = useCartExtension()

  const handleScheduleCampaign = async () => {
    if (!isValidCampaignId(formData.campaignId) || !isValidExecutionTime(formData.executionTime)) {
      alert('Proszę wypełnić wszystkie wymagane pola')
      return
    }

    const campaign: Campaign = {
      id: formData.campaignId,
      executionTime: new Date(formData.executionTime).getTime(),
      delay: formData.delay,
      filters: {
        brands: formData.brands,
        size: formData.size,
        color: formData.color,
        maxPrice: formData.maxPrice
      },
      sortMethod: formData.sortMethod,
      itemsToAdd: formData.itemsToAdd
    }

    const success = await scheduleCampaign(campaign)

    if (success) {
      updateField('campaignId', '')
      updateField('executionTime', '')
      alert('Kampania została zaplanowana!')
    } else {
      alert('Błąd podczas planowania kampanii')
    }
  }

  const handleCancelCampaign = async (campaignId: string) => {
    const success = await cancelCampaign(campaignId)

    if (success) {
      alert('Kampania anulowana')
    } else {
      alert('Błąd podczas anulowania kampanii')
    }
  }

  const handleClearHistory = async () => {
    if (confirm('Czy na pewno chcesz wyczyścić historię kampanii?')) {
      const success = await clearHistory()

      if (success) {
        alert('Historia kampanii została wyczyszczona')
      } else {
        alert('Błąd podczas czyszczenia historii')
      }
    }
  }



  const handleGenderChange = (value: string) => {
    updateField('gender', value)
    resetCategoryFields()
  }

  const handleCategoryChange = (field: keyof FormData, value: string) => {
    updateField(field, value)

    if (value) {
      const otherCategories: (keyof FormData)[] = ['clothingCategory', 'shoesCategory', 'accessoriesCategory', 'equipmentCategory']
      otherCategories
          .filter(cat => cat !== field)
          .forEach(cat => updateField(cat, ''))
    }
  }

  return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header
            autoExtendCart={autoExtendCart}
            onCartExtensionToggle={toggleCartExtension}
        />

        <div className="p-4 space-y-4">
          <CampaignPlanning
              campaignId={formData.campaignId}
              executionTime={formData.executionTime}
              delay={formData.delay}
              brands={formData.brands}
              size={formData.size}
              sortMethod={formData.sortMethod}
              itemsToAdd={formData.itemsToAdd}
              gender={formData.gender}
              clothingCategory={formData.clothingCategory}
              shoesCategory={formData.shoesCategory}
              accessoriesCategory={formData.accessoriesCategory}
              equipmentCategory={formData.equipmentCategory}
              onCampaignIdChange={(value) => updateField('campaignId', value)}
              onExecutionTimeChange={(value) => updateField('executionTime', value)}
              onDelayChange={(value) => updateField('delay', value)}
              onBrandsChange={(value) => updateField('brands', value)}
              onSizeChange={(value) => updateField('size', value)}
              onSortMethodChange={(value) => updateField('sortMethod', value)}
              onItemsToAddChange={(value) => updateField('itemsToAdd', value)}
              onGenderChange={handleGenderChange}
              onClothingCategoryChange={(value) => handleCategoryChange('clothingCategory', value)}
              onShoesCategoryChange={(value) => handleCategoryChange('shoesCategory', value)}
              onAccessoriesCategoryChange={(value) => handleCategoryChange('accessoriesCategory', value)}
              onEquipmentCategoryChange={(value) => handleCategoryChange('equipmentCategory', value)}
              onScheduleCampaign={handleScheduleCampaign}
          />

          <ActiveCampaigns
              campaigns={activeCampaigns}
              onCancelCampaign={handleCancelCampaign}
              onClearHistory={handleClearHistory}
          />

        </div>
      </div>
  )
}