import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describeFollowUpAction } from './ai-hub-actions'

const currentDir = dirname(fileURLToPath(import.meta.url))

describe('AI hub actions', () => {
  it('describes a concrete follow-up action from the backend AI alert route', () => {
    const action = describeFollowUpAction({
      title: '学员 王小明 爆发力显著提升',
      desc: 'DeepSeek：王小明爆发力提升，建议更新训练计划。',
      suggestedAction: '已为你打开学员管理并填入姓名，先核对学员档案与近期训练记录。',
      routeName: 'students',
      routeQuery: { name: '王小明' }
    })

    expect(action.title).toContain('王小明')
    expect(action.message).toContain('DeepSeek')
    expect(action.message).toContain('先核对学员档案')
    expect(action.route).toEqual({ name: 'students', query: { name: '王小明' } })
    expect(action.confirmText).toBe('去处理')
  })

  it('wires the visible buttons to backend API-driven handlers', () => {
    const source = readFileSync(join(currentDir, 'AiAnalysisHub.vue'), 'utf8')

    expect(source).toContain('@click="handleGenerateMonthlyReport"')
    expect(source).toContain('@click="handleFollowUp(item)"')
    expect(source).toContain('getAiHubOverview')
    expect(source).toContain('generateMonthlySchoolReport')
    expect(source).toContain('数据规则')
    expect(source).not.toContain('buildMonthlyAnalysisReport')
  })
})
