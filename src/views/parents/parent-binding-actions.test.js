import { describe, expect, it } from 'vitest'
import { describeUnbindAction } from './parent-binding-actions'

describe('describeUnbindAction', () => {
  it('blocks direct unbind for AUTO relations', () => {
    expect(describeUnbindAction('AUTO')).toEqual({
      allowed: false,
      confirmText: '该关系由学员监护人手机号自动生成，请修改学员档案中的监护人手机号后再解除'
    })
  })

  it('downgrades AUTO_MANUAL relations instead of deleting them', () => {
    expect(describeUnbindAction('AUTO_MANUAL')).toEqual({
      allowed: true,
      confirmText: '移除人工绑定后将保留自动绑定'
    })
  })
})
