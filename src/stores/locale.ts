import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Locale } from '../types'

const STORAGE_KEY = 'family_track.locale'

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref<Locale>(
    (localStorage.getItem(STORAGE_KEY) as Locale | null) ?? 'en'
  )

  function setLocale(locale: Locale) {
    currentLocale.value = locale
    localStorage.setItem(STORAGE_KEY, locale)
  }

  return { currentLocale, setLocale }
})
