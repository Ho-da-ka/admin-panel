<template>
  <div class="ai-hub-container">
    <div class="hub-header">
      <div class="header-content">
        <h2 class="page-title">AI 智慧分析中心</h2>
        <p class="subtitle">接入 DeepSeek 引擎，基于真实训练、体测与评估数据生成深度洞察</p>
      </div>
      <el-button
        type="primary"
        size="large"
        class="ai-premium-btn"
        :loading="reportGenerating"
        @click="handleGenerateMonthlyReport"
      >
        <el-icon><DocumentChecked /></el-icon> <span>生成全校月度分析报告</span>
      </el-button>
    </div>

    <el-row :gutter="24">
      <!-- Left: Analytics & Charts -->
      <el-col :lg="16" :md="24">
        <div v-loading="overviewLoading" class="ai-metrics-grid">
          <div v-for="metric in metrics" :key="metric.key" class="ai-stat-card" :class="metric.accent || 'blue'">
            <div class="stat-label">{{ metric.label }}</div>
            <div class="stat-value">{{ metric.value }} <span class="unit">{{ metric.unit }}</span></div>
            <div class="stat-footer">{{ metric.footer }}</div>
          </div>
        </div>

        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">多维能力模型分析（全校聚合）</span>
              <el-tag size="small" type="success" plain>DeepSeek 实时计算</el-tag>
            </div>
          </template>
          <div ref="radarRef" style="height: 420px" />
        </el-card>
      </el-col>

      <!-- Right: AI Discoveries Feed -->
      <el-col :lg="8" :md="24">
        <el-card shadow="never" class="alert-feed-card">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">AI 实时成长发现</span>
              <el-tag size="small" :type="hasDeepSeekAlert ? 'success' : 'info'" effect="dark">
                {{ alerts.length }} 条情报
              </el-tag>
            </div>
          </template>

          <div v-loading="overviewLoading" class="ai-alert-list">
            <el-empty v-if="!overviewLoading && alerts.length === 0" description="暂无可跟进的成长发现" :image-size="80" />
            <div v-else class="ai-feed-list">
              <div v-for="item in alerts" :key="item.id" class="ai-feed-item">
                <div class="feed-marker" :class="item.type || 'low'"></div>
                <div class="feed-body">
                  <div class="feed-header">
                    <span class="feed-type">{{ item.title }}</span>
                    <el-tag size="small" :type="item.generatedByAi ? 'success' : 'info'" plain>
                      {{ item.generatedByAi ? 'DeepSeek' : '数据规则' }}
                    </el-tag>
                  </div>
                  <p class="feed-desc">{{ item.desc }}</p>
                  <div class="feed-footer">
                    <el-button link type="primary" size="small" @click="handleFollowUp(item)">立即跟进</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Report Dialog -->
    <el-dialog v-model="reportVisible" width="760px" class="ai-report-dialog" destroy-on-close>
      <template #header>
        <div class="dialog-header-flex">
          <span class="dialog-title">全校月度分析报告</span>
          <el-tag :type="reportGeneratedByAi ? 'success' : 'info'" effect="dark">
            {{ reportGeneratedByAi ? 'DeepSeek 深度生成' : '数据汇总' }}
          </el-tag>
        </div>
      </template>
      <div class="report-content-wrapper">
        <pre class="monthly-report-text">{{ monthlyReport }}</pre>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="reportVisible = false">确认并归档</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentChecked } from '@element-plus/icons-vue'
import { useChart } from '../../composables/useChart'
import { generateMonthlySchoolReport, getAiHubOverview } from '../../api/modules/ai'
import { describeFollowUpAction } from './ai-hub-actions'

const router = useRouter()
const radarRef = ref(null)
const radarOption = ref(null)
const overviewLoading = ref(false)
const reportGenerating = ref(false)
const reportVisible = ref(false)
const reportGeneratedByAi = ref(false)
const monthlyReport = ref('')
const metrics = ref([])
const alerts = ref([])
useChart(radarRef, radarOption)

const hasDeepSeekAlert = computed(() => alerts.value.some((item) => item.generatedByAi))

async function loadHubOverview() {
  overviewLoading.value = true
  try {
    const data = await getAiHubOverview()
    metrics.value = data.metrics || []
    alerts.value = data.alerts || []
    radarOption.value = buildRadarOption(data.radarDimensions || [])
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载 AI 智慧中心失败')
  } finally {
    overviewLoading.value = false
  }
}

async function handleGenerateMonthlyReport() {
  reportGenerating.value = true
  try {
    const data = await generateMonthlySchoolReport()
    monthlyReport.value = data.report || '暂无报告内容'
    reportGeneratedByAi.value = Boolean(data.generatedByAi)
    reportVisible.value = true
    if (data.generatedByAi) {
      ElMessage.success('DeepSeek 已成功生成全校深度分析报告')
    } else {
      ElMessage.warning('已基于真实数据规则生成月度汇总报告')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '报告生成失败')
  } finally {
    reportGenerating.value = false
  }
}

async function handleFollowUp(item) {
  const action = describeFollowUpAction(item)
  try {
    await ElMessageBox.confirm(action.message, action.title, {
      type: item.generatedByAi ? 'success' : 'warning',
      confirmButtonText: action.confirmText,
      cancelButtonText: '稍后处理',
      buttonSize: 'default'
    })
    if (action.route) {
      await router.push(action.route)
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '无法打开跟进入口')
  }
}

function buildRadarOption(dimensions) {
  const values = dimensions.length > 0
    ? dimensions
    : [
        { name: '爆发力', value: 0 },
        { name: '耐力', value: 0 },
        { name: '协调性', value: 0 },
        { name: '柔韧性', value: 0 },
        { name: '核心力量', value: 0 }
      ]

  return {
    radar: {
      indicator: values.map((item) => ({ name: item.name, max: 100, color: '#64748b' })),
      shape: 'circle',
      splitArea: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [{
      name: '体测记录覆盖',
      type: 'radar',
      data: [
        {
          value: values.map((item) => Number(item.value || 0)),
          name: '本月记录覆盖',
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(99, 102, 241, 0.2)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.4)' }]
            }
          },
          lineStyle: { width: 3, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' }
        }
      ]
    }]
  }
}

onMounted(() => {
  radarOption.value = buildRadarOption([])
  loadHubOverview()
})
</script>

<style scoped lang="scss">
.ai-hub-container {
  padding: 8px 0;
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  .subtitle { color: var(--color-muted); font-size: 14px; margin-top: 4px; }
}

.ai-premium-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  height: 48px;
  padding: 0 28px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
  transition: all 0.3s ease;
  
  &:hover { 
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
  }
}

.ai-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.ai-stat-card {
  background: #fff;
  border-radius: var(--border-radius);
  padding: 24px;
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-card-shadow);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
  }

  &.purple::before { background: var(--admin-purple); }
  &.blue::before { background: var(--admin-primary); }
  &.amber::before { background: #f59e0b; }
}

.stat-label { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; }
.stat-value { font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px; .unit { font-size: 14px; color: #64748b; font-weight: 400; } }
.stat-footer { font-size: 12px; color: #10b981; font-weight: 600; }

.card-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; width: 100%; }

.ai-alert-list { min-height: 400px; }

.ai-feed-list { display: flex; flex-direction: column; gap: 20px; }

.ai-feed-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;

  &:hover { border-color: #e2e8f0; background-color: #f1f5f9; }

  .feed-marker {
    width: 4px;
    height: 36px;
    border-radius: 2px;
    flex-shrink: 0;
    &.high { background: #f43f5e; }
    &.medium { background: #f59e0b; }
    &.low { background: #10b981; }
  }

  .feed-body { flex: 1; min-width: 0; }
  .feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .feed-type { font-size: 14px; font-weight: 700; color: #1e293b; }
  .feed-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 12px; }
  .feed-footer { display: flex; justify-content: flex-end; }
}

.ai-report-dialog {
  :deep(.el-dialog__body) { padding: 0 !important; }
}

.dialog-header-flex { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-right: 32px; .dialog-title { font-size: 18px; font-weight: 700; color: #0f172a; } }

.report-content-wrapper { padding: 32px; background-color: #fff; }

.monthly-report-text {
  max-height: 500px;
  overflow: auto;
  margin: 0;
  padding: 24px;
  border-radius: 12px;
  background: #f8fafc;
  color: #1e293b;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
  border: 1px solid #e2e8f0;
}
</style>

