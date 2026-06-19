import React, { useState } from 'react'
import { View, Text, Button, Textarea, Input } from '@tarojs/components'
import classnames from 'classnames'
import { IssueType, ISSUE_TYPE_LABELS, IssueItem } from '@/types/settlement'
import { formatMoney, formatDateTime } from '@/utils/format'
import styles from './index.module.scss'

interface IssueSelectorProps {
  issues: IssueItem[]
  onAdd: (issue: Omit<IssueItem, 'id' | 'createdAt' | 'handedOver'>) => void
  onRemove: (id: string) => void
}

const ISSUE_TYPES: IssueType[] = [
  'patient_unpaid',
  'manual_discount',
  'doctor_extra',
  'system_error',
  'cash_mismatch',
  'receipt_missing',
  'other'
]

const IssueSelector: React.FC<IssueSelectorProps> = ({ issues, onAdd, onRemove }) => {
  const [selectedType, setSelectedType] = useState<IssueType | null>(null)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const canAdd = selectedType && description.trim()

  const handleAdd = () => {
    if (!canAdd || !selectedType) return
    onAdd({
      type: selectedType,
      description: description.trim(),
      amount: amount ? parseFloat(amount) : undefined
    })
    setSelectedType(null)
    setDescription('')
    setAmount('')
  }

  return (
    <View className={styles.container}>
      <Text className={styles.title}>发现问题？留下待办事项给早班</Text>

      <View className={styles.tagList}>
        {ISSUE_TYPES.map(type => (
          <Button
            key={type}
            className={classnames(styles.tagItem, selectedType === type && styles.tagSelected)}
            onClick={() => setSelectedType(type)}
          >
            {ISSUE_TYPE_LABELS[type]}
          </Button>
        ))}
      </View>

      <View className={styles.inputArea}>
        {selectedType ? (
          <Textarea
            className={styles.textarea}
            placeholder={`请详细描述${ISSUE_TYPE_LABELS[selectedType]}的具体情况...`}
            value={description}
            onInput={e => setDescription(e.detail.value)}
            maxlength={200}
          />
        ) : (
          <Text className={styles.placeholder}>请先选择上方问题类型，再填写详细说明</Text>
        )}
      </View>

      <View className={styles.amountRow}>
        <Text className={styles.amountLabel}>涉及金额（选填）</Text>
        <Input
          className={styles.amountInput}
          type='digit'
          placeholder='¥ 0.00'
          value={amount}
          onInput={e => setAmount(e.detail.value)}
        />
      </View>

      <Button
        className={classnames(styles.addBtn, !canAdd && styles.addBtnDisabled)}
        disabled={!canAdd}
        onClick={handleAdd}
      >
        + 添加为待办事项
      </Button>

      {issues.length > 0 && (
        <View className={styles.existingList}>
          <Text className={styles.existingTitle}>已记录的待办事项（{issues.length}）</Text>
          {issues.map(issue => (
            <View key={issue.id} className={styles.existingItem}>
              <View className={styles.existingInfo}>
                <Text className={styles.existingType}>
                  {ISSUE_TYPE_LABELS[issue.type]} · {formatDateTime(issue.createdAt)}
                </Text>
                <Text className={styles.existingDesc}>{issue.description}</Text>
                {issue.amount !== undefined && issue.amount > 0 && (
                  <Text className={styles.existingAmount}>
                    涉及金额：{formatMoney(issue.amount)}
                  </Text>
                )}
              </View>
              <Button className={styles.removeBtn} onClick={() => onRemove(issue.id)}>×</Button>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default IssueSelector
