import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { mockSettlementRecords } from '@/data/mockSettlementRecords'
import styles from './index.module.scss'

const MinePage: React.FC = () => {
  const myRecords = mockSettlementRecords.filter(r => r.operatorName === '张小明' || true)
  const perfectCount = myRecords.filter(r =>
    r.summary.cashDiff === 0 && r.summary.paymentDiff === 0 && r.summary.issuesCount === 0
  ).length

  const handleMenuClick = (key: string) => {
    const tips: Record<string, string> = {
      profile: '个人资料功能开发中',
      clinic: '诊所信息功能开发中',
      help: '使用帮助：\n1. 首页点击"开始日清"进入对账流程\n2. 按4步流程逐一核对\n3. 有问题选择原因移交早班\n4. 签名生成交班卡',
      settings: '设置功能开发中',
      feedback: '意见反馈功能开发中',
      about: '悦齿日清助手 v1.0.0\n专为口腔诊所夜班前台设计'
    }
    if (key === 'help') {
      Taro.showModal({
        title: '📖 使用帮助',
        content: tips[key],
        showCancel: false,
        confirmColor: '#10B981'
      })
    } else if (key === 'about') {
      Taro.showModal({
        title: '关于应用',
        content: tips[key],
        showCancel: false,
        confirmColor: '#10B981'
      })
    } else {
      Taro.showToast({ title: tips[key], icon: 'none' })
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#EF4444',
      success: res => {
        if (res.confirm) {
          Taro.showToast({ title: '已退出（模拟）', icon: 'success' })
        }
      }
    })
  }

  const menus = [
    { key: 'profile', icon: '👤', iconClass: styles.icon1, title: '个人资料', desc: '查看和修改个人信息' },
    { key: 'clinic', icon: '🏥', iconClass: styles.icon5, title: '诊所信息', desc: '悦齿口腔门诊 · 前台' },
    { key: 'help', icon: '📖', iconClass: styles.icon2, title: '使用帮助', desc: '4步日清对账指南', badge: 'NEW' },
    { key: 'feedback', icon: '💬', iconClass: styles.icon3, title: '意见反馈', desc: '告诉我们你的建议' },
    { key: 'settings', icon: '⚙️', iconClass: styles.icon4, title: '系统设置', desc: '通知、隐私等' },
    { key: 'about', icon: 'ℹ️', iconClass: styles.icon6, title: '关于我们', desc: '版本 1.0.0' }
  ]

  return (
    <View className={styles.pageContainer}>
      <View className={styles.profileCard}>
        <View className={styles.avatar}>
          <Text>👩‍⚕️</Text>
        </View>
        <Text className={styles.userName}>张小明</Text>
        <Text className={styles.userRole}>悦齿口腔门诊 · 前台接待</Text>
        <View className={styles.userMeta}>
          <View className={styles.metaItem}>
            <Text className={styles.metaValue}>{myRecords.length}</Text>
            <Text className={styles.metaLabel}>交班次数</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaValue}>{perfectCount}</Text>
            <Text className={styles.metaLabel}>完美对账</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaValue}>{Math.round(perfectCount / Math.max(myRecords.length, 1) * 100)}%</Text>
            <Text className={styles.metaLabel}>准确率</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionText}>工作统计</Text>
      </View>
      <View className={styles.statsCard}>
        <Text className={styles.statsTitle}>本月工作概况</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>{myRecords.length}</Text>
            <Text className={styles.statsLabel}>夜班次数</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>{myRecords.reduce((s, r) => s + r.summary.totalPatients, 0)}</Text>
            <Text className={styles.statsLabel}>服务患者</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>{myRecords.reduce((s, r) => s + r.summary.handedOverCount, 0)}</Text>
            <Text className={styles.statsLabel}>移交事项</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum} style={{ fontSize: '28rpx' }}>
              {perfectCount / Math.max(myRecords.length, 1) * 100 > 80 ? '优秀' : '良好'}
            </Text>
            <Text className={styles.statsLabel}>工作评价</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionText}>功能菜单</Text>
      </View>
      <View className={styles.menuCard}>
        {menus.map(m => (
          <View key={m.key} className={styles.menuItem} onClick={() => handleMenuClick(m.key)}>
            <View className={[styles.menuIcon, m.iconClass].join(' ')}>
              <Text>{m.icon}</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>{m.title}</Text>
              <Text className={styles.menuDesc}>{m.desc}</Text>
            </View>
            {m.badge && <View className={styles.menuBadge}><Text>{m.badge}</Text></View>}
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>

      <Button className={styles.logoutBtn} onClick={handleLogout}>
        退出登录
      </Button>

      <View className={styles.tipCard}>
        <Text className={styles.tipText}>
          悦齿日清助手 · 让每一次交班都清晰可靠 🌙
        </Text>
      </View>
    </View>
  )
}

export default MinePage
