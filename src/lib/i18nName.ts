import type { Locale, Translation } from '../types'

export function localizedName<T extends { name: string; translations?: Translation[] }>(
  entity: T,
  locale: Locale,
  field = 'name',
): string {
  const t = entity.translations
  return (
    t?.find(x => x.locale === locale && x.field === field)?.value ??
    t?.find(x => x.locale === 'en' && x.field === field)?.value ??
    entity.name
  )
}
