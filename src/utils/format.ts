export const formatMoney = (amount: number, withSign = false): string => {
  const sign = withSign && amount > 0 ? '+' : amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  return `${sign}¥${abs.toFixed(2)}`
}

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const calcCashTotal = (cash: {
  denomination100: number
  denomination50: number
  denomination20: number
  denomination10: number
  denomination5: number
  denomination1: number
  pettyCash: number
}): number => {
  return (
    cash.denomination100 * 100 +
    cash.denomination50 * 50 +
    cash.denomination20 * 20 +
    cash.denomination10 * 10 +
    cash.denomination5 * 5 +
    cash.denomination1 * 1 +
    cash.pettyCash
  )
}

export const genId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const getDiffStatus = (diff: number): 'normal' | 'warning' | 'error' => {
  if (diff === 0) return 'normal'
  if (Math.abs(diff) <= 5) return 'warning'
  return 'error'
}

export const getDiffText = (diff: number, context?: string): string => {
  if (diff === 0) return `${context || ''}与系统记录一致 ✓`
  if (diff > 0) return `${context || ''}多出 ${formatMoney(diff)}`
  return `${context || ''}少 ${formatMoney(Math.abs(diff))}`
}
