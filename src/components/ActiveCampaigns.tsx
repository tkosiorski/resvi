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

interface ActiveCampaignsProps {
  campaigns: Campaign[]
  onCancelCampaign: (campaignId: string) => Promise<void>
}

export default function ActiveCampaigns({ campaigns, onCancelCampaign }: ActiveCampaignsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Aktywne Kampanie
        </h2>
        <p className="text-sm text-gray-600 mt-1">Zaplanowane zadania automatyzacji</p>
      </div>
      <div className="p-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">📅</span>
            </div>
            <p className="text-sm text-gray-500">Brak aktywnych kampanii</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Kampania {campaign.id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(campaign.executionTime).toLocaleString('pl-PL')}
                  </p>
                </div>
                <button
                  onClick={() => onCancelCampaign(campaign.id)}
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
  )
}