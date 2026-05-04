import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

describe('useChart radar support', () => {
  it('registers the ECharts radar chart and component used by the AI hub', () => {
    const source = readFileSync(join(currentDir, 'useChart.js'), 'utf8')

    expect(source).toContain('RadarChart')
    expect(source).toContain('RadarComponent')
  })
})
