export default function Header() {
  return (
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
  )
}