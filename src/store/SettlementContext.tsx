import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import {
  SettlementState,
  SettlementStep,
  UnpaidPatient,
  CashCount,
  IssueItem,
  VoucherUpload,
  ReceiptRecord,
  PaymentCompare,
  VoucherImage,
  VoucherType,
  IssueType,
  SettlementRecord,
  IssueStatus
} from '@/types/settlement'
import { mockUnpaidPatients } from '@/data/mockPatients'
import { systemCashRecord, systemPaymentRecord, systemReceiptRecord } from '@/data/mockSystemRecords'
import { calcCashTotal, genId, formatMoney } from '@/utils/format'

const STORAGE_KEY = 's_settlement_records'

const initialState: SettlementState = {
  currentStep: 1,
  stepStatus: { 1: 'active', 2: 'pending', 3: 'pending', 4: 'pending' },
  unpaidPatients: [...mockUnpaidPatients],
  cashCount: {
    denomination100: 0,
    denomination50: 0,
    denomination20: 0,
    denomination10: 0,
    denomination5: 0,
    denomination1: 0,
    pettyCash: 500
  },
  cashTotal: 500,
  cashSystemTotal: systemCashRecord.cashSystemTotal,
  paymentCompare: {
    wechatSystem: systemPaymentRecord.wechatSystem,
    wechatSystemCount: systemPaymentRecord.wechatSystemCount,
    wechatActual: 0,
    wechatActualCount: 0,
    wechatDiff: -systemPaymentRecord.wechatSystem,
    wechatCountDiff: -systemPaymentRecord.wechatSystemCount,
    alipaySystem: systemPaymentRecord.alipaySystem,
    alipaySystemCount: systemPaymentRecord.alipaySystemCount,
    alipayActual: 0,
    alipayActualCount: 0,
    alipayDiff: -systemPaymentRecord.alipaySystem,
    alipayCountDiff: -systemPaymentRecord.alipaySystemCount,
    posSystem: systemPaymentRecord.posSystem,
    posSystemCount: systemPaymentRecord.posSystemCount,
    posActual: 0,
    posActualCount: 0,
    posDiff: -systemPaymentRecord.posSystem,
    posCountDiff: -systemPaymentRecord.posSystemCount
  },
  receiptRecord: {
    startNumber: systemReceiptRecord.startNumber,
    endNumber: systemReceiptRecord.endNumber,
    totalCount: systemReceiptRecord.totalCount
  },
  voucherUpload: {
    images: []
  },
  issues: []
}

interface SettlementContextType {
  state: SettlementState
  goToStep: (step: SettlementStep) => void
  nextStep: () => void
  prevStep: () => void
  updatePatientStatus: (id: string, status: UnpaidPatient['status'], reason?: string, issueType?: IssueType) => void
  updateCashCount: (field: keyof CashCount, value: number) => void
  updatePaymentCompare: (payment: Partial<PaymentCompare>) => void
  updateVoucherUpload: (voucher: Partial<VoucherUpload>) => void
  addVoucherImage: (type: VoucherType, tempFilePath: string, size: number, thumbPath?: string) => void
  removeVoucherImage: (imageId: string) => void
  updateReceiptRecord: (receipt: Partial<ReceiptRecord>) => void
  addIssue: (issue: Omit<IssueItem, 'id' | 'createdAt' | 'handedOver'>) => void
  removeIssue: (id: string) => void
  resetAll: () => void
  finalizeSettlement: (signature: string) => SettlementRecord | null
  getVoucherCountByType: (type: VoucherType) => number
}
const SettlementContext = createContext<SettlementContextType | undefined>(undefined)

export const SettlementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SettlementState>(initialState)

  const goToStep = useCallback((step: SettlementStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      stepStatus: {
        ...prev.stepStatus,
        [step]: 'active',
        ...(step > 1 && { [1]: prev.stepStatus[1] === 'pending' ? 'done' : prev.stepStatus[1] } as Record<number, string>)
      }
    }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => {
      const next = (Math.min(prev.currentStep + 1, 4) as SettlementStep)
      const hasIssue = checkStepIssue(prev, prev.currentStep)
      return {
        ...prev,
        currentStep: next,
        stepStatus: {
          ...prev.stepStatus,
          [prev.currentStep]: hasIssue ? 'warning' : 'done',
          [next]: 'active'
        }
      }
    })
  }, [])

  const prevStep = useCallback(() => {
    setState(prev => {
      const p = (Math.max(prev.currentStep - 1, 1) as SettlementStep)
      return {
        ...prev,
        currentStep: p,
        stepStatus: {
          ...prev.stepStatus,
          [p]: 'active'
        }
      }
    })
  }, [])

  const updatePatientStatus = useCallback((id: string, status: UnpaidPatient['status'], reason?: string, issueType?: IssueType) => {
    setState(prev => {
      const patient = prev.unpaidPatients.find(p => p.id === id)
      if (!patient) return prev

      const newPatients = prev.unpaidPatients.map(p =>
        p.id === id ? { ...p, status, issueReason: reason, issueType } : p
      )

      let newIssues = [...prev.issues]

      if (status === 'issue' && issueType && reason) {
        const existingIssue = newIssues.find(i => i.relatedPatientId === id && i.fromPatient)
        if (!existingIssue) {
          const autoIssue: IssueItem = {
            id: genId(),
            type: issueType,
            description: reason,
            relatedPatientId: id,
            patientName: patient.name,
            patientNote: patient.note || undefined,
            amount: patient.unpaidAmount > 0 ? patient.unpaidAmount : undefined,
            createdAt: new Date().toISOString(),
            handedOver: true,
            fromPatient: true
          }
          newIssues.push(autoIssue)
        } else {
          newIssues = newIssues.map(i =>
            i.id === existingIssue.id
              ? { ...i, type: issueType, description: reason, amount: patient.unpaidAmount > 0 ? patient.unpaidAmount : undefined, patientNote: patient.note || undefined }
              : i
          )
        }
      } else if (status === 'confirmed') {
        newIssues = newIssues.filter(i => !(i.relatedPatientId === id && i.fromPatient))
      }

      return {
        ...prev,
        unpaidPatients: newPatients,
        issues: newIssues
      }
    })
  }, [])

  const updateCashCount = useCallback((field: keyof CashCount, value: number) => {
    setState(prev => {
      const newCount = { ...prev.cashCount, [field]: value }
      const newTotal = calcCashTotal(newCount)
      return {
        ...prev,
        cashCount: newCount,
        cashTotal: newTotal
      }
    })
  }, [])

  const updatePaymentCompare = useCallback((payment: Partial<PaymentCompare>) => {
    setState(prev => {
      const newPay = { ...prev.paymentCompare, ...payment }
      newPay.wechatDiff = newPay.wechatActual - newPay.wechatSystem
      newPay.wechatCountDiff = newPay.wechatActualCount - newPay.wechatSystemCount
      newPay.alipayDiff = newPay.alipayActual - newPay.alipaySystem
      newPay.alipayCountDiff = newPay.alipayActualCount - newPay.alipaySystemCount
      newPay.posDiff = newPay.posActual - newPay.posSystem
      newPay.posCountDiff = newPay.posActualCount - newPay.posSystemCount
      return {
        ...prev,
        paymentCompare: newPay
      }
    })
  }, [])

  const updateVoucherUpload = useCallback((voucher: Partial<VoucherUpload>) => {
    setState(prev => ({
      ...prev,
      voucherUpload: { ...prev.voucherUpload, ...voucher }
    }))
  }, [])

  const addVoucherImage = useCallback((type: VoucherType, tempFilePath: string, size: number, thumbPath?: string) => {
    const newImage: VoucherImage = {
      id: genId(),
      tempFilePath,
      thumbPath: thumbPath || tempFilePath,
      size,
      type,
      uploadedAt: new Date().toISOString()
    }
    setState(prev => ({
      ...prev,
      voucherUpload: {
        ...prev.voucherUpload,
        images: [...prev.voucherUpload.images, newImage]
      }
    }))
  }, [])

  const removeVoucherImage = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      voucherUpload: {
        ...prev.voucherUpload,
        images: prev.voucherUpload.images.filter(img => img.id !== imageId)
      }
    }))
  }, [])

  const getVoucherCountByType = useCallback((type: VoucherType): number => {
    return state.voucherUpload.images.filter(img => img.type === type).length
  }, [state.voucherUpload.images])

  const updateReceiptRecord = useCallback((receipt: Partial<ReceiptRecord>) => {
    setState(prev => ({
      ...prev,
      receiptRecord: { ...prev.receiptRecord, ...receipt }
    }))
  }, [])

  const addIssue = useCallback((issue: Omit<IssueItem, 'id' | 'createdAt' | 'handedOver'>) => {
    const newIssue: IssueItem = {
      ...issue,
      id: genId(),
      createdAt: new Date().toISOString(),
      handedOver: true
    }
    setState(prev => ({
      ...prev,
      issues: [...prev.issues, newIssue]
    }))
  }, [])

  const removeIssue = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      issues: prev.issues.filter(i => i.id !== id)
    }))
  }, [])

  const resetAll = useCallback(() => {
    setState(initialState)
  }, [])

  const finalizeSettlement = useCallback((signature: string): SettlementRecord | null => {
    const now = new Date()
    const recordId = genId()
    const cashDiff = state.cashTotal - state.cashSystemTotal
    const payDiff = state.paymentCompare.wechatDiff + state.paymentCompare.alipayDiff + state.paymentCompare.posDiff
    const unpaidCount = state.unpaidPatients.filter(p => p.unpaidAmount > 0).length
    const issuesCount = state.issues.length
    const handedOverCount = state.issues.filter(i => i.handedOver).length

    const record: SettlementRecord = {
      id: recordId,
      date: now.toISOString().split('T')[0],
      shift: '夜班',
      operatorName: signature,
      completedAt: now.toISOString(),
      signature,
      summary: {
        totalPatients: state.unpaidPatients.length,
        unpaidCount,
        cashTotal: state.cashTotal,
        cashDiff,
        paymentDiff: payDiff,
        issuesCount,
        handedOverCount
      },
      details: {
        ...state,
        signature,
        completedAt: now.toISOString(),
        stepStatus: { 1: state.stepStatus[1] === 'active' ? 'done' : state.stepStatus[1], 2: state.stepStatus[2], 3: state.stepStatus[3], 4: 'done' }
      }
    }

    try {
      const existing = Taro.getStorageSync(STORAGE_KEY)
      const records: SettlementRecord[] = existing ? JSON.parse(existing) : []
      records.unshift(record)
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(records))
    } catch (e) {
      console.error('保存交班记录失败', e)
      return null
    }

    setState(prev => ({
      ...prev,
      signature,
      completedAt: now.toISOString(),
      stepStatus: { 1: prev.stepStatus[1] === 'active' ? 'done' : prev.stepStatus[1], 2: prev.stepStatus[2], 3: prev.stepStatus[3], 4: 'done' }
    }))

    return record
  }, [state])

  return (
    <SettlementContext.Provider value={{
      state,
      goToStep,
      nextStep,
      prevStep,
      updatePatientStatus,
      updateCashCount,
      updatePaymentCompare,
      updateVoucherUpload,
      addVoucherImage,
      removeVoucherImage,
      updateReceiptRecord,
      addIssue,
      removeIssue,
      resetAll,
      finalizeSettlement,
      getVoucherCountByType
    }}>
      {children}
    </SettlementContext.Provider>
  )
}

function checkStepIssue(state: SettlementState, step: SettlementStep): boolean {
  switch (step) {
    case 1:
      return state.unpaidPatients.some(p => p.status === 'issue' || (p.unpaidAmount > 0 && p.status !== 'confirmed'))
    case 2:
      return state.cashTotal !== state.cashSystemTotal
    case 3:
      return state.paymentCompare.wechatDiff !== 0 || state.paymentCompare.alipayDiff !== 0 || state.paymentCompare.posDiff !== 0
        || state.paymentCompare.wechatCountDiff !== 0 || state.paymentCompare.alipayCountDiff !== 0 || state.paymentCompare.posCountDiff !== 0
    case 4:
      return state.issues.length > 0
    default:
      return false
  }
}

export const useSettlement = (): SettlementContextType => {
  const ctx = useContext(SettlementContext)
  if (!ctx) {
    throw new Error('useSettlement must be used within SettlementProvider')
  }
  return ctx
}

export const getSettlementRecords = (): SettlementRecord[] => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const updateRecordIssueStatus = (
  recordId: string,
  issueId: string,
  status: IssueStatus,
  handlerName: string = '早班'
): boolean => {
  try {
    const records = getSettlementRecords()
    const recordIndex = records.findIndex(r => r.id === recordId)
    if (recordIndex === -1) return false

    const issueIndex = records[recordIndex].details.issues.findIndex(i => i.id === issueId)
    if (issueIndex === -1) return false

    records[recordIndex].details.issues[issueIndex] = {
      ...records[recordIndex].details.issues[issueIndex],
      status,
      handlerName,
      handledAt: new Date().toISOString()
    }

    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export const updateRecordIssueResult = (
  recordId: string,
  issueId: string,
  handleResult: string,
  handlerName: string = '早班'
): boolean => {
  try {
    const records = getSettlementRecords()
    const recordIndex = records.findIndex(r => r.id === recordId)
    if (recordIndex === -1) return false

    const issueIndex = records[recordIndex].details.issues.findIndex(i => i.id === issueId)
    if (issueIndex === -1) return false

    records[recordIndex].details.issues[issueIndex] = {
      ...records[recordIndex].details.issues[issueIndex],
      handleResult,
      handlerName,
      handledAt: new Date().toISOString(),
      status: 'resolved'
    }

    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

export const getUnresolvedIssueCount = (record: SettlementRecord): number => {
  return record.details.issues.filter(i => !i.status || i.status === 'pending').length
}

export const generateTextSummary = (record: SettlementRecord): string => {
  const { summary, details } = record
  const pc = details.paymentCompare
  const cashDiff = summary.cashDiff
  const payDiff = summary.paymentDiff
  const voucherCount = details.voucherUpload.images.length
  const refundCount = details.voucherUpload.images.filter(img => img.type === 'refund').length

  const lines: string[] = []
  lines.push(`【${record.date} ${record.shift}日清交班】`)
  lines.push(`交班人：${record.operatorName}`)
  lines.push(`就诊患者：${summary.totalPatients} 人`)
  lines.push('')
  lines.push('💰 现金对账')
  lines.push(`  实收：${formatMoney(summary.cashTotal)}`)
  lines.push(`  差异：${cashDiff >= 0 ? '+' : ''}${formatMoney(cashDiff)} ${cashDiff === 0 ? '✓' : '⚠️'}`)
  lines.push('')
  lines.push('💳 电子支付对账')
  lines.push(`  微信：系统${formatMoney(pc.wechatSystem)}(${pc.wechatSystemCount}笔) / 实到${formatMoney(pc.wechatActual)}(${pc.wechatActualCount}笔) → ${pc.wechatDiff === 0 && pc.wechatCountDiff === 0 ? '✓' : '差异 ' + formatMoney(pc.wechatDiff, true) + ' ' + (pc.wechatCountDiff >= 0 ? '+' : '') + pc.wechatCountDiff + '笔'}`)
  lines.push(`  支付宝：系统${formatMoney(pc.alipaySystem)}(${pc.alipaySystemCount}笔) / 实到${formatMoney(pc.alipayActual)}(${pc.alipayActualCount}笔) → ${pc.alipayDiff === 0 && pc.alipayCountDiff === 0 ? '✓' : '差异 ' + formatMoney(pc.alipayDiff, true) + ' ' + (pc.alipayCountDiff >= 0 ? '+' : '') + pc.alipayCountDiff + '笔'}`)
  lines.push(`  POS：系统${formatMoney(pc.posSystem)}(${pc.posSystemCount}笔) / 实到${formatMoney(pc.posActual)}(${pc.posActualCount}笔) → ${pc.posDiff === 0 && pc.posCountDiff === 0 ? '✓' : '差异 ' + formatMoney(pc.posDiff, true) + ' ' + (pc.posCountDiff >= 0 ? '+' : '') + pc.posCountDiff + '笔'}`)
  lines.push(`  电子支付合计差异：${payDiff >= 0 ? '+' : ''}${formatMoney(payDiff)}`)
  lines.push('')
  lines.push('🖼 凭证上传')
  lines.push(`  共 ${voucherCount} 张，其中退款凭证 ${refundCount} 张`)
  lines.push('')

  if (details.issues.length > 0) {
    lines.push('📋 移交早班事项')
    details.issues.forEach((issue, idx) => {
      const statusText = issue.status === 'resolved' ? '✓已解决' : issue.status === 'following' ? '跟进中' : issue.status === 'contacted' ? '已联系' : '待处理'
      lines.push(`  ${idx + 1}. [${statusText}] ${issue.patientName ? issue.patientName + ' - ' : ''}${issue.description}`)
      if (issue.amount !== undefined) {
        lines.push(`     涉及金额：${formatMoney(issue.amount)}`)
      }
      if (issue.handleResult) {
        lines.push(`     处理结果：${issue.handleResult}`)
      }
    })
  } else {
    lines.push('✅ 无待办事项，全部核对通过')
  }

  lines.push('')
  lines.push(`生成时间：${record.completedAt}`)

  return lines.join('\n')
}
