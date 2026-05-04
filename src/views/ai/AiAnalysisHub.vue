<template>
  <div class="page-panel">
    <div class="hub-header">
      <div>
        <h2 class="page-title">AI 智慧分析中心</h2>
        <p class="hub-subtitle">接入 DeepSeek，基于真实训练、体测、考勤与阶段评估数据生成洞察</p>
      </div>
      <el-button
        type="primary"
        size="large"
        class="premium-btn"
        :loading="reportGenerating"
        @click="handleGenerateMonthlyReport"
      >
        <el-icon><DocumentChecked /></el-icon> 生成全校月度分析报告
      </el-button>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <div v-loading="overviewLoading" class="info-grid" style="margin-bottom: 24px">
          <div v-for="metric in metrics" :key="metric.key" class="stat-card" :class="metric.accent || 'blue'">
            <div class="stat-label">{{ metric.label }}</div>
            <div class="stat-value">{{ metric.value }} <span class="unit">{{ metric.unit }}</span></div>
            <div class="stat-footer">{{ metric.footer }}</div>
          </div>
        </div>

        <el-card shadow="never">
          <template #header>
            <div class="chart-header">
              <span>近期体测维度覆盖（真实记录聚合）</span>
              <el-tag size="small" type="info">非静态演示数据</el-tag>
            </div>
          </template>
          <div ref="radarRef" style="height: 400px" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="alert-card">
          <template #header>
            <div class="alert-header">
              <span>AI 实时成长发现</span>
              <el-tag size="small" :type="hasDeepSeekAlert ? 'success' : 'info'" effect="dark">
                {{ alerts.length }} 个真实数据提醒
              </el-tag>
            </div>
          </template>

          <div v-loading="overviewLoading" class="alert-list">
            <div v-for="item in alerts" :key="item.id" class="alert-item">
              <div class="alert-dot" :class="item.type" />
              <div class="alert-content">
                <div class="alert-title-row">
                  <div class="alert-title">{{ item.title }}</div>
                  <el-tag size="small" :type="item.generatedByAi ? 'success' : 'info'">
                    {{ item.generatedByAi ? 'DeepSeek' : '数据规则' }}
                  </el-tag>
                </div>
                <p class="alert-desc">{{ item.desc }}</p>
                <el-button link type="primary" size="small" @click="handleFollowUp(item)">立即跟进</el-button>
              </div>
            </div>
            <el-empty v-if="!overviewLoading && alerts.length === 0" description="暂无可跟进的成长发现" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="reportVisible" width="720px">
      <template #header>
        <div class="dialog-header">
          <span>全校月度分析报告</span>
          <el-tag size="small" :type="reportGeneratedByAi ? 'success' : 'info'">
            {{ reportGeneratedByAi ? 'DeepSeek 生成' : '规则兜底' }}
          </el-tag>
        </div>
      </template>
      <pre class="monthly-report">{{ monthlyReport }}</pre>
      <template #footer>
        <el-button type="primary" @click="reportVisible = false">知道了</el-button>
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
      ElMessage.success('DeepSeek 已生成全校月度分析报告')
    } else {
      ElMessage.warning('AI 暂不可用，已展示真实数据规则兜底报告')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '生成月度报告失败')
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
      cancelButtonText: '稍后处理'
    })
    if (action.route) {
      await router.push(action.route)
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '打开跟进入口失败')
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
      indicator: values.map((item) => ({ name: item.name, max: 100 })),
      shape: 'circle'
    },
    series: [{
      name: '体测记录覆盖',
      type: 'radar',
      data: [
        {
          value: values.map((item) => Number(item.value || 0)),
          name: '本月记录覆盖',
          areaStyle: { color: 'rgba(59, 130, 246, 0.18)' },
          lineStyle: { color: '#3B82F6' }
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
.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.hub-subtitle {
  color: #64748b;
  font-size: 14px;
  margin-top: -12px;
}

.premium-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
  border: none;
  &:hover { opacity: 0.9; }
}

.chart-header,
.dialog-header,
.alert-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);

  &.purple { border-left: 6px solid #a855f7; }
  &.blue { border-left: 6px solid #3b82f6; }
  &.amber { border-left: 6px solid #f59e0b; }
}

.stat-label {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;

  .unit {
    font-size: 14px;
    color: #64748b;
  }
}

.stat-footer {
  font-size: 12px;
  color: #10b981;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 800;
}

.alert-list {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alert-item {
  display: flex;
  gap: 16px;
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin-top: 6px;
  flex-shrink: 0;

  &.high { background: #ef4444; }
  &.medium { background: #f59e0b; }
  &.low { background: #10b981; }
}

.alert-content {
  min-width: 0;
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 8px;
}

.monthly-report {
  max-height: 520px;
  overflow: auto;
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
