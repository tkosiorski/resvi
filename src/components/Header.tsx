import type { HeaderProps } from '../shared/types'

export default function Header({ version, onVersionChange, autoExtendCart, onCartExtensionToggle }: HeaderProps) {
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
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Cart Extension Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 whitespace-nowrap">Auto-przedłużanie koszyka:</span>
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => onCartExtensionToggle(!autoExtendCart)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                          autoExtendCart ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                  >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoExtendCart ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                  <span className={`text-xs font-semibold min-w-[24px] text-center ${autoExtendCart ? 'text-green-600' : 'text-gray-500'}`}>
                    {autoExtendCart ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Version Switch */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 whitespace-nowrap">Wersja:</span>
                <div className="bg-gray-100 rounded-lg p-1 flex gap-0">
                  <button
                      onClick={() => onVersionChange('v1')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                          version === 'v1'
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    v1<br/>
                  </button>
                  <button
                      onClick={() => onVersionChange('v2')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                          version === 'v2'
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    v2<br/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}