export interface UnpaidPatient {
  id: string
  name: string
  treatment: string
  amount: number
  paidAmount: number
  unpaidAmount: number
  doctor: string
  time: string
  status: 'pending' | 'confirmed' | 'issue'
  issueReason?: string
  issueType?: IssueType
  note?: string
}

export interface CashCount {
  denomination100: number
  denomination50: number
  denomination20: number
  denomination10: number
  denomination5: number
  denomination1: number
  pettyCash: number
}

export interface ReceiptRecord {
  startNumber: string
  endNumber: string
  totalCount: number
}

export interface VoucherImage {
  id: string
  tempFilePath: string
  thumbPath?: string
  size: number
  type: 'pos' | 'wechat' | 'alipay' | 'refund'
  uploadedAt: string
}

export type VoucherType = 'pos' | 'wechat' | 'alipay' | 'refund'

export interface VoucherUpload {
  images: VoucherImage[]
}

export interface PaymentCompare {
  wechatSystem: number
  wechatSystemCount: number
  wechatActual: number
  wechatActualCount: number
  wechatDiff: number
  wechatCountDiff: number
  alipaySystem: number
  alipaySystemCount: number
  alipayActual: number
  alipayActualCount: number
  alipayDiff: number
  alipayCountDiff: number
  posSystem: number
  posSystemCount: number
  posActual: number
  posActualCount: number
  posDiff: number
  posCountDiff: number
}

export type IssueType =
  | 'patient_unpaid'
  | 'manual_discount'
  | 'doctor_extra'
  | 'system_error'
  | 'cash_mismatch'
  | 'receipt_missing'
  | 'other'

export interface IssueItem {
  id: string
  type: IssueType
  description: string
  relatedPatientId?: string
  patientName?: string
  patientNote?: string
  amount?: number
  createdAt: string
  handedOver: boolean
  fromPatient?: boolean
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  patient_unpaid: '患者未付尾款',
  manual_discount: '手工优惠未审批',
  doctor_extra: '医生临时加项未录入',
  system_error: '系统数据异常',
  cash_mismatch: '现金清点不符',
  receipt_missing: '收据编号缺失',
  other: '其他待办事项'
}

export type SettlementStep = 1 | 2 | 3 | 4

export interface SettlementState {
  currentStep: SettlementStep
  stepStatus: Record<SettlementStep, 'pending' | 'active' | 'done' | 'warning'>
  unpaidPatients: UnpaidPatient[]
  cashCount: CashCount
  cashTotal: number
  cashSystemTotal: number
  paymentCompare: PaymentCompare
  receiptRecord: ReceiptRecord
  voucherUpload: VoucherUpload
  issues: IssueItem[]
  signature?: string
  completedAt?: string
}

export interface SettlementRecord {
  id: string
  date: string
  shift: '夜班'
  operatorName: string
  completedAt: string
  signature: string
  summary: {
    totalPatients: number
    unpaidCount: number
    cashTotal: number
    cashDiff: number
    paymentDiff: number
    issuesCount: number
    handedOverCount: number
  }
  details: SettlementState
}

export type StepStatus = 'pending' | 'active' | 'done' | 'warning'
