import React, { useMemo } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { mockSettlementRecords } from '@/data/mockSettlementRecords'
import ReportCard from '@/components/ReportCard'
import { formatDateTime } from '@/utils/format'
import styles from './index.module.scss'

const RecordDetailPage: React.FC = () => {
  const router = useRouter()
  const recordId = router.params.id

  const record = useMemo(() => {
    return mockSettlementRecords.find(r => r.id === recordId) || mockSettlementRecords[0]
  }, [recordId])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleShare = () => {
    Taro.showToast({ title: '截图保存即可分享', icon: 'none' })
  }

  const handlePrint = () => {
    Taro.showToast({ title: '打印功能开发中', icon: 'none' })
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

  return (
    <View className={styles.pageContainer}>
      <View className={styles.headerBar}>
        <Button className={styles.backBtn} onClick={handleBack}>← 返回</Button>
        <Text className={styles.dateLabel}>{record.date} 交班卡</Text>
        <View style={{ width: '120rpx' }} />
      </View>

      <View className={styles.actionRow}>
        <Button className={[styles.actionBtn, styles.btnOutline].join(' ')} onClick={handleShare}>
          📤 分享交班卡
        </Button>
        <Button className={[styles.actionBtn, styles.btnPrimary].join(' ')} onClick={handlePrint}>
          🖨 打印交班卡
        </Button>
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
