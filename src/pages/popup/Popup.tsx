import { useState, useEffect } from 'react'

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
  const [campaignId, setCampaignId] = useState('')
  const [executionTime, setExecutionTime] = useState('')
  const [brand, setBrand] = useState('Salomon')
  const [size, setSize] = useState('46')
  const [color, setColor] = useState('')
  const [maxPrice, setMaxPrice] = useState(300)
  const [sortMethod, setSortMethod] = useState('Popularne')
  const [itemsToAdd, setItemsToAdd] = useState(5)
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    loadActiveCampaigns()
  }, [])

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

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Resvi</h1>
        <p className="text-sm text-gray-600">Automatyzacja Kampanii Zalando Lounge</p>
      </div>

      {/* Campaign Configuration */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Zaplanuj Kampanię</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Kampanii
            </label>
            <input
              type="text"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="np. ZZO3RYK"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Czas Wykonania
            </label>
            <input
              type="datetime-local"
              value={executionTime}
              onChange={(e) => setExecutionTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marka
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rozmiar
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kolor
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Opcjonalne"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maks. Cena (€)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ilość Produktów
              </label>
              <input
                type="number"
                value={itemsToAdd}
                onChange={(e) => setItemsToAdd(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metoda Sortowania
            </label>
            <select
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Popularne">Popularne</option>
              <option value="Najniższa cena">Najniższa cena</option>
              <option value="Najwyższa cena">Najwyższa cena</option>
              <option value="Wyprzedaż">Wyprzedaż</option>
            </select>
          </div>

          <button
            onClick={handleScheduleCampaign}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Zaplanuj Kampanię
          </button>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Aktywne Kampanie</h2>

        {activeCampaigns.length === 0 ? (
          <p className="text-sm text-gray-500">Brak aktywnych kampanii</p>
        ) : (
          <div className="space-y-2">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Kampania {campaign.id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(campaign.executionTime).toLocaleString('pl-PL')}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelCampaign(campaign.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Anuluj
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}