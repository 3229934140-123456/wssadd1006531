import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

export type FeedbackStatus = 'normal' | 'warning' | 'error'

export interface FeedbackDetail {
  label: string
  value: string
}

interface ResultFeedbackProps {
  status: FeedbackStatus
  title: string
  message: string
  details?: FeedbackDetail[]
  actions?: React.ReactNode
}

const iconMap: Record<FeedbackStatus, string> = {
  normal: '✓',
  warning: '!',
  error: '×'
}

const ResultFeedback: React.FC<ResultFeedbackProps> = ({
  status,
  title,
  message,
  details,
  actions
}) => {
  return (
    <View className={classnames(styles.container, styles[status])}>
      <View className={styles.header}>
        <View className={classnames(styles.icon, styles[`icon${status.charAt(0).toUpperCase() + status.slice(1)}`])}>
          <Text>{iconMap[status]}</Text>
        </View>
        <Text className={classnames(styles.title, styles[`title${status.charAt(0).toUpperCase() + status.slice(1)}`])}>
          {title}
        </Text>
      </View>
      <Text className={classnames(styles.message, styles[`message${status.charAt(0).toUpperCase() + status.slice(1)}`])}>
        {message}
      </Text>
      {details && details.length > 0 && (
        <View className={styles.details}>
          {details.map((d, i) => (
            <View key={i} className={styles.detailRow}>
              <Text className={styles.detailLabel}>{d.label}</Text>
              <Text className={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>
      )}
      {actions && <View className={styles.actions}>{actions}</View>}
    </View>
  )
}

export default ResultFeedback
