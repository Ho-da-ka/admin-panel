<template>
  <div class="page-panel">
    <h2 class="page-title">数据概览</h2>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">学员总数</div>
          <div class="stat-value">{{ stats.students?.total ?? '-' }}</div>
          <div class="stat-sub">在读 {{ stats.students?.active ?? 0 }} / 休学 {{ stats.students?.inactive ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">课程总数</div>
          <div class="stat-value">{{ stats.courses?.total ?? '-' }}</div>
          <div class="stat-sub">进行中 {{ stats.courses?.ongoing ?? 0 }} / 已完成 {{ stats.courses?.completed ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">教练总数</div>
          <div class="stat-value">{{ stats.coaches?.total ?? '-' }}</div>
          <div class="stat-sub">在职 {{ stats.coaches?.active ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">本月出勤率</div>
          <div class="stat-value">{{ attendanceRateText }}</div>
          <div class="stat-sub">本月考勤 {{ stats.attendance?.thisMonthTotal ?? 0 }} 次</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card shadow="never" header="近7天考勤趋势">
          <div ref="attendanceChartRef" style="height: 260px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="学员状态分布">
          <div ref="studentPieRef" style="height: 260px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card shadow="never" header="课程状态分布">
          <div ref="coursePieRef" style="height: 260px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="教练工作量排行">
          <div ref="coachBarRef" style="height: 260px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-card shadow="never" header="待跟进关怀提醒">
          <div v-loading="careAlertLoading">
            <el-empty v-if="careAlerts.length === 0" description="暂无待跟进的关怀提醒" />
            <div v-else class="alert-list">
              <div v-for="alert in careAlerts" :key="alert.id" class="alert-item">
                <div class="alert-main">
                  <div class="alert-title-row">
                    <div class="alert-title">{{ alert.alertTitle }}</div>
                    <el-tag type="danger" size="small">待跟进</el-tag>
                  </div>
                  <div class="alert-student">{{ alert.studentName || `学员ID ${alert.studentId}` }}</div>
                  <div class="alert-content">{{ alert.alertContent }}</div>
                  <div class="alert-meta">{{ formatDateTime(alert.triggeredAt) }}</div>
                </div>
                <div class="alert-actions">
                  <el-button link type="primary" @click="goStudentProfile(alert.studentId)">查看学员</el-button>
                  <el-button link type="success" @click="handleResolveAlert(alert.id)">标记已处理</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-'
}

function goStudentProfile(studentId) {
  if (!studentId) return
  router.push({ name: 'student-profile', params: { id: studentId } })
}

async function loadCareAlerts() {
  careAlertLoading.value = true
  try {
    careAlerts.value = await listCareAlerts({ status: 'OPEN', limit: 6 })
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

    attendanceOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: { type: 'category', data: days.map((item) => String(item.date || '').slice(5)) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        { name: '出勤', type: 'line', smooth: true, data: days.map((item) => item.present || 0) },
        { name: '总计', type: 'line', smooth: true, lineStyle: { type: 'dashed' }, data: days.map((item) => item.total || 0) }
      ]
    }

    studentPieOption.value = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: [
            { name: '在读', value: students.active || 0 },
            { name: '休学', value: students.inactive || 0 }
          ]
        }
      ]
    }

    coursePieOption.value = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: [
            { name: '待开课', value: courses.planned || 0 },
            { name: '进行中', value: courses.ongoing || 0 },
            { name: '已完成', value: courses.completed || 0 },
            { name: '已取消', value: courses.cancelled || 0 }
          ].filter((item) => item.value > 0)
        }
      ]
    }

    coachBarOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: {
        type: 'category',
        data: coachList.map((item) => item.coachName),
        axisLabel: { rotate: 30 }
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        { name: '课程数', type: 'bar', data: coachList.map((item) => item.courseCount || 0) },
        { name: '训练记录', type: 'bar', data: coachList.map((item) => item.trainingCount || 0) }
      ]
    }
  } catch (error) {
    showRequestError(error, '加载统计数据失败')
  }

  await loadCareAlerts()
})
</script>

<style scoped>
.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.stat-sub {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 16px 20px;
  background-color: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.alert-item:hover {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
}

.alert-main {
  flex: 1;
  min-width: 0;
}

.alert-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.alert-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.alert-student {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 6px;
}

.alert-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.alert-meta {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}
</style>
