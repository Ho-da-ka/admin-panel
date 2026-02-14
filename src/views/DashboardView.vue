<template>
  <div class="page-panel">
    <h2 class="page-title">运行总览</h2>

    <div class="info-grid">
      <el-card>
        <template #header>服务状态</template>
        <div class="metric">
          <el-tag :type="pingData.status === 'UP' ? 'success' : 'danger'">{{ serviceStatusText }}</el-tag>
        </div>
      </el-card>

      <el-card>
        <template #header>学员总数</template>
        <div class="metric">{{ stats.studentTotal }}</div>
      </el-card>

      <el-card>
        <template #header>课程总数</template>
        <div class="metric">{{ stats.courseTotal }}</div>
      </el-card>

      <el-card>
        <template #header>服务器时间</template>
        <div class="metric-small">{{ pingData.time || '-' }}</div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { listCourses, listStudents, pingHealth } from '../api/modules'

const stats = reactive({
  studentTotal: 0,
  courseTotal: 0
})

const pingData = reactive({
  status: '',
  time: ''
})

const serviceStatusText = computed(() => {
  if (pingData.status === 'UP') return '运行中'
  if (!pingData.status) return '-'
  return '异常'
})

async function load() {
  try {
    const [ping, studentPage, coursePage] = await Promise.all([
      pingHealth(),
      listStudents({ page: 0, size: 1 }),
      listCourses({ page: 0, size: 1 })
    ])

    pingData.status = ping.status
    pingData.time = ping.time
    stats.studentTotal = studentPage.totalElements
    stats.courseTotal = coursePage.totalElements
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载仪表盘失败')
  }
}

onMounted(load)
</script>

<style scoped>
.metric {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.metric-small {
  font-size: 14px;
  line-height: 1.6;
}
</style>