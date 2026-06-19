import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import classnames from 'classnames'
import { formatMoney } from '@/utils/format'
import styles from './index.module.scss'

interface NumberInputProps {
  label: string
  subLabel?: string
  value: number
  denomination?: number
  onChange: (val: number) => void
  min?: number
  max?: number
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  subLabel,
  value,
  denomination,
  onChange,
  min = 0,
  max = 999
}) => {
  const handleDec = () => {
    if (value > min) onChange(value - 1)
  }
  const handleInc = () => {
    if (value < max) onChange(value + 1)
  }
  const subtotal = denomination !== undefined ? value * denomination : value

  return (
    <View className={styles.container}>
      <View className={styles.mainRow}>
        <View className={styles.leftSection}>
          <Text className={styles.label}>{label}</Text>
          {subLabel && <Text className={styles.subLabel}>{subLabel}</Text>}
        </View>
        <View className={styles.rightSection}>
          <Button
            className={classnames(styles.countBtn, value <= min && styles.btnDisable)}
            onClick={handleDec}
          >−</Button>
          <Text className={styles.countDisplay}>{value}</Text>
          <Button
            className={classnames(styles.countBtn, value >= max && styles.btnDisable)}
            onClick={handleInc}
          >+</Button>
        </View>
      </View>
      {denomination !== undefined && (
        <View className={styles.totalAmount}>
          <Text>小计（{value} × ¥{denomination}）</Text>
          <Text className={styles.amountRight}>{formatMoney(subtotal)}</Text>
        </View>
      )}
    </View>
  )
}

export default NumberInput
