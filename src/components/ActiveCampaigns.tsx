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

interface ActiveCampaignsProps {
  campaigns: Campaign[]
  onCancelCampaign: (campaignId: string) => Promise<void>
}

export default function ActiveCampaigns({ campaigns, onCancelCampaign }: ActiveCampaignsProps) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            Aktywne (0)
          </h3>
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500 text-center">Brak kampanii</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Aktywne ({campaigns.length})
        </h3>
      </div>
      <div className="p-2">
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-gray-50 rounded-md p-2 text-xs border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 text-xs">#{campaign.id}</span>
                <button
                  onClick={() => onCancelCampaign(campaign.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span>⏰ {new Date(campaign.executionTime).toLocaleString('pl', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {campaign.executionDelay > 0 && <span className="text-orange-600">+{campaign.executionDelay}ms</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>📦 {campaign.itemsToAdd}</span>
                  <span>💰 {campaign.maxPrice}zł</span>
                  <span>🔤 {campaign.sortMethod}</span>
                </div>
                {(campaign.filters.brand || campaign.filters.size || campaign.filters.color) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {campaign.filters.brand && <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs">{campaign.filters.brand}</span>}
                    {campaign.filters.size && <span className="bg-green-100 text-green-800 px-1 rounded text-xs">{campaign.filters.size}</span>}
                    {campaign.filters.color && <span className="bg-purple-100 text-purple-800 px-1 rounded text-xs">{campaign.filters.color}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}