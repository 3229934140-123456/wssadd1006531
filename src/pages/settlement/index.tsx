import React, { useState, useMemo } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import {
  SettlementProvider,
  useSettlement
} from '@/store/SettlementContext'
import { UnpaidPatient } from '@/types/settlement'
import { formatMoney, getDiffStatus } from '@/utils/format'
import StepIndicator from '@/components/StepIndicator'
import NumberInput from '@/components/NumberInput'
import ResultFeedback from '@/components/ResultFeedback'
import IssueSelector from '@/components/IssueSelector'
import ReportCard from '@/components/ReportCard'
import styles from './index.module.scss'

const getDiffClass = (diff: number) => {
  const status = getDiffStatus(diff)
  if (status === 'normal') return styles.diffNormal
  if (status === 'warning') return styles.diffWarning
  return styles.diffError
}

const getDiffText = (diff: number, context?: string): string => {
  if (diff === 0) return `${context || ''}核对一致 ✓`
  if (Math.abs(diff) <= 5) return `${context || ''}差 ${formatMoney(diff, true)}（在允许范围内）`
  if (diff > 0) return `${context || ''}多出 ${formatMoney(diff)}`
  return `${context || ''}少 ${formatMoney(Math.abs(diff))}`
}

const Step1Patients: React.FC = () => {
  const { state, updatePatientStatus } = useSettlement()

  const totals = useMemo(() => {
    const total = state.unpaidPatients.reduce((s, p) => s + p.amount, 0)
    const paid = state.unpaidPatients.reduce((s, p) => s + p.paidAmount, 0)
    const unpaid = state.unpaidPatients.reduce((s, p) => s + p.unpaidAmount, 0)
    const confirmed = state.unpaidPatients.filter(p => p.status === 'confirmed').length
    return { total, paid, unpaid, confirmed, all: state.unpaidPatients.length }
  }, [state.unpaidPatients])

  const handleConfirm = (p: UnpaidPatient) => {
    updatePatientStatus(p.id, 'confirmed')
  }

  const handleMarkIssue = (p: UnpaidPatient) => {
    Taro.showActionSheet({
      itemList: ['患者未付尾款', '手工优惠未审批', '医生临时加项未录入', '其他情况'],
      success: res => {
        const reasons = ['患者未付尾款，已联系', '有手工优惠需早班确认', '医生加项费用待确认', '其他待说明']
        updatePatientStatus(p.id, 'issue', reasons[res.tapIndex])
      }
    })
  }

  return (
    <View>
      <View className={styles.tipBox}>
        <Text className={styles.tipIcon}>💡</Text>
        <Text className={styles.tipText}>
          请逐一核对今日就诊患者的费用和支付状态。已全额支付请点「确认无误」，有问题请点「标记问题」并移交早班。
        </Text>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleIcon}>👥</View>
          <Text>今日就诊患者（{totals.confirmed}/{totals.all}）</Text>
        </View>

        {state.unpaidPatients.map(p => (
          <View
            key={p.id}
            className={classnames(
              styles.patientItem,
              p.status === 'confirmed' && styles.patientItemConfirmed,
              p.status === 'issue' && styles.patientItemIssue
            )}
          >
            <View className={styles.patientHeader}>
              <View className={styles.patientInfo}>
                <Text className={styles.patientName}>{p.name}</Text>
                <Text className={styles.patientTreatment}>{p.treatment}</Text>
                {p.issueReason && (
                  <Text className={styles.patientTreatment} style={{ color: '#DC2626', marginTop: '8rpx' }}>
                    ⚠ {p.issueReason}
                  </Text>
                )}
              </View>
              <View className={styles.patientAmountWrap}>
                {p.unpaidAmount > 0 ? (
                  <>
                    <Text className={styles.patientFullAmount}>¥{p.amount.toFixed(2)}</Text>
                    <Text className={styles.patientUnpaid}>-¥{p.unpaidAmount.toFixed(2)}</Text>
                  </>
                ) : (
                  <Text className={styles.patientPaid}>¥{p.amount.toFixed(2)}</Text>
                )}
              </View>
            </View>
            <View className={styles.patientMeta}>
              <Text>{p.doctor} · {p.time}</Text>
              <Text>已付：¥{p.paidAmount.toFixed(2)}</Text>
            </View>
            <View className={styles.patientActions}>
              <Button
                className={classnames(
                  styles.actionBtn,
                  styles.btnDanger,
                  p.status === 'issue' && styles.btnDangerActive
                )}
                onClick={() => handleMarkIssue(p)}
              >
                {p.status === 'issue' ? '已标记问题' : '有问题'}
              </Button>
              <Button
                className={classnames(
                  styles.actionBtn,
                  styles.btnPrimary,
                  p.status === 'confirmed' && styles.btnPrimaryActive
                )}
                onClick={() => handleConfirm(p)}
              >
                {p.status === 'confirmed' ? '✓ 确认无误' : '确认无误'}
              </Button>
            </View>
          </View>
        ))}

        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>就诊总金额</Text>
          <Text className={classnames(styles.summaryValue, styles.summaryNegative)}>
            {formatMoney(totals.total)}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>已收金额</Text>
          <Text className={classnames(styles.summaryValue, styles.summaryPositive)}>
            {formatMoney(totals.paid)}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>待收金额</Text>
          <Text className={classnames(
            styles.summaryValue,
            totals.unpaid > 0 && styles.summaryNegative
          )}>
            {formatMoney(totals.unpaid)}
          </Text>
        </View>
      </View>

      {totals.confirmed === totals.all && totals.unpaid === 0 ? (
        <ResultFeedback
          status='normal'
          title='全部核对通过'
          message='今日所有患者费用状态已确认，没有未结清款项。'
        />
      ) : totals.unpaid > 0 ? (
        <ResultFeedback
          status='warning'
          title='有待确认的未付款项'
          message={`有 ${totals.all - totals.confirmed} 位患者状态待确认，未付金额 ${formatMoney(totals.unpaid)}。请确保已与患者沟通并标记问题，移交早班跟进。`}
          details={[
            { label: '未确认患者', value: `${totals.all - totals.confirmed} 人` },
            { label: '未付总金额', value: formatMoney(totals.unpaid) }
          ]}
        />
      ) : (
        <ResultFeedback
          status='warning'
          title='还有患者未核对'
          message={`还剩 ${totals.all - totals.confirmed} 位患者需要确认，请逐个点击"确认无误"或"标记问题"。`}
        />
      )}
    </View>
  )
}

const Step2Cash: React.FC = () => {
  const { state, updateCashCount } = useSettlement()
  const cashDiff = state.cashTotal - state.cashSystemTotal

  const denominationItems = [
    { key: 'denomination100' as const, label: '100元纸币', sub: '一百元面值' },
    { key: 'denomination50' as const, label: '50元纸币', sub: '五十元面值' },
    { key: 'denomination20' as const, label: '20元纸币', sub: '二十元面值' },
    { key: 'denomination10' as const, label: '10元纸币', sub: '十元面值' },
    { key: 'denomination5' as const, label: '5元纸币/硬币', sub: '五元面值' },
    { key: 'denomination1' as const, label: '1元纸币/硬币', sub: '一元面值' }
  ]

  return (
    <View>
      <View className={styles.tipBox}>
        <Text className={styles.tipIcon}>💰</Text>
        <Text className={styles.tipText}>
          按面值清点现金抽屉中的纸币和硬币数量，系统会自动计算总额并与记录对比。别忘了加上备用金！
        </Text>
      </View>

      <View className={styles.cashTotalCard}>
        <View className={styles.cashTotalRow}>
          <Text className={styles.cashTotalLabel}>系统记录应收现金</Text>
          <Text className={styles.cashTotalLabel}>{formatMoney(state.cashSystemTotal)}</Text>
        </View>
        <View className={styles.cashTotalRow}>
          <Text className={styles.cashTotalLabel}>实际清点合计</Text>
          <Text className={styles.cashTotalValue}>{formatMoney(state.cashTotal)}</Text>
        </View>
        <View className={styles.cashTotalRow}>
          <Text className={styles.cashTotalLabel}>差异</Text>
          <View className={styles.cashDiffValue}>
            <Text>{cashDiff >= 0 ? '+' : ''}{formatMoney(cashDiff)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.denominationTitle}>纸币 & 硬币清点</View>
        {denominationItems.map(item => (
          <NumberInput
            key={item.key}
            label={item.label}
            subLabel={item.sub}
            value={state.cashCount[item.key]}
            denomination={parseInt(item.key.replace('denomination', ''))}
            onChange={v => updateCashCount(item.key, v)}
          />
        ))}
      </View>

      <View className={styles.card}>
        <View className={styles.denominationTitle}>备用金</View>
        <NumberInput
          label='备用金金额'
          subLabel='抽屉内预留的找零备用金'
          value={state.cashCount.pettyCash}
          onChange={v => updateCashCount('pettyCash', v)}
        />
        <Text style={{ fontSize: '22rpx', color: '#9CA3AF', padding: '8rpx 8rpx 0' }}>
          💡 备用金单独记录，不计入当日营收。建议固定为 ¥500。
        </Text>
      </View>

      {cashDiff === 0 ? (
        <ResultFeedback
          status='normal'
          title='现金清点一致'
          message='实际清点金额与系统记录完全吻合，干得漂亮！'
        />
      ) : Math.abs(cashDiff) <= 5 ? (
        <ResultFeedback
          status='warning'
          title='有小额差异'
          message={getDiffText(cashDiff, '现金')}
          details={[
            { label: '差异金额', value: formatMoney(cashDiff, true) },
            { label: '建议', value: '±5元内属正常范围，可直接下一步' }
          ]}
        />
      ) : (
        <ResultFeedback
          status='error'
          title='差异较大，请复核'
          message={getDiffText(cashDiff, '现金')}
          details={[
            { label: '应收', value: formatMoney(state.cashSystemTotal) },
            { label: '实收', value: formatMoney(state.cashTotal) },
            { label: '差额', value: formatMoney(cashDiff, true) }
          ]}
        />
      )}
    </View>
  )
}

const Step3Voucher: React.FC = () => {
  const { state, updatePaymentCompare, updateVoucherUpload, updateReceiptRecord } = useSettlement()
  const { wechatDiff, alipayDiff, posDiff } = state.paymentCompare
  const totalPaymentDiff = wechatDiff + alipayDiff + posDiff

  const handleUpload = (key: keyof typeof state.voucherUpload, max: number) => {
    const current = state.voucherUpload[key]
    if (current < max) {
      updateVoucherUpload({ [key]: current + 1 })
      Taro.showToast({ title: '模拟上传成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '数量已达上限', icon: 'none' })
    }
  }

  const voucherItems = [
    {
      key: 'posReceipts' as const,
      icon: '🧾',
      name: 'POS机小票',
      hint: `应上传 3 张`,
      count: state.voucherUpload.posReceipts,
      systemCount: 3,
      onClick: () => handleUpload('posReceipts', 3)
    },
    {
      key: 'wechatScreenshots' as const,
      icon: '💚',
      name: '微信到账截图',
      hint: `应上传 8 张`,
      count: state.voucherUpload.wechatScreenshots,
      systemCount: 8,
      onClick: () => handleUpload('wechatScreenshots', 8)
    },
    {
      key: 'alipayScreenshots' as const,
      icon: '💙',
      name: '支付宝到账截图',
      hint: `应上传 4 张`,
      count: state.voucherUpload.alipayScreenshots,
      systemCount: 4,
      onClick: () => handleUpload('alipayScreenshots', 4)
    },
    {
      key: 'refundProofs' as const,
      icon: '↩️',
      name: '退款凭证',
      hint: '如无退款可跳过',
      count: state.voucherUpload.refundProofs,
      systemCount: 1,
      onClick: () => handleUpload('refundProofs', 5)
    }
  ]

  const paymentItems = [
    {
      key: 'wechatActual',
      icon: '💚',
      name: '微信支付',
      iconClass: styles.iconWechat,
      system: state.paymentCompare.wechatSystem,
      actual: state.paymentCompare.wechatActual,
      diff: wechatDiff,
      systemCount: 8
    },
    {
      key: 'alipayActual',
      icon: '💙',
      name: '支付宝',
      iconClass: styles.iconAlipay,
      system: state.paymentCompare.alipaySystem,
      actual: state.paymentCompare.alipayActual,
      diff: alipayDiff,
      systemCount: 4
    },
    {
      key: 'posActual',
      icon: '💳',
      name: 'POS刷卡',
      iconClass: styles.iconPos,
      system: state.paymentCompare.posSystem,
      actual: state.paymentCompare.posActual,
      diff: posDiff,
      systemCount: 3
    }
  ]

  return (
    <View>
      <View className={styles.tipBox}>
        <Text className={styles.tipIcon}>📸</Text>
        <Text className={styles.tipText}>
          先上传支付凭证（小票/截图），再填写各渠道实际到账金额。系统会自动计算与账面差异。
        </Text>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleIcon}>🖼</View>
          <Text>凭证上传（{state.voucherUpload.posReceipts + state.voucherUpload.wechatScreenshots + state.voucherUpload.alipayScreenshots + state.voucherUpload.refundProofs}）</Text>
        </View>
        <View className={styles.voucherGrid}>
          {voucherItems.map(v => {
            const uploaded = v.count > 0
            const complete = v.count >= v.systemCount
            return (
              <View
                key={v.key}
                className={classnames(styles.voucherItem, uploaded && styles.voucherUploaded)}
                onClick={v.onClick}
              >
                <Text className={styles.voucherIcon}>{v.icon}</Text>
                <Text className={styles.voucherName}>{v.name}</Text>
                <Text className={styles.voucherCount}>
                  {v.count}/{v.systemCount} {complete ? '✓' : '点击上传'}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleIcon}>💻</View>
          <Text>电子支付对账</Text>
        </View>
        <View className={styles.paymentSection}>
          {paymentItems.map(p => (
            <View key={p.key} className={styles.paymentRow}>
              <View className={classnames(styles.paymentIcon, p.iconClass)}>
                <Text>{p.icon}</Text>
              </View>
              <View className={styles.paymentInfo}>
                <Text className={styles.paymentName}>{p.name}</Text>
                <Text className={styles.paymentSystem}>
                  系统记录：{formatMoney(p.system)}（{p.systemCount}笔）
                </Text>
                <View className={styles.paymentInputWrap} style={{ marginTop: '12rpx' }}>
                  <Text style={{ fontSize: '24rpx', color: '#6B7280' }}>实到金额</Text>
                  <Input
                    className={styles.paymentInput}
                    type='digit'
                    placeholder='¥ 0.00'
                    value={p.actual === 0 ? '' : String(p.actual)}
                    onInput={e => {
                      const val = parseFloat(e.detail.value) || 0
                      updatePaymentCompare({ [p.key]: val } as any)
                    }}
                  />
                </View>
                <View className={styles.paymentDiff}>
                  <Text style={{ color: '#9CA3AF' }}>核对结果</Text>
                  <Text className={getDiffClass(p.diff)}>
                    {getDiffText(p.diff)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardTitleIcon}>📄</View>
          <Text>收据编号</Text>
        </View>
        <View className={styles.receiptRow}>
          <Text className={styles.receiptLabel}>起始编号</Text>
          <Input
            className={styles.receiptInput}
            placeholder='202606200001'
            value={state.receiptRecord.startNumber}
            onInput={e => updateReceiptRecord({ startNumber: e.detail.value })}
          />
        </View>
        <View className={styles.receiptRow}>
          <Text className={styles.receiptLabel}>结束编号</Text>
          <Input
            className={styles.receiptInput}
            placeholder='202606200012'
            value={state.receiptRecord.endNumber}
            onInput={e => updateReceiptRecord({ endNumber: e.detail.value })}
          />
        </View>
        <View className={styles.receiptRow}>
          <Text className={styles.receiptLabel}>收据张数</Text>
          <Input
            className={styles.receiptInput}
            type='number'
            placeholder='12'
            value={state.receiptRecord.totalCount === 0 ? '' : String(state.receiptRecord.totalCount)}
            onInput={e => updateReceiptRecord({ totalCount: parseInt(e.detail.value) || 0 })}
          />
        </View>
      </View>

      {totalPaymentDiff === 0 ? (
        <ResultFeedback
          status='normal'
          title='支付渠道全部吻合'
          message='微信、支付宝、POS 三个渠道到账金额均与系统记录一致。'
        />
      ) : (
        <ResultFeedback
          status={Math.abs(totalPaymentDiff) <= 10 ? 'warning' : 'error'}
          title='支付渠道存在差异'
          message={`电子支付合计 ${getDiffText(totalPaymentDiff, '')}`}
          details={[
            { label: '微信', value: getDiffText(wechatDiff, '') },
            { label: '支付宝', value: getDiffText(alipayDiff, '') },
            { label: 'POS刷卡', value: getDiffText(posDiff, '') }
          ]}
        />
      )}
    </View>
  )
}

interface Step4FinalizeProps {
  signature: string
  onSignatureChange: (v: string) => void
}

const Step4Finalize: React.FC<Step4FinalizeProps> = ({ signature, onSignatureChange }) => {
  const { state, addIssue, removeIssue } = useSettlement()

  const cashDiff = state.cashTotal - state.cashSystemTotal
  const payDiff = state.paymentCompare.wechatDiff + state.paymentCompare.alipayDiff + state.paymentCompare.posDiff

  return (
    <View>
      {!state.completedAt ? (
        <>
          <View className={styles.tipBox}>
            <Text className={styles.tipIcon}>📝</Text>
            <Text className={styles.tipText}>
              如果有任何无法在今晚解决的问题，请通过下方选择原因并添加说明，系统会自动记入交班卡移交早班。
            </Text>
          </View>

          <IssueSelector
            issues={state.issues}
            onAdd={addIssue}
            onRemove={removeIssue}
          />

          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <View className={styles.cardTitleIcon}>✅</View>
              <Text>核对汇总</Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>未结账患者</Text>
              <Text className={classnames(
                styles.summaryValue,
                state.unpaidPatients.some(p => p.unpaidAmount > 0) && styles.summaryNegative
              )}>
                {state.unpaidPatients.filter(p => p.unpaidAmount > 0).length} 位
              </Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>现金差异</Text>
              <Text className={classnames(
                styles.summaryValue,
                cashDiff > 0 && styles.summaryPositive,
                cashDiff < 0 && styles.summaryNegative
              )}>
                {formatMoney(cashDiff, true)}
              </Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>电子支付差异</Text>
              <Text className={classnames(
                styles.summaryValue,
                payDiff > 0 && styles.summaryPositive,
                payDiff < 0 && styles.summaryNegative
              )}>
                {formatMoney(payDiff, true)}
              </Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>待办事项</Text>
              <Text className={classnames(
                styles.summaryValue,
                state.issues.length > 0 && styles.summaryNegative
              )}>
                {state.issues.length} 条
              </Text>
            </View>
          </View>

          <View className={styles.card}>
            <View className={styles.signatureCard}>
              <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937', marginBottom: '24rpx' }}>
                交班人签名
              </Text>
              <Input
                className={styles.signatureInput}
                placeholder='请输入您的姓名'
                value={signature}
                onInput={e => onSignatureChange(e.detail.value)}
                maxlength={20}
              />
              <Text className={styles.signatureHint}>
                签名后即表示您已完成上述所有核对步骤，对差异和待办事项负责。
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View>
          <ResultFeedback
            status='normal'
            title='✓ 交班卡已生成'
            message='请截图保存下方交班卡，并于明日早班人员到岗后做好工作交接。'
          />
          <ReportCard state={state} operatorName={state.signature} />
        </View>
      )}
    </View>
  )
}

const SettlementInner: React.FC = () => {
  const { state, nextStep, prevStep, resetAll, finalizeSettlement } = useSettlement()
  const [signature, setSignature] = useState('')

  const canNext = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return state.unpaidPatients.every(p => p.status !== 'pending')
      case 2:
        return true
      case 3:
        return true
      case 4:
        return !state.completedAt && signature.trim().length > 0
      default:
        return true
    }
  }, [state, signature])

  const isLastStep = state.currentStep === 4
  const isCompleted = !!state.completedAt

  const handleFinalize = () => {
    if (!signature.trim()) {
      Taro.showToast({ title: '请输入交班人姓名', icon: 'none' })
      return
    }
    finalizeSettlement(signature.trim())
    Taro.showModal({
      title: '🎉 日清完成',
      content: '交班卡已生成，请截图保存并通知早班同事接班。',
      showCancel: false,
      confirmText: '好的',
      confirmColor: '#10B981'
    })
  }

  return (
    <View className={styles.pageContainer}>
      <StepIndicator currentStep={state.currentStep} stepStatus={state.stepStatus} />

      {(state.currentStep > 1 || state.unpaidPatients[0]?.status !== 'pending') && (
        <View className={styles.resetBanner}>
          <Text className={styles.resetBannerText}>如需重新开始日清</Text>
          <Button className={styles.resetBtn} onClick={resetAll}>↻ 重置</Button>
        </View>
      )}

      <View className={styles.stepContent}>
        {state.currentStep === 1 && <Step1Patients />}
        {state.currentStep === 2 && <Step2Cash />}
        {state.currentStep === 3 && <Step3Voucher />}
        {state.currentStep === 4 && (
          <Step4Finalize signature={signature} onSignatureChange={setSignature} />
        )}
      </View>

      <View className={styles.bottomBar}>
        {state.currentStep > 1 && !isCompleted && (
          <Button className={classnames(styles.bottomBtn, styles.btnPrev)} onClick={prevStep}>
            ← 上一步
          </Button>
        )}
        {!isCompleted && (
          <Button
            className={classnames(
              styles.bottomBtn,
              styles.btnNext,
              !canNext && styles.btnNextDisabled
            )}
            disabled={!canNext}
            onClick={isLastStep ? handleFinalize : nextStep}
          >
            {isLastStep ? '✓ 确认生成交班卡' : '下一步 →'}
          </Button>
        )}
      </View>
    </View>
  )
}

const SettlementPage: React.FC = () => {
  return (
    <SettlementProvider>
      <SettlementInner />
    </SettlementProvider>
  )
}

export default SettlementPage
