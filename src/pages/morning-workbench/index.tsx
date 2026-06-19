import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { formatMoney } from '@/utils/format'
import {
  getAllUnresolvedIssues,
  updateRecordIssueStatus,
  updateRecordIssueResult,
  UnresolvedIssueWithRecord
} from '@/store/SettlementContext'
import { ISSUE_STATUS_LABELS, ISSUE_STATUS_COLORS, IssueStatus } from '@/types/settlement'
import styles from './index.module.scss'

const STATUS_OPTIONS: { key: IssueStatus; label: string; color: string }[] = [
  { key: 'pending', label: '待处理', color: '#DC2626' },
  { key: 'following', label: '已跟进', color: '#F59E0B' },
  { key: 'contacted', label: '已联系患者', color: '#3B82F6' },
  { key: 'resolved', label: '已解决', color: '#10B981' }
]

const MorningWorkbenchPage: React.FC = () => {
  const [issues, setIssues] = useState<UnresolvedIssueWithRecord[]>([])
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null)
  const [handleResultText, setHandleResultText] = useState('')

  const loadData = useCallback(() => {
    setIssues(getAllUnresolvedIssues())
  }, [])

  useDidShow(() => {
    loadData()
  })

  const stats = useMemo(() => {
    const pending = issues.filter(i => i.status === 'pending').length
    const following = issues.filter(i => i.status === 'following').length
    const contacted = issues.filter(i => i.status === 'contacted').length
    const totalAmount = issues.reduce((sum, i) => sum + (i.amount || 0), 0)
    return { total: issues.length, pending, following, contacted, totalAmount }
  }, [issues])

  const handleStatusChange = (recordId: string, issueId: string, status: IssueStatus) => {
    const success = updateRecordIssueStatus(recordId, issueId, status, '早班')
    if (success) {
      loadData()
      Taro.showToast({ title: '状态已更新', icon: 'success' })
    }
  }

  const startEditResult = (issueId: string, currentResult?: string) => {
    setEditingIssueId(issueId)
    setHandleResultText(currentResult || '')
  }

  const handleSaveResult = (recordId: string, issueId: string) => {
    if (!handleResultText.trim()) {
      Taro.showToast({ title: '请输入处理结果', icon: 'none' })
      return
    }
    const success = updateRecordIssueResult(recordId, issueId, handleResultText.trim(), '早班')
    if (success) {
      loadData()
      setEditingIssueId(null)
      setHandleResultText('')
      Taro.showToast({ title: '处理结果已保存', icon: 'success' })
    }
  }

  const handleViewRecord = (recordId: string) => {
    Taro.navigateTo({ url: `/pages/record-detail/index?id=${recordId}` })
  }

  const handleCopySummary = () => {
    if (issues.length === 0) {
      Taro.showToast({ title: '暂无待处理事项', icon: 'none' })
      return
    }
    const lines: string[] = []
    lines.push('【早班待跟进事项汇总】')
    lines.push(`共 ${issues.length} 项待处理，涉及金额 ${formatMoney(stats.totalAmount)}`)
    lines.push('')

    issues.forEach((issue, idx) => {
      const statusText = ISSUE_STATUS_LABELS[issue.status as IssueStatus] || '待处理'
      lines.push(`${idx + 1}. [${statusText}] ${issue.patientName ? issue.patientName + ' - ' : ''}${issue.description}`)
      if (issue.amount !== undefined) {
        lines.push(`   💰 ${formatMoney(issue.amount)}`)
      }
      if (issue.patientNote) {
        lines.push(`   📝 ${issue.patientNote}`)
      }
      lines.push(`   📅 来源：${issue.recordDate} ${issue.shift}（${issue.operatorName}）`)
      lines.push('')
    })

    lines.push(`更新时间：${new Date().toLocaleString('zh-CN')}`)

    Taro.setClipboardData({
      data: lines.join('\n'),
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.headerBar}>
        <Button className={styles.backBtn} onClick={handleBack}>← 返回</Button>
        <Text className={styles.pageTitle}>早班工作台</Text>
        <Button className={styles.copyBtn} onClick={handleCopySummary}>📋 复制</Button>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statNumber} style={{ color: '#DC2626' }}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNumber} style={{ color: '#F59E0B' }}>{stats.following}</Text>
          <Text className={styles.statLabel}>跟进中</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNumber} style={{ color: '#3B82F6' }}>{stats.contacted}</Text>
          <Text className={styles.statLabel}>已联系</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNumber} style={{ color: '#6366F1' }}>{formatMoney(stats.totalAmount)}</Text>
          <Text className={styles.statLabel}>涉及金额</Text>
        </View>
      </View>

      {issues.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🎉</Text>
          <Text className={styles.emptyTitle}>太棒了！</Text>
          <Text className={styles.emptyDesc}>所有移交事项都已处理完毕</Text>
        </View>
      ) : (
        <View className={styles.issueList}>
          {issues.map(issue => {
            const isEditing = editingIssueId === issue.issueId
            const statusColor = ISSUE_STATUS_COLORS[issue.status as IssueStatus] || '#DC2626'
            const statusLabel = ISSUE_STATUS_LABELS[issue.status as IssueStatus] || '待处理'

            return (
              <View key={issue.issueId} className={styles.issueCard}>
                <View className={styles.issueCardHeader}>
                  <View className={styles.issuePatientInfo}>
                    {issue.patientName && (
                      <Text className={styles.patientName}>{issue.patientName}</Text>
                    )}
                    <View
                      className={styles.statusBadge}
                      style={{ backgroundColor: statusColor + '1A', color: statusColor }}
                    >
                      {statusLabel}
                    </View>
                  </View>
                  {issue.amount !== undefined && (
                    <Text className={styles.issueAmount}>💰 {formatMoney(issue.amount)}</Text>
                  )}
                </View>

                <Text className={styles.issueDesc}>{issue.description}</Text>

                {issue.patientNote && (
                  <View className={styles.issueNoteRow}>
                    <Text className={styles.issueNoteLabel}>📝 备注：</Text>
                    <Text className={styles.issueNoteText}>{issue.patientNote}</Text>
                  </View>
                )}

                <View className={styles.issueSourceRow} onClick={() => handleViewRecord(issue.recordId)}>
                  <Text className={styles.sourceText}>📅 {issue.recordDate} {issue.shift} · {issue.operatorName}</Text>
                  <Text className={styles.sourceLink}>查看交班卡 →</Text>
                </View>

                <View className={styles.statusButtonRow}>
                  {STATUS_OPTIONS.map(opt => (
                    <Button
                      key={opt.key}
                      className={classnames(
                        styles.statusBtn,
                        issue.status === opt.key && styles.statusBtnActive
                      )}
                      style={issue.status === opt.key ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                      onClick={() => handleStatusChange(issue.recordId, issue.issueId, opt.key)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </View>

                {issue.handleResult && !isEditing && (
                  <View className={styles.handleResultBox}>
                    <Text className={styles.handleResultLabel}>处理结果：</Text>
                    <Text className={styles.handleResultText}>{issue.handleResult}</Text>
                    <Button className={styles.editResultBtn} onClick={() => startEditResult(issue.issueId, issue.handleResult)}>
                      修改
                    </Button>
                  </View>
                )}

                {isEditing ? (
                  <View className={styles.editResultBox}>
                    <Input
                      className={styles.resultInput}
                      placeholder='请输入处理结果...'
                      value={handleResultText}
                      onInput={(e) => setHandleResultText(e.detail.value)}
                      maxlength={200}
                    />
                    <View className={styles.editActions}>
                      <Button className={styles.cancelBtn} onClick={() => setEditingIssueId(null)}>
                        取消
                      </Button>
                      <Button
                        className={styles.saveBtn}
                        onClick={() => handleSaveResult(issue.recordId, issue.issueId)}
                      >
                        保存
                      </Button>
                    </View>
                  </View>
                ) : (
                  !issue.handleResult && (
                    <Button
                      className={styles.addResultBtn}
                      onClick={() => startEditResult(issue.issueId)}
                    >
                      ✏️ 添加处理结果
                    </Button>
                  )
                )}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

export default MorningWorkbenchPage
