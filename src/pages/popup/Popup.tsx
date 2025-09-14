import { useState, useEffect, useCallback, useRef } from 'react'
import { DebugLogger } from '../../utils/debug-logger'

interface Campaign {
  id: string
  executionTime: number
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
  const debugLogger = DebugLogger.getInstance()

  const [campaignId, setCampaignId] = useState('')
  const [executionTime, setExecutionTime] = useState('')
  const [brand, setBrand] = useState('Salomon')
  const [size, setSize] = useState('46')
  const [color, setColor] = useState('')
  const [maxPrice, setMaxPrice] = useState(300)
  const [sortMethod, setSortMethod] = useState('Popularne')
  const [itemsToAdd, setItemsToAdd] = useState(5)
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])

  // Category filter state
  const [gender, setGender] = useState('')
  const [clothingCategory, setClothingCategory] = useState('')
  const [shoesCategory, setShoesCategory] = useState('')
  const [accessoriesCategory, setAccessoriesCategory] = useState('')
  const [equipmentCategory, setEquipmentCategory] = useState('')

  // Test zone state
  const [testLogs, setTestLogs] = useState<string[]>([])
  const [showTestZone, setShowTestZone] = useState(true)

  // Debounce timer ref for saving
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Refs to hold current values to avoid closure issues
  const currentValuesRef = useRef({
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
  })

  useEffect(() => {
    loadActiveCampaigns()
    loadTestZoneData()
    loadMainFormData()
  }, [])

  const loadTestZoneData = async () => {
    try {
      const result = await chrome.storage.local.get(['testZoneData'])
      const testData = result.testZoneData
      if (testData) {
        setTestLogs(testData.logs || [])
        setShowTestZone(testData.showTestZone !== undefined ? testData.showTestZone : true)
      }
    } catch (error) {
      console.error('Failed to load test zone data:', error)
    }
  }

  const loadMainFormData = async () => {
    try {
      console.log('📥 Loading main form data...')
      const result = await chrome.storage.local.get(['mainFormData'])
      const formData = result.mainFormData

      console.log('📊 Loaded main form data from storage:', formData)

      if (formData) {
        console.log('📝 Setting form values:', {
          campaignId: formData.campaignId,
          brand: formData.brand,
          size: formData.size,
          color: formData.color,
          maxPrice: formData.maxPrice,
          sortMethod: formData.sortMethod,
          itemsToAdd: formData.itemsToAdd
        })

        // Add detailed logging for brand field specifically
        console.log(`🔍 BRAND FIELD DEBUG:`)
        console.log(`  Raw storage value: "${formData.brand}"`)
        console.log(`  String length: ${(formData.brand || '').length}`)
        console.log(`  Character codes:`, [...(formData.brand || '')].map(c => `${c}(${c.charCodeAt(0)})`))

        setCampaignId(formData.campaignId || '')
        setBrand(formData.brand || 'Salomon')
        setSize(formData.size || '46')
        setColor(formData.color || '')
        setMaxPrice(formData.maxPrice || 300)
        setSortMethod(formData.sortMethod || 'Popularne')
        setItemsToAdd(formData.itemsToAdd || 5)
        setExecutionTime(formData.executionTime || '')
        setGender(formData.gender || '')
        setClothingCategory(formData.clothingCategory || '')
        setShoesCategory(formData.shoesCategory || '')
        setAccessoriesCategory(formData.accessoriesCategory || '')
        setEquipmentCategory(formData.equipmentCategory || '')
      } else {
        console.log('⚠️ No saved form data found, using defaults')
      }
    } catch (error) {
      console.error('❌ Failed to load main form data:', error)
    }
  }

  // Update refs whenever state changes
  useEffect(() => {
    currentValuesRef.current = {
      campaignId,
      brand,
      size,
      color,
      maxPrice,
      sortMethod,
      itemsToAdd,
      executionTime,
      gender,
      clothingCategory,
      shoesCategory,
      accessoriesCategory,
      equipmentCategory
    }
  }, [campaignId, brand, size, color, maxPrice, sortMethod, itemsToAdd, executionTime, gender, clothingCategory, shoesCategory, accessoriesCategory, equipmentCategory])

  const saveMainFormData = useCallback(() => {
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      console.log('🔄 Cleared previous save timer')
    }

    // Set new timer - use ref values to avoid closure trap
    saveTimerRef.current = setTimeout(async () => {
      try {
        // Get values from ref (always current)
        const dataToSave = { ...currentValuesRef.current }

        console.log('🔄 Saving main form data:', dataToSave)

        await chrome.storage.local.set({
          mainFormData: dataToSave
        })

        console.log('✅ Main form data saved successfully')

        // Immediately verify what was saved
        const verification = await chrome.storage.local.get(['mainFormData'])
        const saved = verification.mainFormData
        console.log('🔍 VERIFICATION - What was actually saved:', saved)
      } catch (error) {
        console.error('❌ Failed to save main form data:', error)
      }
    }, 500)
  }, [])

  const saveTestZoneData = async (logs: string[], showZone: boolean) => {
    try {
      await chrome.storage.local.set({
        testZoneData: {
          logs,
          showTestZone: showZone
        }
      })
    } catch (error) {
      console.error('Failed to save test zone data:', error)
    }
  }

  const loadActiveCampaigns = async () => {
    try {
      const result = await chrome.storage.local.get(['campaigns'])
      setActiveCampaigns(result.campaigns || [])
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    }
  }

  const handleScheduleCampaign = async () => {
    if (!campaignId || !executionTime) {
      alert('Proszę wypełnić wszystkie wymagane pola')
      return
    }

    const campaign: Campaign = {
      id: campaignId,
      executionTime: new Date(executionTime).getTime(),
      filters: { brand, size, color, maxPrice },
      sortMethod,
      itemsToAdd
    }

    try {
      // Save to storage
      const result = await chrome.storage.local.get(['campaigns'])
      const campaigns = result.campaigns || []
      campaigns.push(campaign)
      await chrome.storage.local.set({ campaigns })

      // Schedule with background script
      await chrome.runtime.sendMessage({
        type: 'SCHEDULE_CAMPAIGN',
        campaign
      })

      // Reset form and reload
      setCampaignId('')
      setExecutionTime('')
      loadActiveCampaigns()

      alert('Kampania została zaplanowana!')
    } catch (error) {
      console.error('Failed to schedule campaign:', error)
      alert('Błąd podczas planowania kampanii')
    }
  }

  const handleCancelCampaign = async (campaignId: string) => {
    try {
      // Remove from storage
      const result = await chrome.storage.local.get(['campaigns'])
      const campaigns = result.campaigns.filter((c: Campaign) => c.id !== campaignId)
      await chrome.storage.local.set({ campaigns })

      // Cancel alarm
      await chrome.runtime.sendMessage({
        type: 'CANCEL_CAMPAIGN',
        campaignId
      })

      loadActiveCampaigns()
      alert('Kampania anulowana')
    } catch (error) {
      console.error('Failed to cancel campaign:', error)
    }
  }

  const addTestLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pl-PL')
    const logEntry = `[${timestamp}] ${message}`
    const newLogs = [...testLogs, logEntry]
    setTestLogs(newLogs)
    saveTestZoneData(newLogs, showTestZone)
  }

  const clearTestLogs = () => {
    setTestLogs([])
    saveTestZoneData([], showTestZone)
  }

  const waitForPageLoad = async (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
      const checkTabStatus = async () => {
        try {
          const tab = await chrome.tabs.get(tabId)
          if (tab.status === 'complete') {
            // Reduced wait time - content script will handle DOM readiness
            setTimeout(resolve, 300)
          } else {
            setTimeout(checkTabStatus, 100) // Faster polling
          }
        } catch (error) {
          resolve()
        }
      }
      checkTabStatus()
    })
  }

  const handleTestButtonClick = async () => {
    if (!campaignId) {
      alert('Proszę wpisać ID kampanii do testowania')
      return
    }

    addTestLog(`=== TEST ROZPOCZĘTY ===`)
    addTestLog(`Kampania: ${campaignId}`)

    try {
      // Navigate to campaign page
      const campaignUrl = `https://www.zalando-lounge.pl/campaigns/${campaignId}`
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (activeTab?.id) {
        addTestLog(`🔄 Nawigacja do: ${campaignUrl}`)
        await chrome.tabs.update(activeTab.id, { url: campaignUrl })

        // Wait for page to load using tab update listener instead of fixed timeout
        await waitForPageLoad(activeTab.id)
        addTestLog(`✅ Strona załadowana`)

        // Apply filters immediately after page loads
        await applyFiltersToCurrentTab(activeTab.id!)
      }
    } catch (error) {
      console.error('Failed to navigate to campaign:', error)
      addTestLog(`❌ Błąd: ${error.message}`)
    }
  }

  const applyFiltersToCurrentTab = async (tabId: number) => {
    try {
      addTestLog('🔄 Sprawdzam gotowość content script...')

      // Aggressive content script readiness check
      let contentScriptReady = false
      const maxAttempts = 20 // More attempts with ultra-fast intervals

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' })
          if (response?.pong) {
            addTestLog(`✅ Content script gotowy po ${attempt} próbach`)
            contentScriptReady = true
            break
          }
        } catch (error) {
          if (attempt < maxAttempts) {
            // Ultra-fast polling - 150ms intervals
            await new Promise(resolve => setTimeout(resolve, 150))
          }
        }
      }

      if (!contentScriptReady) {
        addTestLog('❌ Content script nie odpowiada po 15 próbach')
        return
      }

      addTestLog('🔧 Przygotowuję konfigurację filtrów...')
      // Prepare filter config
      const filterConfig = {
        brand: brand ? brand.split(',').map(b => b.trim()).filter(b => b.length > 0) : [],
        size: size ? size.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
        color: color || undefined,
        maxPrice: maxPrice || undefined,
        sortMethod: sortMethod || undefined,
        itemsToAdd: itemsToAdd || undefined,
        category: (gender || clothingCategory || shoesCategory || accessoriesCategory || equipmentCategory) ? {
          gender: gender || undefined,
          clothingCategory: clothingCategory || undefined,
          shoesCategory: shoesCategory || undefined,
          accessoriesCategory: accessoriesCategory || undefined,
          equipmentCategory: equipmentCategory || undefined
        } : undefined
      }

      addTestLog(`📤 Wysyłam filtry: ${JSON.stringify(filterConfig)}`)

      // Send filters to content script
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'APPLY_FILTERS',
        config: filterConfig
      })

      if (response?.success) {
        addTestLog('✅ Filtry zastosowane pomyślnie!')
      } else {
        addTestLog(`❌ Błąd filtrów: ${response?.error || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Failed to apply filters:', error)
      addTestLog(`❌ Błąd komunikacji: ${error.message}`)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Resvi</h1>
              <p className="text-sm text-gray-600">Automatyzacja Zalando Lounge</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">

      {/* Test Zone */}
      {showTestZone && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-blue-800">Strefa Testowa</h2>
            <button
              onClick={() => {
                setShowTestZone(false)
                saveTestZoneData(testLogs, false)
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Ukryj
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-blue-700">
                <strong>Aktywna Kampania:</strong> {campaignId || 'Nie podano'}
              </div>
              <button
                onClick={handleTestButtonClick}
                disabled={!campaignId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-blue-700">
                  Logi
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => debugLogger.downloadLogs()}
                    className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded"
                  >
                    📥 Pobierz
                  </button>
                  <button
                    onClick={() => debugLogger.showRecentLogs(20)}
                    className="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded"
                  >
                    👁️ Pokaż
                  </button>
                  <button
                    onClick={clearTestLogs}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Wyczyść
                  </button>
                </div>
              </div>
              <div className="bg-white border border-blue-200 rounded-md p-3 h-24 overflow-y-auto text-xs font-mono">
                {testLogs.length === 0 ? (
                  <p className="text-gray-500">Brak logów...</p>
                ) : (
                  testLogs.map((log, index) => (
                    <div key={index} className="text-gray-800 mb-1">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Test Zone button when hidden */}
      {!showTestZone && (
        <div className="mb-4">
          <button
            onClick={() => {
              setShowTestZone(true)
              saveTestZoneData(testLogs, true)
            }}
            className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Pokaż Strefę Testową
          </button>
        </div>
      )}


      {/* Filter Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Konfiguracja Filtrów
          </h2>
          <p className="text-sm text-gray-600 mt-1">Ustaw parametry wyszukiwania produktów</p>
        </div>
        <div className="p-4 space-y-6">
          {/* Basic Filters */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Podstawowe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value)
                    saveMainFormData()
                  }}
                  placeholder="np. adidas, nike"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rozmiar
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value)
                    saveMainFormData()
                  }}
                  placeholder="46 lub 46,47,48"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Kategorie
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Płeć
                </label>
                <select
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value)
                    // Reset all category selections when gender changes
                    setClothingCategory('')
                    setShoesCategory('')
                    setAccessoriesCategory('')
                    setEquipmentCategory('')
                    saveMainFormData()
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    onChange={(e) => {
                      const newValue = e.target.value
                      setClothingCategory(newValue)
                      // Reset other subcategories when clothing is selected
                      if (newValue) {
                        setShoesCategory('')
                        setAccessoriesCategory('')
                        setEquipmentCategory('')
                      }
                      saveMainFormData()
                    }}
                    disabled={!gender || shoesCategory || accessoriesCategory || equipmentCategory}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${(!gender || shoesCategory || accessoriesCategory || equipmentCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{!gender ? 'Wybierz płeć' : (shoesCategory || accessoriesCategory || equipmentCategory ? 'Zablokowane' : 'Wszystkie')}</option>
                    {gender && (
                      <>
                        <option value="Wszystkie w kategorii Odzież">Wszystkie w kategorii Odzież</option>
                        <option value="T-shirty i koszulki polo">T-shirty i koszulki polo</option>
                        <option value="Swetry i bluzy">Swetry i bluzy</option>
                        <option value="Kurtki i płaszcze">Kurtki i płaszcze</option>
                        <option value="Spodnie">Spodnie</option>
                        <option value="Dresy">Dresy</option>
                        <option value="Koszulki klubowe i akcesoria dla kibiców">Koszulki klubowe</option>
                        <option value="Bielizna">Bielizna</option>
                        <option value="Skarpetki">Skarpetki</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buty
                  </label>
                  <select
                    value={shoesCategory}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setShoesCategory(newValue)
                      // Reset other subcategories when shoes is selected
                      if (newValue) {
                        setClothingCategory('')
                        setAccessoriesCategory('')
                        setEquipmentCategory('')
                      }
                      saveMainFormData()
                    }}
                    disabled={!gender || clothingCategory || accessoriesCategory || equipmentCategory}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${(!gender || clothingCategory || accessoriesCategory || equipmentCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{!gender ? 'Wybierz płeć' : (clothingCategory || accessoriesCategory || equipmentCategory ? 'Zablokowane' : 'Wszystkie')}</option>
                    {gender && (
                      <>
                        <option value="Wszystkie w kategorii Buty">Wszystkie w kategorii Buty</option>
                        <option value="Buty sportowe">Buty sportowe</option>
                      </>
                    )}
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
                    onChange={(e) => {
                      const newValue = e.target.value
                      setAccessoriesCategory(newValue)
                      // Reset other subcategories when accessories is selected
                      if (newValue) {
                        setClothingCategory('')
                        setShoesCategory('')
                        setEquipmentCategory('')
                      }
                      saveMainFormData()
                    }}
                    disabled={!gender || clothingCategory || shoesCategory || equipmentCategory}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${(!gender || clothingCategory || shoesCategory || equipmentCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{!gender ? 'Wybierz płeć' : (clothingCategory || shoesCategory || equipmentCategory ? 'Zablokowane' : 'Wszystkie')}</option>
                    {gender && (
                      <>
                        <option value="Wszystkie w kategorii Akcesoria">Wszystkie w kategorii Akcesoria</option>
                        <option value="Torby i walizki">Torby i walizki</option>
                        <option value="Zegarki">Zegarki</option>
                        <option value="Czapki i kapelusze">Czapki i kapelusze</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sprzęt
                  </label>
                  <select
                    value={equipmentCategory}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setEquipmentCategory(newValue)
                      // Reset other subcategories when equipment is selected
                      if (newValue) {
                        setClothingCategory('')
                        setShoesCategory('')
                        setAccessoriesCategory('')
                      }
                      saveMainFormData()
                    }}
                    disabled={!gender || clothingCategory || shoesCategory || accessoriesCategory}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${(!gender || clothingCategory || shoesCategory || accessoriesCategory) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{!gender ? 'Wybierz płeć' : (clothingCategory || shoesCategory || accessoriesCategory ? 'Zablokowane' : 'Wszystkie')}</option>
                    {gender && (
                      <>
                        <option value="Wszystkie w kategorii Sprzęt">Wszystkie w kategorii Sprzęt</option>
                        <option value="Piłki i rakiety">Piłki i rakiety</option>
                        <option value="Zegarki sportowe i elektronika">Zegarki sportowe</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Dodatkowe
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metoda Sortowania
                </label>
                <select
                  value={sortMethod}
                  onChange={(e) => {
                    setSortMethod(e.target.value)
                    saveMainFormData()
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  onChange={(e) => {
                    setItemsToAdd(parseInt(e.target.value))
                    saveMainFormData()
                  }}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Scheduling */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Planowanie Kampanii
          </h2>
          <p className="text-sm text-gray-600 mt-1">Ustaw kampanię i czas automatycznego wykonania</p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Kampanii
              </label>
              <input
                type="text"
                value={campaignId}
                onChange={(e) => {
                  setCampaignId(e.target.value)
                  saveMainFormData()
                }}
                placeholder="np. ZZO3RYK"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Czas Wykonania
              </label>
              <input
                type="datetime-local"
                value={executionTime}
                onChange={(e) => {
                  setExecutionTime(e.target.value)
                  saveMainFormData()
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={handleScheduleCampaign}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all transform hover:scale-105"
            >
              📅 Zaplanuj Kampanię
            </button>
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Aktywne Kampanie
          </h2>
          <p className="text-sm text-gray-600 mt-1">Zaplanowane zadania automatyzacji</p>
        </div>
        <div className="p-4">

          {activeCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-400 text-xl">📅</span>
              </div>
              <p className="text-sm text-gray-500">Brak aktywnych kampanii</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Kampania {campaign.id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(campaign.executionTime).toLocaleString('pl-PL')}
                  </p>
                </div>
                  <button
                    onClick={() => handleCancelCampaign(campaign.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  )
}