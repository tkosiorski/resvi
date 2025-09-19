import { useState, useRef, useEffect } from 'react'
import brandCodesData from '../../capture1/brand-codes-2025-09-18T10-23-29-099Z.json'
import type { Brand, MultiSelectBrandsProps } from '../shared/types'

export default function MultiSelectBrands({ selectedBrands, onBrandsChange }: MultiSelectBrandsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Convert brand codes data to array of Brand objects
  const allBrands: Brand[] = Object.entries(brandCodesData.brandCodes).map(([name, code]) => ({
    code: code as string,
    name
  })).sort((a, b) => a.name.localeCompare(b.name))

  // Filter brands based on search term
  const filteredBrands = allBrands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected brand objects
  const selectedBrandObjects = allBrands.filter(brand => selectedBrands.includes(brand.code))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleBrand = (brandCode: string) => {
    if (selectedBrands.includes(brandCode)) {
      onBrandsChange(selectedBrands.filter(code => code !== brandCode))
    } else {
      onBrandsChange([...selectedBrands, brandCode])
    }
  }

  const removeBrand = (brandCode: string) => {
    onBrandsChange(selectedBrands.filter(code => code !== brandCode))
  }

  const openDropdown = () => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Marki
      </label>

      {/* Selected brands as tags */}
      <div className="min-h-[3rem] p-3 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
        <div className="flex flex-wrap gap-2">
          {selectedBrandObjects.map(brand => (
            <span
              key={brand.code}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
            >
              <span className="font-mono text-xs">[{brand.code}]</span>
              <span>{brand.name}</span>
              <button
                type="button"
                onClick={() => removeBrand(brand.code)}
                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}

          {/* Add button */}
          <button
            type="button"
            onClick={openDropdown}
            className="inline-flex items-center px-2 py-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Dodaj markę
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj marki... (np. adidas, AD1)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Brand list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredBrands.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Brak wyników</div>
            ) : (
              filteredBrands.map(brand => (
                <button
                  key={brand.code}
                  type="button"
                  onClick={() => toggleBrand(brand.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    selectedBrands.includes(brand.code) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.code)}
                    onChange={() => {}} // Handled by button onClick
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-mono text-xs text-gray-500">[{brand.code}]</span>
                  <span className="flex-1">{brand.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}