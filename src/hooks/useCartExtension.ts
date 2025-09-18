import { useState, useEffect } from 'react'

export function useCartExtension() {
  const [autoExtendCart, setAutoExtendCart] = useState<boolean>(false)

  useEffect(() => {
    loadCartExtensionSetting()
  }, [])

  const loadCartExtensionSetting = async () => {
    try {
      const result = await chrome.storage.local.get(['settings'])
      const settings = result.settings || {}
      setAutoExtendCart(settings.autoExtendCart || false)
    } catch (error) {
      console.error('❌ Failed to load cart extension setting:', error)
    }
  }

  const toggleCartExtension = async (enabled: boolean) => {
    try {
      setAutoExtendCart(enabled)

      // Send message to background script
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_CART_EXTENSION',
        enabled: enabled
      })

      console.log('🛒 Cart extension toggled:', enabled)
    } catch (error) {
      console.error('❌ Failed to toggle cart extension:', error)
      // Revert state on error
      setAutoExtendCart(!enabled)
    }
  }

  return {
    autoExtendCart,
    toggleCartExtension
  }
}