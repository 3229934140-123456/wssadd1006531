import { SettlementRecord, SettlementState } from '@/types/settlement'
import { mockUnpaidPatients } from './mockPatients'

const createMockState = (variant: 'normal' | 'warning' | 'error'): SettlementState => {
  const diffMap = {
    normal: { cash: 0, wechat: 0, alipay: 0, pos: 0, wechatCount: 0, alipayCount: 0, posCount: 0 },
    warning: { cash: 5, wechat: 0, alipay: 0, pos: -20, wechatCount: 0, alipayCount: 0, posCount: -1 },
    error: { cash: -20, wechat: -500, alipay: 0, pos: 0, wechatCount: -2, alipayCount: 0, posCount: 0 }
  }
  const diff = diffMap[variant]
  return {
    currentStep: 4,
    stepStatus: { 1: 'done', 2: variant === 'normal' ? 'done' : 'warning', 3: variant === 'error' ? 'warning' : 'done', 4: 'done' },
    unpaidPatients: mockUnpaidPatients.map(p => ({
      ...p,
      status: variant === 'error' && p.id === 'p002' ? 'issue' as const : 'confirmed' as const,
      ...(variant === 'error' && p.id === 'p002' ? { issueReason: '患者未付尾款，已联系待早班确认', issueType: 'patient_unpaid' as const } : {})
    })),
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
      wechatSystemCount: 8,
      wechatActual: 15680 + diff.wechat,
      wechatActualCount: 8 + diff.wechatCount,
      wechatDiff: diff.wechat,
      wechatCountDiff: diff.wechatCount,
      alipaySystem: 8200,
      alipaySystemCount: 4,
      alipayActual: 8200 + diff.alipay,
      alipayActualCount: 4 + diff.alipayCount,
      alipayDiff: diff.alipay,
      alipayCountDiff: diff.alipayCount,
      posSystem: 12380,
      posSystemCount: 3,
      posActual: 12380 + diff.pos,
      posActualCount: 3 + diff.posCount,
      posDiff: diff.pos,
      posCountDiff: diff.posCount
    },
    receiptRecord: { startNumber: '202606190001', endNumber: '202606190012', totalCount: 12 },
    voucherUpload: {
      images: variant === 'normal'
        ? [
            { id: 'v1', tempFilePath: '/mock/pos1.jpg', size: 102400, type: 'pos' as const, uploadedAt: '2026-06-19T21:30:00' },
            { id: 'v2', tempFilePath: '/mock/pos2.jpg', size: 98000, type: 'pos' as const, uploadedAt: '2026-06-19T21:31:00' },
            { id: 'v3', tempFilePath: '/mock/pos3.jpg', size: 110000, type: 'pos' as const, uploadedAt: '2026-06-19T21:32:00' },
            ...Array.from({ length: 8 }, (_, i) => ({ id: `vw${i}`, tempFilePath: `/mock/wechat${i}.jpg`, size: 80000, type: 'wechat' as const, uploadedAt: `2026-06-19T21:${i + 10}:00` })),
            ...Array.from({ length: 4 }, (_, i) => ({ id: `va${i}`, tempFilePath: `/mock/alipay${i}.jpg`, size: 75000, type: 'alipay' as const, uploadedAt: `2026-06-19T21:${i + 20}:00` }))
          ]
        : [
            { id: 'v1', tempFilePath: '/mock/pos1.jpg', size: 102400, type: 'pos' as const, uploadedAt: '2026-06-19T21:30:00' },
            ...Array.from({ length: variant === 'warning' ? 7 : 8 }, (_, i) => ({ id: `vw${i}`, tempFilePath: `/mock/wechat${i}.jpg`, size: 80000, type: 'wechat' as const, uploadedAt: `2026-06-19T21:${i + 10}:00` })),
            ...Array.from({ length: variant === 'warning' ? 4 : 3 }, (_, i) => ({ id: `va${i}`, tempFilePath: `/mock/alipay${i}.jpg`, size: 75000, type: 'alipay' as const, uploadedAt: `2026-06-19T21:${i + 20}:00` }))
          ]
    },
    issues: variant === 'normal' ? [] : [
      {
        id: 'iss001',
        type: variant === 'error' ? 'patient_unpaid' : 'cash_mismatch',
        description: variant === 'error' ? '患者陈*芳正畸复诊费用3200元未付，已联系明天补交' : '现金清点多出5元，已放入找零盒',
        relatedPatientId: variant === 'error' ? 'p002' : undefined,
        patientName: variant === 'error' ? '陈*芳' : undefined,
        patientNote: variant === 'error' ? '微信预约，需联系确认支付' : undefined,
        amount: variant === 'error' ? 3200 : 5,
        createdAt: '2026-06-19T21:45:00',
        handedOver: true,
        fromPatient: variant === 'error'
      }
    ],
    signature: variant === 'error' ? '王小强' : variant === 'warning' ? '张小明' : '李小红',
    completedAt: '2026-06-19T22:05:30'
  }
}

export const mockSettlementRecords: SettlementRecord[] = [
  {
    id: 'st003',
    date: '2026-06-19',
    shift: '夜班',
    operatorName: '张小明',
    completedAt: '2026-06-19T22:05:30',
    signature: '张小明',
    summary: {
      totalPatients: 6,
      unpaidCount: 0,
      cashTotal: 2185,
      cashDiff: 5,
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
    completedAt: '2026-06-18T21:58:10',
    signature: '李小红',
    summary: {
      totalPatients: 8,
      unpaidCount: 0,
      cashTotal: 2180,
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
    completedAt: '2026-06-17T22:12:45',
    signature: '王小强',
    summary: {
      totalPatients: 7,
      unpaidCount: 1,
      cashTotal: 2160,
      cashDiff: -20,
      paymentDiff: -500,
      issuesCount: 1,
      handedOverCount: 1
    },
    details: createMockState('error')
  }
]
