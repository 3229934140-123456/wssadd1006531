import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { SettlementStep, StepStatus } from '@/types/settlement'
import styles from './index.module.scss'

interface StepIndicatorProps {
  currentStep: SettlementStep
  stepStatus: Record<SettlementStep, StepStatus>
}

const STEP_TITLES = [
  { id: 1 as SettlementStep, title: '未结账患者', hint: '核对就诊记录' },
  { id: 2 as SettlementStep, title: '现金清点', hint: '核对现金抽屉' },
  { id: 3 as SettlementStep, title: '凭证上传', hint: '小票截图核对' },
  { id: 4 as SettlementStep, title: '完成交班', hint: '确认并生成交班卡' }
]

const getCircleClass = (status: StepStatus, current: boolean) => {
  if (current && status !== 'done') return styles.circleActive
  if (status === 'done') return styles.circleDone
  if (status === 'warning') return styles.circleWarning
  if (current) return styles.circleActive
  return styles.circlePending
}

const getCircleText = (status: StepStatus, stepNum: number) => {
  if (status === 'done') return '✓'
  if (status === 'warning') return '!'
  return String(stepNum)
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, stepStatus }) => {
  const currentInfo = STEP_TITLES.find(s => s.id === currentStep)!

  return (
    <View className={styles.container}>
      <View className={styles.stepsRow}>
        {STEP_TITLES.map((step, idx) => {
          const isCurrent = currentStep === step.id
          const status = stepStatus[step.id]
          const isLast = idx === STEP_TITLES.length - 1
          const showConnector = !isLast
          const nextDone = idx < STEP_TITLES.length - 1 && stepStatus[(idx + 2) as SettlementStep] === 'done'

          return (
            <View key={step.id} className={styles.stepItem}>
              {showConnector && (
                <View className={classnames(
                  styles.connector,
                  (status === 'done' || nextDone) && styles.connectorDone
                )} />
              )}
              <View className={classnames(styles.stepCircle, getCircleClass(status, isCurrent))}>
                <Text>{getCircleText(status, step.id)}</Text>
              </View>
              <Text className={classnames(styles.stepLabel, isCurrent && styles.stepLabelActive)}>
                {step.title}
              </Text>
            </View>
          )
        })}
      </View>
      <View className={styles.titleRow}>
        <Text className={styles.currentTitle}>第{currentStep}步 · {currentInfo.title}</Text>
        <Text className={styles.currentHint}>{currentInfo.hint}</Text>
      </View>
    </View>
  )
}

export default StepIndicator
