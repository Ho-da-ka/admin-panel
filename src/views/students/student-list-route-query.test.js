import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

describe('student list route query follow-up', () => {
  it('uses the route name query as the initial student search', () => {
    const source = readFileSync(join(currentDir, 'StudentListView.vue'), 'utf8')

    expect(source).toContain('useRoute')
    expect(source).toContain('route.query.name')
    expect(source).toContain('applyRouteQuery')
  })
})
