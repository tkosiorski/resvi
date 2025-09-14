import { useState } from 'react'

interface TestZoneProps {
  campaignId: string
  onTestClick: () => Promise<void>
}

export default function TestZone({ campaignId, onTestClick }: TestZoneProps) {
  const [showTestZone, setShowTestZone] = useState(true)

  if (!showTestZone) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setShowTestZone(true)}
          className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Pokaż Strefę Testową
        </button>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-blue-800">Strefa Testowa</h2>
        <button
          onClick={() => setShowTestZone(false)}
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
            onClick={onTestClick}
            disabled={!campaignId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test
          </button>
        </div>
      </div>
    </div>
  )
}