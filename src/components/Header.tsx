interface HeaderProps {
  version: 'v1' | 'v2'
  onVersionChange: (_version: 'v1' | 'v2') => void
}

export default function Header({ version, onVersionChange }: HeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Resvi</h1>
              <p className="text-sm text-gray-600">Automatyzacja Zalando Lounge</p>
            </div>
          </div>

          {/* Version Switch */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Wersja:</span>
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => onVersionChange('v1')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  version === 'v1'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                v1 (Kliknięcia)
              </button>
              <button
                onClick={() => onVersionChange('v2')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  version === 'v2'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                v2 (API)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}