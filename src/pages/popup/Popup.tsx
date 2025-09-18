import Header from '../../components/Header'
import TestZone from '../../components/TestZone'
import CampaignPlanning from '../../components/CampaignPlanning'
import ActiveCampaigns from '../../components/ActiveCampaigns'
import { useFormData } from '../../hooks/useFormData'
import { useCampaigns } from '../../hooks/useCampaigns'
import { useCartExtension } from '../../hooks/useCartExtension'
import { TestService } from '../../services/TestService'
import { isValidCampaignId, isValidExecutionTime } from '../../utils/formatters'
import { useState } from 'react'

interface Campaign {
  id: string
  executionTime: number
  delay?: number // Delay in milliseconds before execution (default: 500ms)
  filters: {
    brands: string[]
    size: string
    color: string
    maxPrice: number
  }
  sortMethod: string
  itemsToAdd: number
}

export default function Popup() {
  const { formData, updateField, resetCategoryFields } = useFormData()
  const { activeCampaigns, scheduleCampaign, cancelCampaign, clearHistory } = useCampaigns()
  const { autoExtendCart, toggleCartExtension } = useCartExtension()
  const [version, setVersion] = useState<'v1' | 'v2'>('v2')

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

  const handleTestButtonClick = async () => {
    const result = await TestService.runTest(formData.campaignId, formData)

    if (!result.success) {
      alert(result.message)
    }
  }

  const handleV2TestButtonClick = async () => {
    if (!formData.campaignId) {
      alert('Proszę podać ID kampanii')
      return
    }

    alert('⚠️ V2 API Test - ZalandoApiService not implemented yet')

    // TODO: Implement when ZalandoApiService is available
    /*
    try {
      console.log('🚀 Starting V2 API Test...')

      const apiService = ZalandoApiService.getInstance()
      const filters = ZalandoApiService.convertFormToFilters(formData)

      console.log('🔧 Raw form data:', formData)
      console.log('🔧 Converted filters:', filters)

      // Test both API calls
      const [productsResult, filtersResult] = await Promise.all([
        apiService.fetchProducts(formData.campaignId, filters),
        apiService.fetchFilterCounts(formData.campaignId, filters)
      ])

      if (productsResult.success && filtersResult.success) {
        console.log('✅ V2 API Test Success!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📦 PRODUCTS RESPONSE:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(JSON.stringify(productsResult.data, null, 2))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📊 FILTERS RESPONSE:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(JSON.stringify(filtersResult.data, null, 2))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Count products for summary
        const productCount = productsResult.data?.configs?.length || 0
        console.log(`🎯 SUMMARY: ${productCount} products found`)

        alert(`✅ V2 API Test Success!\n\n📦 ${productCount} products fetched\n📊 Filter data retrieved\n\n👀 Check console for detailed JSON output`)
      } else {
        console.error('❌ V2 API Test Failed')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('Products error:', productsResult.error)
        console.error('Filters error:', filtersResult.error)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        alert(`❌ V2 API Test Failed!\n\nProducts: ${productsResult.error || 'Success'}\nFilters: ${filtersResult.error || 'Success'}\n\n👀 Check console for details`)
      }
    } catch (error) {
      console.error('❌ V2 Test Error:', error)
      alert(`V2 Test Error: ${error}`)
    }
    */
  }

  const handleV2WorkflowClick = async () => {
    if (!formData.campaignId) {
      alert('Proszę podać ID kampanii')
      return
    }

    alert('⚠️ V2 Full Workflow - ZalandoApiService not implemented yet')

    // TODO: Implement when ZalandoApiService is available
    /*
    try {
      console.log(`🚀 Starting V2 Full Workflow: Adding ${formData.itemsToAdd} products to cart...`)

      const apiService = ZalandoApiService.getInstance()
      const filters = ZalandoApiService.convertFormToFilters(formData)

      console.log('🔧 Raw form data:', formData)
      console.log('🔧 Converted filters:', filters)
      console.log(`🛒 Target product count: ${formData.itemsToAdd}`)

      // Execute complete workflow with specified product count from form
      const result = await apiService.filterAndAddToCart(
        formData.campaignId,
        filters,
        formData.size, // Use selected size from form
        formData.itemsToAdd // Use quantity from "Ilość Produktów" field
      )

      if (result.success) {
        console.log('✅ V2 Full Workflow Success!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🎯 WORKFLOW RESULT:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(JSON.stringify(result.data, null, 2))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const totalProducts = result.data?.totalProducts || 0
        const successCount = result.data?.successCount || 0
        const failedCount = result.data?.failedCount || 0

        let message = `✅ V2 Full Workflow Success!\n\n`
        if (totalProducts === 1) {
          // Single product workflow
          const product = result.data?.products?.[0] || result.data?.product
          const addedSize = result.data?.addedSize
          message += `🛒 Added to cart:\n${product?.brand || 'Unknown'} - ${product?.name || product?.sku}\nSize: ${addedSize}`
        } else {
          // Bulk workflow
          message += `🛒 Bulk add results (${formData.itemsToAdd} requested):\n✅ Successfully added: ${successCount}/${totalProducts}\n`
          if (failedCount > 0) {
            message += `❌ Failed to add: ${failedCount}\n`
          }
        }
        message += `\n\n👀 Check console for full details`

        alert(message)
      } else {
        console.error('❌ V2 Full Workflow Failed')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('Error:', result.error)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        alert(`❌ V2 Full Workflow Failed!\n\nError: ${result.error}\n\n👀 Check console for details`)
      }
    } catch (error) {
      console.error('❌ V2 Workflow Error:', error)
      alert(`V2 Workflow Error: ${error}`)
    }
    */
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
        <Header
            version={version}
            onVersionChange={setVersion}
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
              maxPrice={formData.maxPrice}
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
              onMaxPriceChange={(value) => updateField('maxPrice', value)}
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

          <TestZone
              campaignId={formData.campaignId}
              onTestClick={handleTestButtonClick}
              onV2TestClick={handleV2TestButtonClick}
              onV2WorkflowClick={handleV2WorkflowClick}
          />
        </div>
      </div>
  )
}