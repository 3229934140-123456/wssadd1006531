import { SettlementRecord, SettlementState } from '@/types/settlement'
import { mockUnpaidPatients } from './mockPatients'

const createMockState = (variant: 'normal' | 'warning' | 'error'): SettlementState => {
  const diffMap = {
    normal: { cash: 0, wechat: 0, alipay: 0, pos: 0 },
    warning: { cash: 5, wechat: 0, alipay: 0, pos: -20 },
    error: { cash: -20, wechat: -500, alipay: 0, pos: 0 }
  }
  const diff = diffMap[variant]
  return {
    currentStep: 4,
    stepStatus: { 1: 'done', 2: variant === 'normal' ? 'done' : 'warning', 3: variant === 'error' ? 'warning' : 'done', 4: 'done' },
    unpaidPatients: mockUnpaidPatients.map(p => ({ ...p, status: 'confirmed' as const })),
    cashCount: {
      denomination100: 18,
      denomination50: 6,
      denomination20: 8,
      denomination10: 5,
      denomination5: 4,
      denomination1: 10,
      pettyCash: 500
    },
    cashTotal: 2180 + diff.cash,
    cashSystemTotal: 2180,
    paymentCompare: {
      wechatSystem: 15680,
      wechatActual: 15680 + diff.wechat,
      wechatDiff: diff.wechat,
      alipaySystem: 8200,
      alipayActual: 8200 + diff.alipay,
      alipayDiff: diff.alipay,
      posSystem: 12380,
      posActual: 12380 + diff.pos,
      posDiff: diff.pos
    },
    receiptRecord: { startNumber: '202606190001', endNumber: '202606190012', totalCount: 12 },
    voucherUpload: { posReceipts: 3, wechatScreenshots: 8, alipayScreenshots: 4, refundProofs: 1 },
    issues: variant === 'normal' ? [] : [
      {
        id: 'iss001',
        type: variant === 'error' ? 'patient_unpaid' : 'cash_mismatch',
        description: variant === 'error' ? '患者陈*芳正畸复诊费用3200元未付，已联系明天补交' : '现金清点多出5元，已放入找零盒',
        amount: variant === 'error' ? 3200 : 5,
        createdAt: '2026-06-19 21:45:00',
        handedOver: true
      }
    ],
    signature: '张小明',
    completedAt: '2026-06-19 22:05:30'
  }
}

export const mockSettlementRecords: SettlementRecord[] = [
  {
    id: 'st003',
    date: '2026-06-19',
    shift: '夜班',
    operatorName: '张小明',
    completedAt: '2026-06-19 22:05:30',
    signature: '张小明',
    summary: {
      totalPatients: 6,
      unpaidCount: 0,
      cashTotal: 2180,
      cashDiff: 0,
      paymentDiff: -20,
      issuesCount: 1,
      handedOverCount: 1
    },
    details: createMockState('warning')
  },
  {
    id: 'st002',
    date: '2026-06-18',
    shift: '夜班',
    operatorName: '李小红',
    completedAt: '2026-06-18 21:58:10',
    signature: '李小红',
    summary: {
      totalPatients: 8,
      unpaidCount: 0,
      cashTotal: 3420,
      cashDiff: 0,
      paymentDiff: 0,
      issuesCount: 0,
      handedOverCount: 0
    },
    details: createMockState('normal')
  },
  {
    id: 'st001',
    date: '2026-06-17',
    shift: '夜班',
    operatorName: '王小强',
    completedAt: '2026-06-17 22:12:45',
    signature: '王小强',
    summary: {
      totalPatients: 7,
      unpaidCount: 1,
      cashTotal: 1860,
      cashDiff: -20,
      paymentDiff: -500,
      issuesCount: 1,
      handedOverCount: 1
    },
    details: createMockState('error')
  }
]
