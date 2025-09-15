import Header from '../../components/Header'
import TestZone from '../../components/TestZone'
import FilterConfiguration from '../../components/FilterConfiguration'
import CampaignScheduling from '../../components/CampaignScheduling'
import ActiveCampaigns from '../../components/ActiveCampaigns'
import { useFormData } from '../../hooks/useFormData'
import { useCampaigns } from '../../hooks/useCampaigns'
import { TestService } from '../../services/TestService'
import { isValidCampaignId, isValidExecutionTime } from '../../utils/formatters'

interface Campaign {
  id: string
  executionTime: number
  executionDelay: number
  filters: {
    brand: string
    size: string
    color: string
    maxPrice: number
  }
  sortMethod: string
  itemsToAdd: number
}

export default function Popup() {
  const { formData, updateField, resetCategoryFields } = useFormData()
  const { activeCampaigns, scheduleCampaign, cancelCampaign } = useCampaigns()

  const handleScheduleCampaign = async () => {
    if (!isValidCampaignId(formData.campaignId) || !isValidExecutionTime(formData.executionTime)) {
      alert('Proszę wypełnić wszystkie wymagane pola')
      return
    }

    const campaign: Campaign = {
      id: formData.campaignId,
      executionTime: new Date(formData.executionTime).getTime(),
      executionDelay: formData.executionDelay,
      filters: {
        brand: formData.brand,
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

  const handleTestButtonClick = async () => {
    const result = await TestService.runTest(formData.campaignId, formData)

    if (!result.success) {
      alert(result.message)
    }
  }

  const handleGenderChange = (value: string) => {
    updateField('gender', value)
    resetCategoryFields()
  }

  const handleCategoryChange = (field: string, value: string) => {
    updateField(field, value)

    if (value) {
      const otherCategories = ['clothingCategory', 'shoesCategory', 'accessoriesCategory', 'equipmentCategory']
      otherCategories
        .filter(cat => cat !== field)
        .forEach(cat => updateField(cat, ''))
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="p-4 space-y-4">
        <TestZone
          campaignId={formData.campaignId}
          onTestClick={handleTestButtonClick}
        />

        <FilterConfiguration
          brand={formData.brand}
          size={formData.size}
          maxPrice={formData.maxPrice}
          sortMethod={formData.sortMethod}
          itemsToAdd={formData.itemsToAdd}
          gender={formData.gender}
          clothingCategory={formData.clothingCategory}
          shoesCategory={formData.shoesCategory}
          accessoriesCategory={formData.accessoriesCategory}
          equipmentCategory={formData.equipmentCategory}
          onBrandChange={(value) => updateField('brand', value)}
          onSizeChange={(value) => updateField('size', value)}
          onMaxPriceChange={(value) => updateField('maxPrice', value)}
          onSortMethodChange={(value) => updateField('sortMethod', value)}
          onItemsToAddChange={(value) => updateField('itemsToAdd', value)}
          onGenderChange={handleGenderChange}
          onClothingCategoryChange={(value) => handleCategoryChange('clothingCategory', value)}
          onShoesCategoryChange={(value) => handleCategoryChange('shoesCategory', value)}
          onAccessoriesCategoryChange={(value) => handleCategoryChange('accessoriesCategory', value)}
          onEquipmentCategoryChange={(value) => handleCategoryChange('equipmentCategory', value)}
        />

        <CampaignScheduling
          campaignId={formData.campaignId}
          executionTime={formData.executionTime}
          executionDelay={formData.executionDelay}
          onCampaignIdChange={(value) => updateField('campaignId', value)}
          onExecutionTimeChange={(value) => updateField('executionTime', value)}
          onExecutionDelayChange={(value) => updateField('executionDelay', value)}
          onScheduleCampaign={handleScheduleCampaign}
        />

        <ActiveCampaigns
          campaigns={activeCampaigns}
          onCancelCampaign={handleCancelCampaign}
        />
      </div>
    </div>
  )
}