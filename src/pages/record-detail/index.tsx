import React, { useMemo, useState, useCallback } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { mockSettlementRecords } from '@/data/mockSettlementRecords'
import ReportCard from '@/components/ReportCard'
import { formatDateTime, formatMoney } from '@/utils/format'
import {
  getSettlementRecords,
  updateRecordIssueStatus,
  updateRecordIssueResult,
  generateTextSummary,
  getUnresolvedIssueCount
} from '@/store/SettlementContext'
import { ISSUE_TYPE_LABELS, ISSUE_STATUS_LABELS, ISSUE_STATUS_COLORS, IssueStatus } from '@/types/settlement'
import styles from './index.module.scss'

const STATUS_OPTIONS: { key: IssueStatus; label: string; color: string }[] = [
  { key: 'pending', label: '待处理', color: '#DC2626' },
  { key: 'following', label: '已跟进', color: '#F59E0B' },
  { key: 'contacted', label: '已联系患者', color: '#3B82F6' },
  { key: 'resolved', label: '已解决', color: '#10B981' }
]

const RecordDetailPage: React.FC = () => {
  const router = useRouter()
  const recordId = router.params.id
  const [localRecords, setLocalRecords] = useState(getSettlementRecords())
  const [paymentExpanded, setPaymentExpanded] = useState(false)
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null)
  const [handleResultText, setHandleResultText] = useState('')

  const loadRecords = useCallback(() => {
    setLocalRecords(getSettlementRecords())
  }, [])

  useDidShow(() => {
    loadRecords()
  })

  const record = useMemo(() => {
    const allRecords = [...localRecords, ...mockSettlementRecords]
    return allRecords.find(r => r.id === recordId) || allRecords[0]
  }, [recordId, localRecords])

  const isLocalRecord = useMemo(() => {
    return localRecords.some(r => r.id === recordId)
  }, [localRecords, recordId])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleShare = () => {
    const summary = generateTextSummary(record)
    Taro.setClipboardData({
      data: summary,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  }

  const handlePrint = () => {
    Taro.showToast({ title: '打印功能开发中', icon: 'none' })
  }

  const handleStatusChange = (issueId: string, status: IssueStatus) => {
    if (!isLocalRecord) {
      Taro.showToast({ title: '示例记录无法修改', icon: 'none' })
      return
    }
    const success = updateRecordIssueStatus(recordId, issueId, status, '早班')
    if (success) {
      loadRecords()
      Taro.showToast({ title: '状态已更新', icon: 'success' })
    }
  }

  const handleSaveResult = (issueId: string) => {
    if (!isLocalRecord) {
      Taro.showToast({ title: '示例记录无法修改', icon: 'none' })
      return
    }
    if (!handleResultText.trim()) {
      Taro.showToast({ title: '请输入处理结果', icon: 'none' })
      return
    }
    const success = updateRecordIssueResult(recordId, issueId, handleResultText.trim(), '早班')
    if (success) {
      loadRecords()
      setEditingIssueId(null)
      setHandleResultText('')
      Taro.showToast({ title: '处理结果已保存', icon: 'success' })
    }
  }

  const startEditResult = (issueId: string, currentResult?: string) => {
    if (!isLocalRecord) {
      Taro.showToast({ title: '示例记录无法修改', icon: 'none' })
      return
    }
    setEditingIssueId(issueId)
    setHandleResultText(currentResult || '')
  }

  if (!record) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📄</Text>
          <Text className={styles.emptyText}>未找到该交班记录</Text>
          <Button className={styles.backBtn} onClick={handleBack} style={{ marginTop: '32rpx' }}>
            返回列表
          </Button>
        </View>
      </View>
    )
  }

  const unresolved = getUnresolvedIssueCount(record)
  const pc = record.details.paymentCompare

  return (
    <View className={styles.pageContainer}>
      <View className={styles.headerBar}>
        <Button className={styles.backBtn} onClick={handleBack}>← 返回</Button>
        <Text className={styles.dateLabel}>{record.date} 交班卡</Text>
        <View style={{ width: '120rpx' }} />
      </View>

      <View className={styles.actionRow}>
        <Button className={[styles.actionBtn, styles.btnOutline].join(' ')} onClick={handleShare}>
          📤 复制文字摘要
        </Button>
        <Button className={[styles.actionBtn, styles.btnPrimary].join(' ')} onClick={handlePrint}>
          🖨 打印交班卡
        </Button>
      </View>

      {record.details.issues.length > 0 && (
        <View className={styles.sectionCard}>
          <View className={styles.sectionCardHeader}>
            <Text className={styles.sectionCardTitle}>
              📋 移交事项（{unresolved}/{record.details.issues.length} 待处理）
            </Text>
            {!isLocalRecord && (
              <Text className={styles.mockHint}>示例记录</Text>
            )}
          </View>
          {record.details.issues.map(issue => {
            const currentStatus: IssueStatus = issue.status || 'pending'
            const isEditing = editingIssueId === issue.id

            return (
              <View key={issue.id} className={styles.issueDetailCard}>
                <View className={styles.issueDetailHeader}>
                  <View className={styles.issueDetailTop}>
                    <Text className={styles.issueTypeText}>
                      {issue.fromPatient ? '👤 ' : ''}{ISSUE_TYPE_LABELS[issue.type]}
                    </Text>
                    <View
                      className={styles.issueStatusBadge}
                      style={{ backgroundColor: ISSUE_STATUS_COLORS[currentStatus] }}
                    >
                      <Text>{ISSUE_STATUS_LABELS[currentStatus]}</Text>
                    </View>
                  </View>
                  {issue.patientName && (
                    <Text className={styles.issuePatient}>患者：{issue.patientName}</Text>
                  )}
                </View>

                <Text className={styles.issueDescText}>{issue.description}</Text>

                {(issue.patientNote || issue.amount !== undefined) && (
                  <View className={styles.issueMetaRow}>
                    {issue.patientNote && (
                      <Text className={styles.issueMetaText}>📋 备注：{issue.patientNote}</Text>
                    )}
                    {issue.amount !== undefined && issue.amount > 0 && (
                      <Text className={styles.issueAmountText}>💰 {formatMoney(issue.amount)}</Text>
                    )}
                  </View>
                )}

                <View className={styles.statusOptions}>
                  {STATUS_OPTIONS.map(opt => (
                    <Button
                      key={opt.key}
                      className={classnames(
                        styles.statusOptionBtn,
                        currentStatus === opt.key && styles.statusOptionActive
                      )}
                      style={currentStatus === opt.key ? { borderColor: opt.color, color: opt.color } : {}}
                      onClick={() => handleStatusChange(issue.id, opt.key)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </View>

                {issue.handleResult && !isEditing && (
                  <View className={styles.handleResultBox}>
                    <Text className={styles.handleResultLabel}>处理结果：</Text>
                    <Text className={styles.handleResultText}>{issue.handleResult}</Text>
                    <Text className={styles.handleResultMeta}>
                      {issue.handlerName} · {issue.handledAt ? formatDateTime(issue.handledAt) : ''}
                    </Text>
                  </View>
                )}

                {isEditing ? (
                  <View className={styles.editResultBox}>
                    <Input
                      className={styles.resultInput}
                      placeholder='请输入处理结果说明...'
                      value={handleResultText}
                      onInput={e => setHandleResultText(e.detail.value)}
                      maxlength={200}
                    />
                    <View className={styles.editResultActions}>
                      <Button
                        className={styles.cancelBtn}
                        onClick={() => { setEditingIssueId(null); setHandleResultText('') }}
                      >
                        取消
                      </Button>
                      <Button
                        className={styles.saveBtn}
                        onClick={() => handleSaveResult(issue.id)}
                      >
                        保存
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Button
                    className={styles.editResultBtn}
                    onClick={() => startEditResult(issue.id, issue.handleResult)}
                  >
                    ✏️ {issue.handleResult ? '修改处理结果' : '添加处理结果'}
                  </Button>
                )}
              </View>
            )
          })}
        </View>
      )}

      <View className={styles.sectionCard}>
        <View className={styles.sectionCardHeader} onClick={() => setPaymentExpanded(!paymentExpanded)}>
          <Text className={styles.sectionCardTitle}>💳 电子支付对账明细</Text>
          <Text className={styles.expandIcon}>{paymentExpanded ? '▲' : '▼'}</Text>
        </View>

        {!paymentExpanded ? (
          <View className={styles.paymentSummary}>
            <Text className={styles.paymentSummaryText}>
              合计差异：{formatMoney(record.summary.paymentDiff, true)}
            </Text>
            <Text className={styles.expandHint}>点击展开详情</Text>
          </View>
        ) : (
          <View className={styles.paymentDetailList}>
            {[
              { name: '微信支付', icon: '💚', system: pc.wechatSystem, actual: pc.wechatActual, systemCount: pc.wechatSystemCount, actualCount: pc.wechatActualCount, diff: pc.wechatDiff, countDiff: pc.wechatCountDiff },
              { name: '支付宝', icon: '💙', system: pc.alipaySystem, actual: pc.alipayActual, systemCount: pc.alipaySystemCount, actualCount: pc.alipayActualCount, diff: pc.alipayDiff, countDiff: pc.alipayCountDiff },
              { name: 'POS刷卡', icon: '💳', system: pc.posSystem, actual: pc.posActual, systemCount: pc.posSystemCount, actualCount: pc.posActualCount, diff: pc.posDiff, countDiff: pc.posCountDiff }
            ].map((item, idx) => {
              const passed = item.diff === 0 && item.countDiff === 0
              return (
                <View key={idx} className={classnames(
                  styles.paymentDetailItem,
                  passed && styles.paymentDetailPassed
                )}>
                  <View className={styles.paymentDetailHeader}>
                    <Text className={styles.paymentDetailIcon}>{item.icon}</Text>
                    <Text className={styles.paymentDetailName}>{item.name}</Text>
                    <View className={classnames(
                      styles.paymentDetailStatus,
                      passed ? styles.statusOk : styles.statusWarn
                    )}>
                      <Text>{passed ? '✓ 对上' : '⚠️ 有差异'}</Text>
                    </View>
                  </View>
                  <View className={styles.paymentDetailGrid}>
                    <View className={styles.paymentDetailCol}>
                      <Text className={styles.paymentDetailLabel}>系统金额</Text>
                      <Text className={styles.paymentDetailValue}>{formatMoney(item.system)}</Text>
                    </View>
                    <View className={styles.paymentDetailCol}>
                      <Text className={styles.paymentDetailLabel}>实到金额</Text>
                      <Text className={styles.paymentDetailValue}>{formatMoney(item.actual)}</Text>
                    </View>
                    <View className={styles.paymentDetailCol}>
                      <Text className={styles.paymentDetailLabel}>金额差异</Text>
                      <Text className={classnames(
                        styles.paymentDetailValue,
                        item.diff > 0 && styles.valuePos,
                        item.diff < 0 && styles.valueNeg
                      )}>
                        {formatMoney(item.diff, true)}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.paymentDetailGrid}>
                    <View className={styles.paymentDetailCol}>
                      <Text className={styles.paymentDetailLabel}>系统笔数</Text>
                      <Text className={styles.paymentDetailValue}>{item.systemCount} 笔</Text>
                    </View>
                    <View className={styles.paymentDetailCol}>
                      <Text className={styles.paymentDetailLabel}>实到笔数</Text>
                      <Text className={styles.paymentDetailValue}>{item.actualCount} 笔</Text>
                    </View>
                    <View className={styles.paymentDetailCol}>
                      <Text className={styles.paymentDetailLabel}>笔数差异</Text>
                      <Text className={classnames(
                        styles.paymentDetailValue,
                        item.countDiff > 0 && styles.valuePos,
                        item.countDiff < 0 && styles.valueNeg
                      )}>
                        {item.countDiff >= 0 ? '+' : ''}{item.countDiff} 笔
                      </Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      <ReportCard
        state={record.details}
        operatorName={record.operatorName}
      />

      <View className={styles.metaInfo}>
        <Text className={styles.metaTitle}>交班信息</Text>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>班次</Text>
          <Text className={styles.metaVal}>{record.shift}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>交班人</Text>
          <Text className={styles.metaVal}>{record.operatorName}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>签名</Text>
          <Text className={styles.metaVal}>{record.signature}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>完成时间</Text>
          <Text className={styles.metaVal}>{formatDateTime(record.completedAt)}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>就诊总数</Text>
          <Text className={styles.metaVal}>{record.summary.totalPatients} 人</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>移交早班事项</Text>
          <Text className={styles.metaVal}>{record.summary.handedOverCount} 项</Text>
        </View>
      </View>
    </View>
  )
}

export default RecordDetailPage
