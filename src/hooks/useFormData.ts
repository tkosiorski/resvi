import { useState, useEffect, useRef, useCallback } from 'react'
import type { FormData } from '@/shared/types'

const defaultFormData: FormData = {
  campaignId: '',
  brands: [],
  size: '46',
  color: '',
  maxPrice: 300,
  sortMethod: 'Popularne',
  itemsToAdd: 5,
  executionTime: '',
  delay: 500, // Default 500ms delay
  gender: '',
  clothingCategory: '',
  shoesCategory: '',
  accessoriesCategory: '',
  equipmentCategory: ''
}

export function useFormData() {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentValuesRef = useRef<FormData>(defaultFormData)

  useEffect(() => {
    loadFormData()
  }, [])

  useEffect(() => {
    currentValuesRef.current = formData
  }, [formData])

  const loadFormData = async () => {
    try {
      console.log('📥 Loading main form data...')
      const result = await chrome.storage.local.get(['mainFormData'])
      const savedData = result.mainFormData

      console.log('📊 Loaded main form data from storage:', savedData)

      if (savedData) {
        console.log('📝 Setting form values:', {
          campaignId: savedData.campaignId,
          brands: savedData.brands || savedData.brand ? [savedData.brand] : [],
          size: savedData.size,
          color: savedData.color,
          maxPrice: savedData.maxPrice,
          sortMethod: savedData.sortMethod,
          itemsToAdd: savedData.itemsToAdd
        })

        // Migration: convert old brand string to brands array
        let brands = savedData.brands || []
        if (!brands.length && savedData.brand) {
          brands = [savedData.brand]
        }

        setFormData({
          campaignId: savedData.campaignId ?? '',
          brands: brands,
          size: savedData.size ?? '46',
          color: savedData.color ?? '',
          maxPrice: savedData.maxPrice ?? 300,
          sortMethod: savedData.sortMethod ?? 'Popularne',
          itemsToAdd: savedData.itemsToAdd ?? 5,
          executionTime: savedData.executionTime ?? '',
          delay: savedData.delay ?? 500,
          gender: savedData.gender ?? '',
          clothingCategory: savedData.clothingCategory ?? '',
          shoesCategory: savedData.shoesCategory ?? '',
          accessoriesCategory: savedData.accessoriesCategory ?? '',
          equipmentCategory: savedData.equipmentCategory ?? ''
        })
      } else {
        console.log('⚠️ No saved form data found, using defaults')
      }
    } catch (error) {
      console.error('❌ Failed to load main form data:', error)
    }
  }

  const saveFormData = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      console.log('🔄 Cleared previous save timer')
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const dataToSave = { ...currentValuesRef.current }

        console.log('🔄 Saving main form data:', dataToSave)

        await chrome.storage.local.set({
          mainFormData: dataToSave
        })

        console.log('✅ Main form data saved successfully')

        const verification = await chrome.storage.local.get(['mainFormData'])
        const saved = verification.mainFormData
        console.log('🔍 VERIFICATION - What was actually saved:', saved)
      } catch (error) {
        console.error('❌ Failed to save main form data:', error)
      }
    }, 500)
  }, [])

  const updateField = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    saveFormData()
  }, [saveFormData])

  const resetCategoryFields = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      clothingCategory: '',
      shoesCategory: '',
      accessoriesCategory: '',
      equipmentCategory: ''
    }))
    saveFormData()
  }, [saveFormData])

  return {
    formData,
    updateField,
    resetCategoryFields
  }
}