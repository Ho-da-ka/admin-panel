<template>
  <div class="page-panel">
    <el-page-header @back="router.back()" style="margin-bottom: 24px">
      <template #content>{{ profile.student?.name ?? '学员档案' }}</template>
    </el-page-header>

    <!-- AI Insights Section -->
    <AiStudentInsights :student-id="id" />

    <el-row :gutter="24" style="margin-bottom: 24px" v-loading="loading">
      <!-- 基本信息 -->
      <el-col :span="12">
        <el-card shadow="never" header="基本信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="学号">{{ profile.student?.studentNo }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ profile.student?.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ profile.student?.gender === 'MALE' ? '男' : '女' }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">{{ profile.student?.birthDate }}</el-descriptions-item>
            <el-descriptions-item label="监护人">{{ profile.student?.guardianName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ profile.student?.guardianPhone }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ profile.student?.status === 'ACTIVE' ? '在读' : '休学' }}</el-descriptions-item>
            <el-descriptions-item label="阶段目标">{{ profile.student?.goalFocus || '-' }}</el-descriptions-item>
            <el-descriptions-item label="训练标签">{{ profile.student?.trainingTags || '-' }}</el-descriptions-item>
            <el-descriptions-item label="风险提示">{{ profile.student?.riskNotes || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目标周期">{{ goalPeriodText }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 统计概览 -->
      <el-col :span="12">
        <el-card shadow="never" header="统计概览">
          <el-row :gutter="12">
            <el-col :span="12"><div class="stat-label">累计上课</div><div class="stat-value">{{ profile.stats?.attendanceTotal ?? '-' }}</div></el-col>
            <el-col :span="12"><div class="stat-label">出勤率</div><div class="stat-value">{{ attendanceRateText }}</div></el-col>
            <el-col :span="12" style="margin-top:16px"><div class="stat-label">体测次数</div><div class="stat-value">{{ profile.stats?.fitnessTestCount ?? '-' }}</div></el-col>
            <el-col :span="12" style="margin-top:16px"><div class="stat-label">训练记录</div><div class="stat-value">{{ profile.stats?.trainingRecordCount ?? '-' }}</div></el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <!-- 考勤 Tab -->
      <el-tab-pane label="考勤记录" name="attendance">
        <el-row :gutter="16" style="margin-bottom: 16px">
          <el-col :span="12"><el-card shadow="never" header="月度出勤率趋势"><div ref="attendanceLineRef" style="height:220px" /></el-card></el-col>
          <el-col :span="12"><el-card shadow="never" header="考勤状态分布"><div ref="attendancePieRef" style="height:220px" /></el-card></el-col>
        </el-row>
        <el-table :data="attendanceRows" v-loading="attendanceLoading" stripe>
          <el-table-column prop="courseName" label="课程" min-width="160" />
          <el-table-column prop="attendanceDate" label="日期" width="130" />
          <el-table-column label="状态" width="100"><template #default="s">{{ statusText(s.row.status) }}</template></el-table-column>
          <el-table-column prop="note" label="备注" min-width="160" />
        </el-table>
        <el-pagination v-model:current-page="attendancePage" v-model:page-size="attendanceSize" :total="attendanceTotal"
          layout="total, prev, pager, next" style="margin-top:12px" @current-change="loadAttendance" @size-change="loadAttendance" />
      </el-tab-pane>

      <!-- 体测 Tab -->
      <el-tab-pane label="体测记录" name="fitness">
        <el-card shadow="never" header="体测趋势" style="margin-bottom:16px">
          <div ref="fitnessLineRef" style="height:240px" />
        </el-card>
        <el-table :data="fitnessRows" v-loading="fitnessLoading" stripe>
          <el-table-column prop="testDate" label="日期" width="130" />
          <el-table-column prop="itemName" label="项目" width="140" />
          <el-table-column prop="testValue" label="数值" width="100" />
          <el-table-column prop="unit" label="单位" width="100" />
          <el-table-column prop="comment" label="评语" min-width="180" />
        </el-table>
        <el-pagination v-model:current-page="fitnessPage" v-model:page-size="fitnessSize" :total="fitnessTotal"
          layout="total, prev, pager, next" style="margin-top:12px" @current-change="loadFitness" @size-change="loadFitness" />
      </el-tab-pane>

      <!-- 训练 Tab -->
      <el-tab-pane label="训练记录" name="training">
        <el-table :data="trainingRows" v-loading="trainingLoading" stripe>
          <el-table-column prop="courseName" label="课程" min-width="150" />
          <el-table-column prop="trainingDate" label="日期" width="130" />
          <el-table-column prop="durationMinutes" label="时长(分)" width="100" />
          <el-table-column prop="intensityLevel" label="强度" width="100" />
          <el-table-column prop="trainingContent" label="内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="highlightNote" label="课堂亮点" min-width="160" show-overflow-tooltip />
          <el-table-column prop="improvementNote" label="待改进点" min-width="160" show-overflow-tooltip />
          <el-table-column prop="parentAction" label="家长配合" min-width="160" show-overflow-tooltip />
          <el-table-column prop="nextStepSuggestion" label="下次建议" min-width="160" show-overflow-tooltip />
          <el-table-column prop="aiSummary" label="家长摘要" min-width="180" show-overflow-tooltip />
          <el-table-column prop="coachComment" label="教练评语" min-width="180" show-overflow-tooltip />
        </el-table>
        <el-pagination v-model:current-page="trainingPage" v-model:page-size="trainingSize" :total="trainingTotal"
          layout="total, prev, pager, next" style="margin-top:12px" @current-change="loadTraining" @size-change="loadTraining" />
      </el-tab-pane>
      <el-tab-pane label="关怀提醒" name="alerts">
        <div v-loading="careAlertsLoading">
          <el-empty v-if="careAlerts.length === 0" description="暂无待跟进的提醒" />
          <el-timeline v-else style="padding: 10px">
            <el-timeline-item
              v-for="alert in careAlerts"
              :key="alert.id"
              :timestamp="formatDateTime(alert.triggeredAt)"
              :type="alert.status === 'OPEN' ? 'danger' : 'success'"
            >
              <div class="alert-row">
                <div class="alert-info">
                  <div class="alert-title">{{ alert.alertTitle }}</div>
                  <div class="alert-content">{{ alert.alertContent }}</div>
                </div>
                <el-tag :type="alert.status === 'OPEN' ? 'danger' : 'success'" size="small" effect="light">
                  {{ alert.status === 'OPEN' ? '待跟进' : '已解除' }}
                </el-tag>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getStudentProfile, getStudentAttendanceStats, getStudentFitnessTrends, getStudentCareAlerts
} from '../../api/modules/students'
import { listAttendances } from '../../api/modules/attendance'
import { listFitnessTests } from '../../api/modules/fitness'
import { listTrainingRecords } from '../../api/modules/training'
import { useChart } from '../../composables/useChart'
import AiStudentInsights from '../../components/ai/AiStudentInsights.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const loading = ref(false)
const profile = ref({})
const activeTab = ref('attendance')

// Chart refs
const attendanceLineRef = ref(null)
const attendancePieRef = ref(null)
const fitnessLineRef = ref(null)
const attendanceLineOption = ref(null)
const attendancePieOption = ref(null)
const fitnessLineOption = ref(null)

useChart(attendanceLineRef, attendanceLineOption)
useChart(attendancePieRef, attendancePieOption)
useChart(fitnessLineRef, fitnessLineOption)

// Attendance tab
const attendanceRows = ref([])
const attendanceLoading = ref(false)
const attendancePage = ref(1)
const attendanceSize = ref(10)
const attendanceTotal = ref(0)

// Fitness tab
const fitnessRows = ref([])
const fitnessLoading = ref(false)
const fitnessPage = ref(1)
const fitnessSize = ref(10)
const fitnessTotal = ref(0)

// Training tab
const trainingRows = ref([])
const trainingLoading = ref(false)
const trainingPage = ref(1)
const trainingSize = ref(10)
const trainingTotal = ref(0)

const careAlerts = ref([])
const careAlertsLoading = ref(false)

const attendanceRateText = computed(() => {
  const r = profile.value.stats?.attendanceRate
  return r != null ? (r * 100).toFixed(1) + '%' : '-'
})

const goalPeriodText = computed(() => {
  const student = profile.value.student || {}
  if (!student.goalStartDate && !student.goalEndDate) return '-'
  return `${student.goalStartDate || '-'} ~ ${student.goalEndDate || '-'}`
})

function statusText(v) {
  return { PRESENT: '出勤', LATE: '迟到', ABSENT: '缺勤', LEAVE: '请假' }[v] || '-'
}

async function loadAttendance() {
  attendanceLoading.value = true
  try {
    const data = await listAttendances({ studentId: id, page: attendancePage.value - 1, size: attendanceSize.value })
    attendanceRows.value = data.content
    attendanceTotal.value = data.totalElements
  } catch (e) { ElMessage.error(e.message) } finally { attendanceLoading.value = false }
}

async function loadFitness() {
  fitnessLoading.value = true
  try {
    const data = await listFitnessTests({ studentId: id, page: fitnessPage.value - 1, size: fitnessSize.value })
    fitnessRows.value = data.content
    fitnessTotal.value = data.totalElements
  } catch (e) { ElMessage.error(e.message) } finally { fitnessLoading.value = false }
}

async function loadTraining() {
  trainingLoading.value = true
  try {
    const data = await listTrainingRecords({ studentId: id, page: trainingPage.value - 1, size: trainingSize.value })
    trainingRows.value = data.content
    trainingTotal.value = data.totalElements
  } catch (e) { ElMessage.error(e.message) } finally { trainingLoading.value = false }
}

async function loadCareAlerts() {
  careAlertsLoading.value = true
  try {
    careAlerts.value = await getStudentCareAlerts(id)
  } catch (e) { ElMessage.error(e.message) } finally { careAlertsLoading.value = false }
}

function formatDateTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-'
}

onMounted(async () => {
  loading.value = true
  try {
    const [profileData, attendanceStats, fitnessTrends] = await Promise.all([
      getStudentProfile(id),
      getStudentAttendanceStats(id),
      getStudentFitnessTrends(id)
    ])
    profile.value = profileData

    // Attendance line chart
    attendanceLineOption.value = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: attendanceStats.map(s => s.month) },
      yAxis: { type: 'value', max: 1, axisLabel: { formatter: v => (v * 100).toFixed(0) + '%' } },
      series: [{ name: '出勤率', type: 'line', smooth: true, data: attendanceStats.map(s => s.rate) }]
    }

    // Attendance pie chart
    const present = profileData.stats?.attendancePresent ?? 0
    const total = profileData.stats?.attendanceTotal ?? 0
    attendancePieOption.value = {
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: '60%', data: [
        { name: '出勤', value: present },
        { name: '缺勤/请假', value: total - present }
      ].filter(d => d.value > 0) }]
    }

    // Fitness trends line chart
    if (fitnessTrends.length > 0) {
      fitnessLineOption.value = {
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0 },
        xAxis: { type: 'category', data: [...new Set(fitnessTrends.flatMap(t => t.records.map(r => r.testDate)))].sort() },
        yAxis: { type: 'value' },
        series: fitnessTrends.slice(0, 5).map(t => ({
          name: t.testItem + '(' + t.unit + ')',
          type: 'line', smooth: true,
          data: t.records.map(r => [r.testDate, r.value])
        }))
      }
    }
  } catch (e) { ElMessage.error(e.message) } finally { loading.value = false }

  await Promise.all([loadAttendance(), loadFitness(), loadTraining(), loadCareAlerts()])
})
</script>

<style scoped>
.stat-label { font-size: 13px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 600; color: #303133; }
.alert-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.alert-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.alert-content { font-size: 13px; color: #606266; line-height: 1.6; }
</style>
