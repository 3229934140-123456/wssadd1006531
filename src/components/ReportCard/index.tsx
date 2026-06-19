import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { SettlementState, UnpaidPatient, ISSUE_TYPE_LABELS, SettlementStep, StepStatus } from '@/types/settlement'
import { formatMoney, formatDate, formatDateTime, getDiffStatus } from '@/utils/format'
import styles from './index.module.scss'

interface ReportCardProps {
  state: SettlementState
  clinicName?: string
  operatorName?: string
}

const STEP_NAMES: Record<SettlementStep, string> = {
  1: '未结账患者',
  2: '现金清点',
  3: '凭证与对账',
  4: '交班确认'
}

const getStepClass = (status: StepStatus) => {
  if (status === 'warning') return styles.iconWarning
  return styles.iconDone
}

const getStepIcon = (status: StepStatus) => {
  if (status === 'warning') return '!'
  return '✓'
}

const getPatientStatusClass = (s: UnpaidPatient['status']) => {
  if (s === 'confirmed') return styles.statusConfirmed
  if (s === 'issue') return styles.statusIssue
  return styles.statusPending
}

const getPatientStatusText = (s: UnpaidPatient['status']) => {
  if (s === 'confirmed') return '已确认'
  if (s === 'issue') return '有问题'
  return '待确认'
}

const ReportCard: React.FC<ReportCardProps> = ({
  state,
  clinicName = '悦齿口腔门诊',
  operatorName
}) => {
  const cashDiff = state.cashTotal - state.cashSystemTotal
  const totalPaymentDiff =
    state.paymentCompare.wechatDiff +
    state.paymentCompare.alipayDiff +
    state.paymentCompare.posDiff
  const totalDiff = cashDiff + totalPaymentDiff
  const unpaidCount = state.unpaidPatients.filter(p => p.unpaidAmount > 0).length
  const totalUnpaid = state.unpaidPatients.reduce((s, p) => s + p.unpaidAmount, 0)

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <Text className={styles.clinicName}>{clinicName}</Text>
          <Text className={styles.reportTitle}>夜班日清交班卡</Text>
        </View>
        <View className={styles.headerRight}>
          <Text className={styles.dateText}>{state.completedAt ? formatDate(state.completedAt) : '---'}</Text>
          <View className={styles.shiftTag}>夜班</View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.dot} />
          <Text>对账概览</Text>
        </View>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>就诊患者</Text>
            <Text className={styles.summaryValue}>{state.unpaidPatients.length} 人</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>未结清</Text>
            <Text className={classnames(styles.summaryValue, unpaidCount > 0 && styles.summaryValueNegative)}>
              {unpaidCount} 人 / {formatMoney(totalUnpaid)}
            </Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>现金合计</Text>
            <Text className={styles.summaryValue}>{formatMoney(state.cashTotal)}</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>现金差异</Text>
            <Text className={classnames(
              styles.summaryValue,
              cashDiff > 0 && styles.summaryValuePositive,
              cashDiff < 0 && styles.summaryValueNegative
            )}>
              {formatMoney(cashDiff, true)}
            </Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>电子支付差异</Text>
            <Text className={classnames(
              styles.summaryValue,
              totalPaymentDiff > 0 && styles.summaryValuePositive,
              totalPaymentDiff < 0 && styles.summaryValueNegative
            )}>
              {formatMoney(totalPaymentDiff, true)}
            </Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryLabel}>总计差异</Text>
            <Text className={classnames(
              styles.summaryValue,
              totalDiff > 0 && styles.summaryValuePositive,
              totalDiff < 0 && styles.summaryValueNegative
            )}>
              {formatMoney(totalDiff, true)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <View className={styles.dot} />
          <Text>核对步骤</Text>
        </View>
        <View className={styles.stepStatusList}>
          {([1, 2, 3, 4] as SettlementStep[]).map(step => {
            const status = state.stepStatus[step]
            return (
              <View key={step} className={styles.stepStatusItem}>
                <View className={classnames(styles.stepIcon, getStepClass(status))}>
                  <Text>{getStepIcon(status)}</Text>
                </View>
                <Text className={styles.stepName}>{STEP_NAMES[step]}</Text>
                <Text className={styles.stepResult}>
                  {status === 'warning' ? '有备注' : '通过'}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {state.unpaidPatients.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.dot} />
            <Text>就诊记录</Text>
          </View>
          <View className={styles.patientList}>
            {state.unpaidPatients.map(p => (
              <View key={p.id} className={styles.patientItem}>
                <View className={styles.patientRow}>
                  <View>
                    <Text className={styles.patientName}>{p.name}</Text>
                    <View className={classnames(styles.statusTag, getPatientStatusClass(p.status))}>
                      <Text>{getPatientStatusText(p.status)}</Text>
                    </View>
                  </View>
                  {p.unpaidAmount > 0 ? (
                    <Text className={styles.patientAmount}>-{formatMoney(p.unpaidAmount)}</Text>
                  ) : (
                    <Text className={classnames(styles.patientAmount, { [styles.summaryValuePositive]: true })}>
                      {formatMoney(p.amount)}
                    </Text>
                  )}
                </View>
                <Text className={styles.patientTreatment}>
                  {p.treatment} · {p.doctor} · {p.time}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {state.issues.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.dot} />
            <Text>待办事项（移交早班）</Text>
            <Text className={styles.issueCountBadge}>{state.issues.length} 项</Text>
          </View>
          {state.issues.map(issue => (
            <View key={issue.id} className={classnames(
              styles.issueItem,
              issue.fromPatient && styles.issueItemFromPatient
            )}>
              <View className={styles.issueHeader}>
                <View className={styles.issueHeaderLeft}>
                  <Text className={classnames(
                    styles.issueType,
                    issue.fromPatient && styles.issueTypePatient
                  )}>
                    {issue.fromPatient ? '👤 ' : ''}{ISSUE_TYPE_LABELS[issue.type]}
                  </Text>
                  {issue.patientName && (
                    <Text className={styles.issuePatientName}>患者：{issue.patientName}</Text>
                  )}
                </View>
                {issue.amount !== undefined && issue.amount > 0 && (
                  <Text className={styles.issueAmount}>{formatMoney(issue.amount)}</Text>
                )}
              </View>
              <Text className={styles.issueDesc}>{issue.description}</Text>
              {issue.relatedPatientId && (
                <View className={styles.issueMeta}>
                  <Text className={styles.issueMetaText}>
                    🔗 关联患者ID：{issue.relatedPatientId}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.signatureRow}>
          <View className={styles.signatureBox}>
            <Text className={styles.signatureLabel}>交班人签名</Text>
            <View className={styles.signatureName}>
              <Text>{operatorName || state.signature || '—'}</Text>
            </View>
          </View>
          <View className={styles.signatureBox}>
            <Text className={styles.signatureLabel}>接班人签名</Text>
            <View className={styles.signatureName}>
              <Text style={{ color: '#C9CDD4' }}>早班填写</Text>
            </View>
          </View>
        </View>
        <View className={styles.timeRow}>
          <Text>生成时间：{state.completedAt ? formatDateTime(state.completedAt) : '未完成'}</Text>
        </View>
      </View>
    </View>
  )
}

export default ReportCard
