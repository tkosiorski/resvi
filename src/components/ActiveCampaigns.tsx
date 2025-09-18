interface Campaign {
  id: string
  executionTime: number
  delay?: number
  filters: {
    brands: string[]
    size: string
    color: string
    maxPrice: number
  }
  sortMethod: string
  itemsToAdd: number
  // Execution results (populated after campaign runs)
  success?: boolean
  addedToCart?: number
  totalFound?: number
}

import { getBrandNames } from '../utils/brandMapping'

interface ActiveCampaignsProps {
  campaigns: Campaign[]
  onCancelCampaign: (campaignId: string) => Promise<void>
  onClearHistory?: () => Promise<void>
}

export default function ActiveCampaigns({ campaigns, onCancelCampaign, onClearHistory }: ActiveCampaignsProps) {
  const now = Date.now()
  const futureCampaigns = campaigns.filter(c => c.executionTime > now)
  const historicalCampaigns = campaigns.filter(c => c.executionTime <= now)

  const formatCampaignDetails = (campaign: Campaign) => {
    const brands = getBrandNames(campaign.filters.brands)
    const delay = campaign.delay ? `${campaign.delay}ms` : '500ms'
    return `${brands} | ${campaign.filters.size || 'Dowolny'} | ${campaign.filters.color || 'Dowolny'} | ≤${campaign.filters.maxPrice}zł | ${campaign.sortMethod} | ${campaign.itemsToAdd}szt | ${delay}`
  }

  const formatHistoricalCampaignDetails = (campaign: Campaign) => {
    const brands = getBrandNames(campaign.filters.brands)
    const delay = campaign.delay ? `${campaign.delay}ms` : '500ms'
    const successInfo = campaign.addedToCart !== undefined
      ? `✅ ${campaign.addedToCart}/${campaign.itemsToAdd} dodano`
      : campaign.success === false
        ? '❌ Niepowodzenie'
        : '⏳ W trakcie'

    return `${brands} | ${campaign.filters.size || 'Dowolny'} | ≤${campaign.filters.maxPrice}zł | ${successInfo} | ${delay}`
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Kampanie
        </h2>
        <p className="text-sm text-gray-600 mt-1">Zaplanowane i wykonane zadania automatyzacji</p>
      </div>
      <div className="p-4 space-y-6">
        {/* Future Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Przyszłe ({futureCampaigns.length})
            </h3>
          </div>
          {futureCampaigns.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">Brak zaplanowanych kampanii</p>
            </div>
          ) : (
            <div className="space-y-2">
              {futureCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{campaign.id}</p>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Aktywna</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        📅 {new Date(campaign.executionTime).toLocaleString('pl-PL')}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={formatCampaignDetails(campaign)}>
                        {formatCampaignDetails(campaign)}
                      </p>
                    </div>
                    <button
                      onClick={() => onCancelCampaign(campaign.id)}
                      className="ml-2 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors flex-shrink-0"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historical Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
              Historia ({historicalCampaigns.length})
            </h3>
            {historicalCampaigns.length > 0 && onClearHistory && (
              <button
                onClick={onClearHistory}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Wyczyść
              </button>
            )}
          </div>
          {historicalCampaigns.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">Brak historii kampanii</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {historicalCampaigns.slice(0, 10).map((campaign) => (
                <div key={campaign.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-700">{campaign.id}</p>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Wykonana</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        📅 {new Date(campaign.executionTime).toLocaleString('pl-PL')}
                      </p>
                      <p className="text-xs text-gray-400 truncate" title={formatHistoricalCampaignDetails(campaign)}>
                        {formatHistoricalCampaignDetails(campaign)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {historicalCampaigns.length > 10 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  ... i {historicalCampaigns.length - 10} więcej
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}