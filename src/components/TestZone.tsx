import { useState, useEffect } from 'react'

interface TestZoneProps {
  campaignId: string
  onTestClick: () => Promise<void>
  onV2TestClick: () => Promise<void>
  onV2WorkflowClick: () => Promise<void>
  onV2FiltersClick?: () => Promise<void>
  onV2PaginationClick?: () => Promise<void>
}

export default function TestZone({ campaignId, onTestClick, onV2TestClick, onV2WorkflowClick, onV2FiltersClick, onV2PaginationClick }: TestZoneProps) {
  const [showTestZone, setShowTestZone] = useState(false)


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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onTestClick}
              disabled={!campaignId}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test v1
            </button>
            <button
              onClick={onV2TestClick}
              disabled={!campaignId}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              v2 API
            </button>
            <button
              onClick={onV2WorkflowClick}
              disabled={!campaignId}
              className="px-3 py-2 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              v2 Full
            </button>
          </div>
        </div>

        {/* New Enhanced v2 Tests */}
        <div className="border-t border-blue-200 pt-3 mt-3">
          <div className="text-sm font-semibold text-blue-800 mb-2">
            🚀 Enhanced v2 Tests
          </div>
          <div className="flex gap-2 flex-wrap">
            {onV2FiltersClick && (
              <button
                onClick={onV2FiltersClick}
                disabled={!campaignId}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Filters
              </button>
            )}
            {onV2PaginationClick && (
              <button
                onClick={onV2PaginationClick}
                disabled={!campaignId}
                className="px-3 py-2 bg-cyan-600 text-white rounded-md text-xs font-medium hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 Pagination
              </button>
            )}
          </div>
        </div>


        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
          <strong>v1:</strong> Symuluje kliknięcia na stronie<br/>
          <strong>v2 API:</strong> Testuje API endpoints (filtrowanie)<br/>
          <strong>v2 Full:</strong> Pełny workflow - używa pola "Ilość Produktów"<br/>
          <strong>🔍 Filters:</strong> Testuje nowy system filtrowania<br/>
          <strong>📄 Pagination:</strong> Testuje stronicowanie z cursor
        </div>

      </div>
    </div>
  )
}