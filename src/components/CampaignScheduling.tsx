interface CampaignSchedulingProps {
  campaignId: string
  executionTime: string
  onCampaignIdChange: (value: string) => void
  onExecutionTimeChange: (value: string) => void
  onScheduleCampaign: () => Promise<void>
}

export default function CampaignScheduling({
  campaignId,
  executionTime,
  onCampaignIdChange,
  onExecutionTimeChange,
  onScheduleCampaign
}: CampaignSchedulingProps) {
  return (
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
              onChange={(e) => onCampaignIdChange(e.target.value)}
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
              onChange={(e) => onExecutionTimeChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
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