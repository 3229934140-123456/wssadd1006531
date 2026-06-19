import { UnpaidPatient } from '@/types/settlement'

export const mockUnpaidPatients: UnpaidPatient[] = [
  {
    id: 'p001',
    name: '王*华',
    treatment: '种植牙二期手术',
    amount: 18500,
    paidAmount: 10000,
    unpaidAmount: 8500,
    doctor: '李医生',
    time: '14:30',
    status: 'pending',
    note: '约定术后一周内结清'
  },
  {
    id: 'p002',
    name: '陈*芳',
    treatment: '正畸复诊（第8次）',
    amount: 3200,
    paidAmount: 0,
    unpaidAmount: 3200,
    doctor: '张医生',
    time: '16:00',
    status: 'pending',
    note: '微信预约，需联系确认支付'
  },
  {
    id: 'p003',
    name: '刘*明',
    treatment: '烤瓷冠修复3颗',
    amount: 9600,
    paidAmount: 9600,
    unpaidAmount: 0,
    doctor: '王医生',
    time: '10:00',
    status: 'confirmed',
    note: '已全额支付，POS刷卡'
  },
  {
    id: 'p004',
    name: '赵*军',
    treatment: '根管治疗+补牙',
    amount: 2400,
    paidAmount: 2000,
    unpaidAmount: 400,
    doctor: '李医生',
    time: '15:20',
    status: 'pending',
    note: '临时加项未确认费用'
  },
  {
    id: 'p005',
    name: '孙*丽',
    treatment: '儿童窝沟封闭4颗',
    amount: 800,
    paidAmount: 800,
    unpaidAmount: 0,
    doctor: '周医生',
    time: '09:30',
    status: 'confirmed',
    note: '微信支付，已到账'
  },
  {
    id: 'p006',
    name: '周*伟',
    treatment: '洗牙+抛光',
    amount: 380,
    paidAmount: 380,
    unpaidAmount: 0,
    doctor: '陈医生',
    time: '11:00',
    status: 'confirmed',
    note: '现金支付'
  }
]
