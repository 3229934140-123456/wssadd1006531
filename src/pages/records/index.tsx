import React, { useState, useMemo, useCallback } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { formatMoney, formatDateTime } from '@/utils/format'
import { mockSettlementRecords } from '@/data/mockSettlementRecords'
import { SettlementRecord } from '@/types/settlement'
import { getSettlementRecords } from '@/store/SettlementContext'
import styles from './index.module.scss'

type FilterType = 'all' | 'normal' | 'warning' | 'error'

const RecordsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all')
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

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return allRecords
    return allRecords.filter(r => {
      const totalDiff = r.summary.cashDiff + r.summary.paymentDiff
      if (filter === 'normal') return totalDiff === 0 && r.summary.issuesCount === 0
      if (filter === 'warning') return Math.abs(totalDiff) > 0 && Math.abs(totalDiff) <= 50
      if (filter === 'error') return Math.abs(totalDiff) > 50 || r.summary.issuesCount > 0
      return true
    })
  }, [filter, allRecords])

  const stats = useMemo(() => {
    const total = allRecords.length
    const perfect = allRecords.filter(r =>
      r.summary.cashDiff === 0 && r.summary.paymentDiff === 0 && r.summary.issuesCount === 0
    ).length
    const withIssue = allRecords.filter(r => r.summary.issuesCount > 0).length
    return { total, perfect, withIssue }
  }, [allRecords])

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `全部 (${allRecords.length})` },
    { key: 'normal', label: '完美交班' },
    { key: 'warning', label: '有小差异' },
    { key: 'error', label: '有问题' }
  ]

  const handleViewDetail = (record: SettlementRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
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
            <Text className={styles.statValue}>{stats.perfect}</Text>
            <Text className={styles.statLabel}>完美对账</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.statValue}>{stats.withIssue}</Text>
            <Text className={styles.statLabel}>有待办</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filters.map(f => (
          <Button
            key={f.key}
            className={classnames(
              styles.filterBtn,
              filter === f.key && styles.filterBtnActive
            )}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </View>

      {filteredRecords.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无符合条件的交班记录</Text>
          <Text className={styles.emptyDesc}>完成今日日清后，记录会显示在这里</Text>
        </View>
      ) : (
        filteredRecords.map(record => {
          const totalDiff = record.summary.cashDiff + record.summary.paymentDiff
          const hasIssue = record.summary.issuesCount > 0

          return (
            <View key={record.id} className={styles.recordCard} onClick={() => handleViewDetail(record)}>
              <View className={styles.recordHeader}>
                <Text className={styles.recordDate}>{record.date}</Text>
                <View className={styles.recordShift}>
                  <Text>{record.shift}</Text>
                </View>
              </View>
              <Text className={styles.recordOperator}>
                交班人：{record.operatorName} · {formatDateTime(record.completedAt)}
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
                <View className={classnames(
                  styles.issueBadge,
                  !hasIssue && styles.issueBadgeNone,
                  hasIssue && styles.issueBadgeHas
                )}>
                  <Text>
                    {hasIssue
                      ? `⚠ ${record.summary.handedOverCount} 项移交早班`
                      : '✓ 无待办事项'}
                  </Text>
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
