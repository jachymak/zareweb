// Czech texts of the meetings and trips pages (SPEC §4.2).

export { WEEKDAY_NAMES } from '@/constants/troops'

// „1 050 Kč“
export const formatCzk = (amount) => `${amount.toLocaleString('cs-CZ')} Kč`
