<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <h2 class="page-title">数据概览</h2>
      <p class="subtitle">欢迎回来，这是您今天的教务运营摘要。</p>
    </div>

    <!-- Top Statistics Grid -->
    <div class="stats-grid">
      <div class="stat-card-modern">
        <div class="stat-icon blue"><el-icon><User /></el-icon></div>
        <div class="stat-content">
          <div class="stat-label">学员总数</div>
          <div class="stat-value">{{ stats.students?.total ?? '-' }}</div>
          <div class="stat-footer">
            <span class="trend positive">在读 {{ stats.students?.active ?? 0 }}</span>
            <span class="divider"></span>
            <span class="muted">休学 {{ stats.students?.inactive ?? 0 }}</span>
          </div>
        </div>
      </div>
      <div class="stat-card-modern">
        <div class="stat-icon purple"><el-icon><Calendar /></el-icon></div>
        <div class="stat-content">
          <div class="stat-label">进行中课程</div>
          <div class="stat-value">{{ stats.courses?.ongoing ?? '-' }}</div>
          <div class="stat-footer">
            <span class="muted">总计 {{ stats.courses?.total ?? 0 }} 门</span>
          </div>
        </div>
      </div>
      <div class="stat-card-modern">
        <div class="stat-icon amber"><el-icon><Monitor /></el-icon></div>
        <div class="stat-content">
          <div class="stat-label">教练在职</div>
          <div class="stat-value">{{ stats.coaches?.active ?? '-' }}</div>
          <div class="stat-footer">
            <span class="muted">全校共 {{ stats.coaches?.total ?? 0 }} 名</span>
          </div>
        </div>
      </div>
      <div class="stat-card-modern">
        <div class="stat-icon green"><el-icon><Checked /></el-icon></div>
        <div class="stat-content">
          <div class="stat-label">本月出勤率</div>
          <div class="stat-value">{{ attendanceRateText }}</div>
          <div class="stat-footer">
            <span class="muted">累计 {{ stats.attendance?.thisMonthTotal ?? 0 }} 次考勤</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content: 2:1 Split -->
    <el-row :gutter="24" class="dashboard-main">
      <!-- Left: Depth Analytics (2/3) -->
      <el-col :lg="16" :md="24">
        <el-card shadow="never" class="chart-card mb-24">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">近7天考勤趋势</span>
              <el-tag size="small" type="info" plain>实时更新</el-tag>
            </div>
          </template>
          <div ref="attendanceChartRef" style="height: 320px" />
        </el-card>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="card-title">学员状态分布</span></template>
              <div ref="studentPieRef" style="height: 240px" />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="card-title">教练工作量排行</span></template>
              <div ref="coachBarRef" style="height: 240px" />
            </el-card>
          </el-col>
        </el-row>
      </el-col>

      <!-- Right: Alerts & Feed (1/3) -->
      <el-col :lg="8" :md="24">
        <el-card shadow="never" class="feed-card">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">待处理预警</span>
              <el-badge :value="careAlerts.length" :hidden="careAlerts.length === 0" type="danger" />
            </div>
          </template>
          
          <div v-loading="careAlertLoading" class="alert-feed">
            <el-empty v-if="careAlerts.length === 0" description="暂无待处理的事项" :image-size="80" />
            <div v-else class="feed-list">
              <div v-for="alert in careAlerts" :key="alert.id" class="feed-item">
                <div class="feed-marker" :class="{ 'urgent': true }"></div>
                <div class="feed-body">
                  <div class="feed-header">
                    <span class="feed-type">{{ alert.alertTitle }}</span>
                    <span class="feed-time">{{ formatDateTime(alert.triggeredAt) }}</span>
                  </div>
                  <div class="feed-student">{{ alert.studentName || '未知学员' }}</div>
                  <p class="feed-content">{{ alert.alertContent }}</p>
                  <div class="feed-actions">
                    <el-button link type="primary" size="small" @click="goStudentProfile(alert.studentId)">查看</el-button>
                    <el-button link type="success" size="small" @click="handleResolveAlert(alert.id)">已处理</el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="careAlerts.length > 0" class="feed-footer">
              <el-button link type="info" @click="router.push('/students')">查看全部提醒</el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="chart-card mt-24">
          <template #header><span class="card-title">课程状态分布</span></template>
          <div ref="coursePieRef" style="height: 220px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Calendar, Monitor, Checked } from '@element-plus/icons-vue'
import { getDashboardStats, getCoachWorkload } from '../api/modules/statistics'
import { listCareAlerts, resolveCareAlert } from '../api/modules/students'
import { useChart } from '../composables/useChart'

const router = useRouter()
const stats = ref({})
const attendanceOption = ref(null)
const studentPieOption = ref(null)
const coursePieOption = ref(null)
const coachBarOption = ref(null)
const careAlerts = ref([])
const careAlertLoading = ref(false)

const attendanceChartRef = ref(null)
const studentPieRef = ref(null)
const coursePieRef = ref(null)
const coachBarRef = ref(null)

useChart(attendanceChartRef, attendanceOption)
useChart(studentPieRef, studentPieOption)
useChart(coursePieRef, coursePieOption)
useChart(coachBarRef, coachBarOption)

const attendanceRateText = computed(() => {
  const rate = stats.value.attendance?.thisMonthRate
  return rate != null ? `${(rate * 100).toFixed(1)}%` : '-'
})

function showRequestError(error, fallbackMessage) {
  const message = error?.response?.data?.message || error?.userMessage || fallbackMessage
  if (!error?.globalMessageHandled || error?.response?.data?.message) {
    ElMessage.error(message)
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  const now = new Date()
  const diff = now - date
  if (diff < 3600000) return '刚刚'
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return value.replace('T', ' ').slice(5, 16)
}

function goStudentProfile(studentId) {
  if (!studentId) return
  router.push({ name: 'student-profile', params: { id: studentId } })
}

async function loadCareAlerts() {
  careAlertLoading.value = true
  try {
    careAlerts.value = await listCareAlerts({ status: 'OPEN', limit: 5 })
  } catch (error) {
    showRequestError(error, '加载关怀提醒失败')
  } finally {
    careAlertLoading.value = false
  }
}

async function handleResolveAlert(alertId) {
  try {
    await ElMessageBox.confirm('确定已处理该事项吗？处理后将不再在首页展示。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    await resolveCareAlert(alertId)
    ElMessage.success('已标记为处理完成')
    await loadCareAlerts()
  } catch (error) {
    if (error !== 'cancel') {
      showRequestError(error, '操作失败')
    }
  }
}

onMounted(async () => {
  try {
    const [dashData, workload] = await Promise.all([getDashboardStats(), getCoachWorkload()])
    const attendance = dashData?.attendance || {}
    const days = Array.isArray(attendance.last7Days) ? attendance.last7Days : []
    const students = dashData?.students || {}
    const courses = dashData?.courses || {}
    const coachList = Array.isArray(workload) ? workload : []

    stats.value = dashData || {}

    // Refined Attendance Area Chart
    attendanceOption.value = {
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' }
      },
      legend: { bottom: 10, icon: 'circle' },
      grid: { top: 30, left: 40, right: 20, bottom: 60 },
      xAxis: { 
        type: 'category', 
        data: days.map((item) => String(item.date || '').slice(5)),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: { 
        type: 'value', 
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      series: [
        { 
          name: '出勤人数', 
          type: 'line', 
          smooth: true, 
          showSymbol: false,
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.2)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }]
            }
          },
          lineStyle: { width: 3, color: '#3b82f6' },
          data: days.map((item) => item.present || 0) 
        },
        { 
          name: '应到人数', 
          type: 'line', 
          smooth: true, 
          showSymbol: false,
          lineStyle: { width: 2, type: 'dashed', color: '#94a3b8' },
          data: days.map((item) => item.total || 0) 
        }
      ]
    }

    // Modern Doughnut for Students
    studentPieOption.value = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10 },
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: [
            { name: '在读', value: students.active || 0, itemStyle: { color: '#3b82f6' } },
            { name: '休学', value: students.inactive || 0, itemStyle: { color: '#94a3b8' } }
          ]
        }
      ]
    }

    // Course Status Distribution
    coursePieOption.value = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, itemWidth: 8, itemHeight: 8 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          itemStyle: { borderRadius: 6 },
          label: { show: false },
          data: [
            { name: '待开课', value: courses.planned || 0, itemStyle: { color: '#6366f1' } },
            { name: '进行中', value: courses.ongoing || 0, itemStyle: { color: '#3b82f6' } },
            { name: '已完成', value: courses.completed || 0, itemStyle: { color: '#10b981' } },
            { name: '已取消', value: courses.cancelled || 0, itemStyle: { color: '#f43f5e' } }
          ].filter((item) => item.value > 0)
        }
      ]
    }

    // Coach Workload Bar Chart
    coachBarOption.value = {
      tooltip: { trigger: 'axis' },
      grid: { top: 20, left: 40, right: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: coachList.map((item) => item.coachName),
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: { 
        type: 'value', 
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      series: [
        { 
          name: '课程数', 
          type: 'bar', 
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#3b82f6' },
          barWidth: '30%',
          data: coachList.map((item) => item.courseCount || 0) 
        }
      ]
    }
  } catch (error) {
    showRequestError(error, '加载统计数据失败')
  }

  await loadCareAlerts()
})
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 8px 0;
}

.welcome-section {
  margin-bottom: 32px;
  .page-title { margin-bottom: 4px; }
  .subtitle { color: var(--color-muted); font-size: 14px; }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card-modern {
  background: #fff;
  padding: 24px;
  border-radius: var(--border-radius);
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-card-shadow);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--admin-card-hover-shadow);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    
    &.blue { background: #eff6ff; color: #3b82f6; }
    &.purple { background: #f5f3ff; color: #8b5cf6; }
    &.amber { background: #fffbeb; color: #f59e0b; }
    &.green { background: #ecfdf5; color: #10b981; }
  }

  .stat-label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; margin: 4px 0; }
  .stat-footer { 
    font-size: 12px; display: flex; align-items: center; gap: 8px;
    .trend { font-weight: 700; &.positive { color: #10b981; } }
    .divider { width: 1px; height: 10px; background: #e2e8f0; }
    .muted { color: #94a3b8; }
  }
}

.dashboard-main {
  .mb-24 { margin-bottom: 24px; }
  .mt-24 { margin-top: 24px; }
}

.card-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; width: 100%; }

.alert-feed {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.feed-list { flex: 1; }

.feed-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
  &:last-child { border-bottom: none; }

  .feed-marker {
    width: 4px;
    height: 40px;
    border-radius: 2px;
    background: #e2e8f0;
    flex-shrink: 0;
    &.urgent { background: #f43f5e; }
  }

  .feed-body { flex: 1; min-width: 0; }
  .feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .feed-type { font-size: 14px; font-weight: 700; color: #1e293b; }
  .feed-time { font-size: 11px; color: #94a3b8; }
  .feed-student { font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 4px; }
  .feed-content { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 10px; }
  .feed-actions { display: flex; gap: 12px; }
}

.feed-footer { padding-top: 16px; text-align: center; border-top: 1px solid #f1f5f9; }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>

