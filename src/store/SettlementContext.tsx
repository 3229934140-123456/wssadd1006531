import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
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
  SettlementRecord
} from '@/types/settlement'
import { mockUnpaidPatients } from '@/data/mockPatients'
import { systemCashRecord, systemPaymentRecord, systemReceiptRecord } from '@/data/mockSystemRecords'
import { calcCashTotal, genId } from '@/utils/format'

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
            amount: patient.unpaidAmount > 0 ? patient.unpaidAmount : undefined,
            createdAt: new Date().toISOString(),
            handedOver: true,
            fromPatient: true
          }
          newIssues.push(autoIssue)
        } else {
          newIssues = newIssues.map(i =>
            i.id === existingIssue.id
              ? { ...i, type: issueType, description: reason, amount: patient.unpaidAmount > 0 ? patient.unpaidAmount : undefined }
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
