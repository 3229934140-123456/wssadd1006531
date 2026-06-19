import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { formatMoney, formatDateTime } from '@/utils/format'
import { mockSettlementRecords } from '@/data/mockSettlementRecords'
import { SettlementRecord } from '@/types/settlement'
import { getSettlementRecords, getUnresolvedIssueCount } from '@/store/SettlementContext'
import styles from './index.module.scss'

type DateFilter = 'all' | 'today' | 'yesterday' | '7days'
type IssueFilter = 'all' | 'hasIssue' | 'unresolved'
type DiffFilter = 'all' | 'hasDiff' | 'noDiff'

const RecordsPage: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all')
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all')
  const [operatorFilter, setOperatorFilter] = useState<string>('all')
  const [localRecords, setLocalRecords] = useState<SettlementRecord[]>([])

  const loadRecords = useCallback(() => {
    const stored = getSettlementRecords()
    setLocalRecords(stored)
  }, [])

  useDidShow(() => {
    loadRecords()
  })

  const allRecords = useMemo(() => {
    return [...localRecords, ...mockSettlementRecords]
  }, [localRecords])

  const operators = useMemo(() => {
    const set = new Set<string>()
    allRecords.forEach(r => set.add(r.operatorName))
    return ['all', ...Array.from(set)]
  }, [allRecords])

  const isInDateRange = useCallback((dateStr: string): boolean => {
    if (dateFilter === 'all') return true
    const today = new Date()
    const recordDate = new Date(dateStr)
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    switch (dateFilter) {
      case 'today':
        return dateStr === todayStr
      case 'yesterday':
        return dateStr === yesterdayStr
      case '7days':
        return recordDate >= sevenDaysAgo
      default:
        return true
    }
  }, [dateFilter])

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (dateFilter !== 'all' && !isInDateRange(r.date)) return false
      if (operatorFilter !== 'all' && r.operatorName !== operatorFilter) return false

      const unresolved = getUnresolvedIssueCount(r)
      if (issueFilter === 'hasIssue' && r.summary.issuesCount === 0) return false
      if (issueFilter === 'unresolved' && unresolved === 0) return false

      const totalDiff = r.summary.cashDiff + r.summary.paymentDiff
      if (diffFilter === 'hasDiff' && totalDiff === 0 && r.summary.issuesCount === 0) return false
      if (diffFilter === 'noDiff' && (totalDiff !== 0 || r.summary.issuesCount > 0)) return false

      return true
    })
  }, [allRecords, dateFilter, issueFilter, diffFilter, operatorFilter, isInDateRange])

  const stats = useMemo(() => {
    const total = allRecords.length
    const perfect = allRecords.filter(r =>
      r.summary.cashDiff === 0 && r.summary.paymentDiff === 0 && r.summary.issuesCount === 0
    ).length
    const withIssue = allRecords.filter(r => r.summary.issuesCount > 0).length
    const unresolvedTotal = allRecords.reduce((sum, r) => sum + getUnresolvedIssueCount(r), 0)
    return { total, perfect, withIssue, unresolvedTotal }
  }, [allRecords])

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'today', label: '今天' },
    { key: 'yesterday', label: '昨天' },
    { key: '7days', label: '近7天' }
  ]

  const issueFilters: { key: IssueFilter; label: string }[] = [
    { key: 'all', label: '全部事项' },
    { key: 'hasIssue', label: '有移交' },
    { key: 'unresolved', label: '未处理' }
  ]

  const diffFilters: { key: DiffFilter; label: string }[] = [
    { key: 'all', label: '全部差异' },
    { key: 'hasDiff', label: '有差异' },
    { key: 'noDiff', label: '无差异' }
  ]

  const handleViewDetail = (record: SettlementRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    })
  }

  const handleOperatorChange = () => {
    const labels = operators.map(o => o === 'all' ? '全部交班人' : o)
    Taro.showActionSheet({
      itemList: labels,
      success: res => {
        setOperatorFilter(operators[res.tapIndex])
      }
    })
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.summaryHeader}>
        <Text className={styles.summaryTitle}>本月交班概览</Text>
        <View className={styles.summaryStats}>
          <View className={styles.stat}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总交班次数</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue} style={{ color: '#10B981' }}>{stats.perfect}</Text>
            <Text className={styles.statLabel}>完美对账</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue} style={{ color: '#DC2626' }}>{stats.unresolvedTotal}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterRow}>
          {dateFilters.map(f => (
            <Button
              key={f.key}
              className={classnames(
                styles.filterChip,
                dateFilter === f.key && styles.filterChipActive
              )}
              onClick={() => setDateFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </View>
        <View className={styles.filterRow}>
          {issueFilters.map(f => (
            <Button
              key={f.key}
              className={classnames(
                styles.filterChip,
                issueFilter === f.key && styles.filterChipActive
              )}
              onClick={() => setIssueFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </View>
        <View className={styles.filterRow}>
          {diffFilters.map(f => (
            <Button
              key={f.key}
              className={classnames(
                styles.filterChip,
                diffFilter === f.key && styles.filterChipActive
              )}
              onClick={() => setDiffFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
          <Button className={styles.filterChipOperator} onClick={handleOperatorChange}>
            👤 {operatorFilter === 'all' ? '全部交班人' : operatorFilter} ▾
          </Button>
        </View>
      </View>

      <View className={styles.resultCount}>
        <Text>共 {filteredRecords.length} 条记录</Text>
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无符合条件的交班记录</Text>
          <Text className={styles.emptyDesc}>试试调整筛选条件，或完成今日日清</Text>
        </View>
      ) : (
        filteredRecords.map(record => {
          const totalDiff = record.summary.cashDiff + record.summary.paymentDiff
          const hasIssue = record.summary.issuesCount > 0
          const unresolved = getUnresolvedIssueCount(record)

          return (
            <View key={record.id} className={styles.recordCard} onClick={() => handleViewDetail(record)}>
              <View className={styles.recordHeader}>
                <View className={styles.recordHeaderLeft}>
                  <Text className={styles.recordDate}>{record.date}</Text>
                  <Text className={styles.recordOperator}>
                    {record.operatorName}
                  </Text>
                </View>
                <View className={styles.recordHeaderRight}>
                  <View className={styles.recordShift}>
                    <Text>{record.shift}</Text>
                  </View>
                  {unresolved > 0 && (
                    <View className={styles.unresolvedBadge}>
                      <Text>{unresolved} 待处理</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text className={styles.recordTime}>
                {formatDateTime(record.completedAt)}
              </Text>

              <View className={styles.recordGrid}>
                <View className={styles.recordStat}>
                  <Text className={styles.recordStatLabel}>就诊患者</Text>
                  <Text className={styles.recordStatValue}>{record.summary.totalPatients} 人</Text>
                </View>
                <View className={styles.recordStat}>
                  <Text className={styles.recordStatLabel}>未结清</Text>
                  <Text className={classnames(
                    styles.recordStatValue,
                    record.summary.unpaidCount > 0 && styles.valueNegative
                  )}>
                    {record.summary.unpaidCount} 人
                  </Text>
                </View>
                <View className={styles.recordStat}>
                  <Text className={styles.recordStatLabel}>现金合计</Text>
                  <Text className={styles.recordStatValue}>{formatMoney(record.summary.cashTotal)}</Text>
                </View>
                <View className={styles.recordStat}>
                  <Text className={styles.recordStatLabel}>总差异</Text>
                  <Text className={classnames(
                    styles.recordStatValue,
                    totalDiff > 0 && styles.valuePositive,
                    totalDiff < 0 && styles.valueNegative
                  )}>
                    {formatMoney(totalDiff, true)}
                  </Text>
                </View>
              </View>

              <View className={styles.recordFooter}>
                <View className={styles.footerLeft}>
                  {hasIssue ? (
                    <View className={classnames(
                      styles.issueBadge,
                      unresolved > 0 ? styles.issueBadgeHas : styles.issueBadgeDone
                    )}>
                      <Text>
                        {unresolved > 0
                          ? `⚠ ${unresolved}/${record.summary.issuesCount} 项待处理`
                          : `✓ ${record.summary.issuesCount} 项已处理`}
                      </Text>
                    </View>
                  ) : (
                    <View className={classnames(styles.issueBadge, styles.issueBadgeNone)}>
                      <Text>✓ 无待办事项</Text>
                    </View>
                  )}
                </View>
                <Button
                  className={styles.detailBtn}
                  onClick={e => { e.stopPropagation(); handleViewDetail(record) }}
                >
                  查看详情 →
                </Button>
              </View>
            </View>
          )
        })
      )}
    </View>
  )
}

export default RecordsPage
