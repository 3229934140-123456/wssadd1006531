import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  SettlementState,
  SettlementStep,
  UnpaidPatient,
  CashCount,
  IssueItem,
  VoucherUpload,
  ReceiptRecord,
  PaymentCompare
} from '@/types/settlement'
import { mockUnpaidPatients } from '@/data/mockPatients'
import { systemCashRecord, systemPaymentRecord, systemReceiptRecord } from '@/data/mockSystemRecords'
import { calcCashTotal, genId } from '@/utils/format'

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
    wechatActual: 0,
    wechatDiff: 0,
    alipaySystem: systemPaymentRecord.alipaySystem,
    alipayActual: 0,
    alipayDiff: 0,
    posSystem: systemPaymentRecord.posSystem,
    posActual: 0,
    posDiff: 0
  },
  receiptRecord: {
    startNumber: systemReceiptRecord.startNumber,
    endNumber: systemReceiptRecord.endNumber,
    totalCount: systemReceiptRecord.totalCount
  },
  voucherUpload: {
    posReceipts: 0,
    wechatScreenshots: 0,
    alipayScreenshots: 0,
    refundProofs: 0
  },
  issues: []
}

interface SettlementContextType {
  state: SettlementState
  goToStep: (step: SettlementStep) => void
  nextStep: () => void
  prevStep: () => void
  updatePatientStatus: (id: string, status: UnpaidPatient['status'], reason?: string) => void
  updateCashCount: (field: keyof CashCount, value: number) => void
  updatePaymentCompare: (payment: Partial<PaymentCompare>) => void
  updateVoucherUpload: (voucher: Partial<VoucherUpload>) => void
  updateReceiptRecord: (receipt: Partial<ReceiptRecord>) => void
  addIssue: (issue: Omit<IssueItem, 'id' | 'createdAt' | 'handedOver'>) => void
  removeIssue: (id: string) => void
  resetAll: () => void
  finalizeSettlement: (signature: string) => void
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

  const updatePatientStatus = useCallback((id: string, status: UnpaidPatient['status'], reason?: string) => {
    setState(prev => ({
      ...prev,
      unpaidPatients: prev.unpaidPatients.map(p =>
        p.id === id ? { ...p, status, issueReason: reason } : p
      )
    }))
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
      newPay.alipayDiff = newPay.alipayActual - newPay.alipaySystem
      newPay.posDiff = newPay.posActual - newPay.posSystem
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

  const finalizeSettlement = useCallback((signature: string) => {
    setState(prev => ({
      ...prev,
      signature,
      completedAt: new Date().toISOString(),
      stepStatus: { 1: 'done', 2: prev.stepStatus[2], 3: prev.stepStatus[3], 4: 'done' }
    }))
  }, [])

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
      updateReceiptRecord,
      addIssue,
      removeIssue,
      resetAll,
      finalizeSettlement
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
