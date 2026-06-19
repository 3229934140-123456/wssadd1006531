import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { formatDate } from '@/utils/format'
import { mockUnpaidPatients } from '@/data/mockPatients'
import { mockSettlementRecords } from '@/data/mockSettlementRecords'
import styles from './index.module.scss'

const HomePage: React.FC = () => {
  const today = formatDate(new Date())
  const pendingPatients = mockUnpaidPatients.filter(p => p.status !== 'confirmed').length
  const lastRecord = mockSettlementRecords[0]

  const handleStartSettlement = () => {
    Taro.switchTab({ url: '/pages/settlement/index' })
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'records':
        Taro.switchTab({ url: '/pages/records/index' })
        break
      case 'patients':
        Taro.switchTab({ url: '/pages/settlement/index' })
        break
      case 'issue':
        Taro.showToast({ title: '问题上报功能开发中', icon: 'none' })
        break
      case 'help':
        Taro.showToast({ title: '使用帮助开发中', icon: 'none' })
        break
    }
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.greetingCard}>
        <View className={styles.greetingRow}>
          <View className={styles.greetingLeft}>
            <Text className={styles.greetingText}>晚上好，辛苦了 ☕</Text>
            <Text className={styles.userName}>张小明</Text>
            <Text className={styles.clinicText}>悦齿口腔门诊 · 前台接待</Text>
          </View>
          <View className={styles.clinicBadge}>今日 · {today}</View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{mockUnpaidPatients.length}</Text>
            <Text className={styles.statLabel}>就诊患者</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{pendingPatients}</Text>
            <Text className={styles.statLabel}>待确认</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{lastRecord?.summary.issuesCount || 0}</Text>
            <Text className={styles.statLabel}>昨日待办</Text>
          </View>
        </View>
      </View>

      <View className={styles.startCard}>
        <View className={styles.startHeader}>
          <Text className={styles.startTitle}>开始日清对账</Text>
          <View className={styles.startBadge}>4 步完成交班</View>
        </View>
        <Text className={styles.startDesc}>
          按顺序完成患者核对 → 现金清点 → 凭证上传 → 收据核对，每一步都会帮你即时比对系统记录，减少遗漏。
        </Text>
        <View className={styles.startSteps}>
          {['核对患者', '清点现金', '上传凭证', '生成交班卡'].map((label, i) => (
            <View key={i} className={styles.stepMini}>
              <View className={styles.stepMiniNum}>{i + 1}</View>
              <Text className={styles.stepMiniLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <Button className={styles.startBtn} onClick={handleStartSettlement}>
          开始日清 →
        </Button>
      </View>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionText}>快捷操作</Text>
      </View>
      <View className={styles.quickGrid}>
        <View className={styles.quickItem} onClick={() => handleQuickAction('records')}>
          <View className={classnames(styles.quickIcon, styles.icon1)}>
            <Text>📋</Text>
          </View>
          <Text className={styles.quickLabel}>交班记录</Text>
        </View>
        <View className={styles.quickItem} onClick={() => handleQuickAction('patients')}>
          <View className={classnames(styles.quickIcon, styles.icon2)}>
            <Text>👥</Text>
          </View>
          <Text className={styles.quickLabel}>就诊记录</Text>
        </View>
        <View className={styles.quickItem} onClick={() => handleQuickAction('issue')}>
          <View className={classnames(styles.quickIcon, styles.icon3)}>
            <Text>⚠️</Text>
          </View>
          <Text className={styles.quickLabel}>问题上报</Text>
        </View>
        <View className={styles.quickItem} onClick={() => handleQuickAction('help')}>
          <View className={classnames(styles.quickIcon, styles.icon4)}>
            <Text>❓</Text>
          </View>
          <Text className={styles.quickLabel}>使用帮助</Text>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionText}>交班通知</Text>
      </View>
      <View className={styles.noticeCard}>
        <View className={styles.noticeItem}>
          <View className={classnames(styles.noticeDot, styles.dotUrgent)} />
          <View className={styles.noticeContent}>
            <Text className={styles.noticeTitle}>昨日遗留：患者陈*芳正畸复诊费用3200元未付</Text>
            <Text className={styles.noticeMeta}>请早班联系患者确认 · 王小强上报</Text>
          </View>
        </View>
        <View className={styles.noticeItem}>
          <View className={classnames(styles.noticeDot, styles.dotNormal)} />
          <View className={styles.noticeContent}>
            <Text className={styles.noticeTitle}>本月考勤：本周六为张小明值班</Text>
            <Text className={styles.noticeMeta}>人事公告 · 3天前</Text>
          </View>
        </View>
        <View className={styles.noticeItem}>
          <View className={classnames(styles.noticeDot, styles.dotInfo)} />
          <View className={styles.noticeContent}>
            <Text className={styles.noticeTitle}>耗材提醒：一次性口杯库存不足，请及时申领</Text>
            <Text className={styles.noticeMeta}>库房提醒 · 今日</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default HomePage
