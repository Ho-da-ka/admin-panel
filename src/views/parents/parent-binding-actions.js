export function describeUnbindAction(bindingType) {
  if (bindingType === 'AUTO') {
    return {
      allowed: false,
      confirmText: '该关系由学员监护人手机号自动生成，请修改学员档案中的监护人手机号后再解除'
    }
  }

  if (bindingType === 'AUTO_MANUAL') {
    return {
      allowed: true,
      confirmText: '移除人工绑定后将保留自动绑定'
    }
  }

  return {
    allowed: true,
    confirmText: '确认解除人工绑定关系吗？'
  }
}

export function bindingTypeLabel(bindingType) {
  return (
    {
      AUTO: '自动绑定',
      MANUAL: '人工绑定',
      AUTO_MANUAL: '自动 + 人工'
    }[bindingType] || '-'
  )
}
