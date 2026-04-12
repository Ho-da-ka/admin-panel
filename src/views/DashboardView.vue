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

    <el-row :gutter="16">
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboardStats, getCoachWorkload } from '../api/modules/statistics'
import { useChart } from '../composables/useChart'

const stats = ref({})
const attendanceOption = ref(null)
const studentPieOption = ref(null)
const coursePieOption = ref(null)
const coachBarOption = ref(null)

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
  return rate != null ? (rate * 100).toFixed(1) + '%' : '-'
})

onMounted(async () => {
  try {
    const [dashData, workload] = await Promise.all([getDashboardStats(), getCoachWorkload()])
    stats.value = dashData

    const days = dashData.attendance.last7Days
    attendanceOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: { type: 'category', data: days.map(d => d.date.slice(5)) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        { name: '出勤', type: 'line', smooth: true, data: days.map(d => d.present) },
        { name: '总计', type: 'line', smooth: true, lineStyle: { type: 'dashed' }, data: days.map(d => d.total) }
      ]
    }

    const s = dashData.students
    studentPieOption.value = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{ type: 'pie', radius: '60%', data: [{ name: '在读', value: s.active }, { name: '休学', value: s.inactive }] }]
    }

    const c = dashData.courses
    coursePieOption.value = {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: '60%',
        data: [
          { name: '待开课', value: c.planned }, { name: '进行中', value: c.ongoing },
          { name: '已完成', value: c.completed }, { name: '已取消', value: c.cancelled }
        ].filter(d => d.value > 0)
      }]
    }

    coachBarOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: { type: 'category', data: workload.map(w => w.coachName), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        { name: '课程数', type: 'bar', data: workload.map(w => w.courseCount) },
        { name: '训练记录', type: 'bar', data: workload.map(w => w.trainingCount) }
      ]
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载统计数据失败')
  }
})
</script>

<style scoped>
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 600; color: #303133; }
.stat-sub { font-size: 12px; color: #c0c4cc; margin-top: 4px; }
</style>
