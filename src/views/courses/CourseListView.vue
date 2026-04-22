<template>
  <div class="page-panel">
    <h2 class="page-title">课程管理</h2>

    <div class="toolbar">
      <el-input
        v-model="query.name"
        placeholder="按课程名称搜索"
        style="max-width: 240px"
        clearable
        @keyup.enter="handleQuickSearch"
        @clear="handleQuickSearch"
      />
      <el-select v-model="query.status" placeholder="课程状态" clearable style="width: 180px" @change="handleQuickSearch">
        <el-option label="待开课" value="PLANNED" />
        <el-option label="进行中" value="ONGOING" />
        <el-option label="已结束" value="COMPLETED" />
        <el-option label="已取消" value="CANCELLED" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button v-if="isAdmin" type="success" @click="openCreate">新增课程</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="courseCode" label="课程编码" width="130" />
      <el-table-column prop="name" label="课程名称" min-width="180" />
      <el-table-column prop="courseType" label="课程类型" width="140" />
      <el-table-column prop="trainingTheme" label="训练主题" min-width="140" show-overflow-tooltip />
      <el-table-column prop="targetAgeRange" label="适用年龄段" width="120" />
      <el-table-column prop="coachName" label="教练" width="120" />
      <el-table-column prop="venue" label="场地" min-width="140" />
      <el-table-column prop="startTime" label="开始时间" width="180" />
      <el-table-column prop="durationMinutes" label="时长(分钟)" width="110" />
      <el-table-column label="报名/容量" width="120">
        <template #default="{ row }">{{ formatEnrollment(row) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">{{ courseStatusText(row.status) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="isAdmin" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="isAdmin" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无课程数据" />

    <div style="margin-top: 12px; display: flex; justify-content: flex-end">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :current-page="currentPage"
        :page-size="query.size"
        :page-sizes="[10, 20, 30]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog
      v-model="formVisible"
      :title="formMode === 'create' ? '新增课程' : '编辑课程'"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item v-if="formMode === 'create'" label="课程编码" required>
          <el-input v-model="form.courseCode" maxlength="32" />
        </el-form-item>
        <el-form-item label="课程名称" required>
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="课程类型" required>
          <el-input v-model="form.courseType" maxlength="64" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="训练主题">
              <el-input v-model="form.trainingTheme" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用年龄段">
              <el-input v-model="form.targetAgeRange" maxlength="32" placeholder="例如 7-9岁" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="目标方向">
          <el-input v-model="form.targetGoals" maxlength="255" type="textarea" show-word-limit />
        </el-form-item>
        <el-form-item label="训练重点">
          <el-input v-model="form.focusPoints" maxlength="255" type="textarea" show-word-limit />
        </el-form-item>
        <el-form-item label="教练姓名" required>
          <el-select
            v-model="form.coachName"
            filterable
            allow-create
            default-first-option
            placeholder="优先从教练库选择，也可手动输入"
            style="width: 100%"
          >
            <el-option
              v-for="item in coachOptions"
              :key="item.id"
              :label="coachOptionLabel(item)"
              :value="item.name"
            />
          </el-select>
          <div class="helper-text">建议先在“教练管理”中维护教练档案，再从列表中选择。</div>
        </el-form-item>
        <el-form-item label="场地" required>
          <el-input v-model="form.venue" maxlength="128" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <input
            v-model="form.startTime"
            class="native-field"
            type="datetime-local"
          >
        </el-form-item>
        <el-form-item label="时长（分钟）" required>
          <el-input-number v-model="form.durationMinutes" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number v-model="form.maxCapacity" :min="1" :step="1" style="width: 100%" placeholder="不填则不限" />
        </el-form-item>
        <el-form-item label="上课日期">
          <input
            v-model="form.courseDate"
            class="native-field"
            type="date"
          >
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <input
                v-model="form.classStartTime"
                class="native-field"
                type="time"
              >
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <input
                v-model="form.classEndTime"
                class="native-field"
                type="time"
              >
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待开课" value="PLANNED" />
            <el-option label="进行中" value="ONGOING" />
            <el-option label="已结束" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" maxlength="255" type="textarea" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelForm">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="课程详情" width="860px">
      <div v-loading="detailLoading">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
              <el-descriptions-item label="课程编码">{{ detail.courseCode }}</el-descriptions-item>
              <el-descriptions-item label="课程名称">{{ detail.name }}</el-descriptions-item>
              <el-descriptions-item label="课程类型">{{ detail.courseType }}</el-descriptions-item>
              <el-descriptions-item label="训练主题">{{ detail.trainingTheme || '-' }}</el-descriptions-item>
              <el-descriptions-item label="适用年龄段">{{ detail.targetAgeRange || '-' }}</el-descriptions-item>
              <el-descriptions-item label="教练">{{ detail.coachName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="场地">{{ detail.venue }}</el-descriptions-item>
              <el-descriptions-item label="开始时间">{{ detail.startTime }}</el-descriptions-item>
              <el-descriptions-item label="时长">{{ detail.durationMinutes }} 分钟</el-descriptions-item>
              <el-descriptions-item label="报名/容量">{{ formatEnrollment(detail) }}</el-descriptions-item>
              <el-descriptions-item label="上课日期">{{ detail.courseDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="时间段">{{ formatTimeRange(detail.classStartTime, detail.classEndTime) }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ courseStatusText(detail.status) }}</el-descriptions-item>
              <el-descriptions-item label="目标方向">{{ detail.targetGoals || '-' }}</el-descriptions-item>
              <el-descriptions-item label="训练重点">{{ detail.focusPoints || '-' }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{ detail.description || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="报名学员" name="students">
            <el-table :data="detailStudents" stripe>
              <el-table-column prop="studentName" label="学员" min-width="140" />
              <el-table-column label="性别" width="100">
                <template #default="scope">{{ genderText(scope.row.gender) }}</template>
              </el-table-column>
              <el-table-column prop="attendancePresent" label="出勤次数" width="110" />
              <el-table-column prop="attendanceTotal" label="总次数" width="100" />
              <el-table-column label="出勤率" width="120">
                <template #default="scope">{{ formatRate(scope.row.attendanceRate) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="scope">
                  <el-button link type="primary" @click="goStudentProfile(scope.row.studentId)">学员档案</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="detailStudents.length === 0" description="暂无报名学员" />
          </el-tab-pane>

          <el-tab-pane label="考勤统计" name="attendance">
            <el-row :gutter="12" style="margin-bottom: 12px">
              <el-col :span="8">
                <el-card shadow="never" class="metric-card">
                  <div class="metric-label">总场次</div>
                  <div class="metric-value">{{ detailAttendance.totalSessions }}</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="never" class="metric-card">
                  <div class="metric-label">平均出勤率</div>
                  <div class="metric-value">{{ formatRate(detailAttendance.avgAttendanceRate) }}</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="never" class="metric-card">
                  <div class="metric-label">记录天数</div>
                  <div class="metric-value">{{ detailAttendance.trend.length }}</div>
                </el-card>
              </el-col>
            </el-row>
            <el-card shadow="never" header="考勤趋势">
              <div ref="courseAttendanceChartRef" style="height: 280px" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCourse,
  deleteCourse,
  getCourse,
  getCourseAttendanceStats,
  getCourseStudents,
  listCourses,
  updateCourse
} from '../../api/modules/courses'
import { listCoaches } from '../../api/modules/coaches'
import { useChart } from '../../composables/useChart'
import { getRole } from '../../utils/auth'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { normalizeText } from '../../utils/validators'

const QUERY_DRAFT_KEY = 'courses.query'
const FORM_DRAFT_KEY = 'courses.form'

const isAdmin = getRole() === 'ADMIN'
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const coachOptions = ref([])

const queryDefaults = { page: 0, size: 10, name: '', status: '' }
const query = reactive({ ...queryDefaults, ...loadDraft(QUERY_DRAFT_KEY, queryDefaults) })
const currentPage = computed(() => query.page + 1)

const formVisible = ref(false)
const formMode = ref('create')
const editingId = ref(null)
const form = reactive({ ...emptyForm(), ...loadDraft(FORM_DRAFT_KEY, emptyForm()) })

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailTab = ref('basic')
const detail = reactive({})
const detailStudents = ref([])
const detailAttendance = reactive({
  totalSessions: 0,
  avgAttendanceRate: 0,
  trend: []
})

const courseAttendanceChartRef = ref(null)
const courseAttendanceChartOption = ref(null)
useChart(courseAttendanceChartRef, courseAttendanceChartOption)

function emptyForm() {
  return {
    courseCode: '',
    name: '',
    courseType: '',
    coachName: '',
    venue: '',
    startTime: '',
    durationMinutes: 60,
    maxCapacity: null,
    courseDate: '',
    classStartTime: '',
    classEndTime: '',
    trainingTheme: '',
    targetAgeRange: '',
    targetGoals: '',
    focusPoints: '',
    status: 'PLANNED',
    description: ''
  }
}

function normalizeDateTimeLocal(value) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().replace(' ', 'T')
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/)
  return match ? match[1] : ''
}

function normalizeDateValue(value) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : ''
}

function normalizeTimeValue(value) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim()
  const match = normalized.match(/^(\d{2}:\d{2})(:\d{2})?$/)
  return match ? match[1] : ''
}

function sanitizeFormDraft(draft) {
  return {
    courseCode: normalizeText(draft?.courseCode),
    name: normalizeText(draft?.name),
    courseType: normalizeText(draft?.courseType),
    coachName: normalizeText(draft?.coachName),
    venue: normalizeText(draft?.venue),
    startTime: normalizeDateTimeLocal(draft?.startTime),
    durationMinutes: Number.isFinite(Number(draft?.durationMinutes)) ? Number(draft.durationMinutes) : 60,
    maxCapacity: Number.isFinite(Number(draft?.maxCapacity)) ? Number(draft.maxCapacity) : null,
    courseDate: normalizeDateValue(draft?.courseDate),
    classStartTime: normalizeTimeValue(draft?.classStartTime),
    classEndTime: normalizeTimeValue(draft?.classEndTime),
    trainingTheme: normalizeText(draft?.trainingTheme),
    targetAgeRange: normalizeText(draft?.targetAgeRange),
    targetGoals: normalizeText(draft?.targetGoals),
    focusPoints: normalizeText(draft?.focusPoints),
    status: draft?.status || 'PLANNED',
    description: normalizeText(draft?.description)
  }
}

function courseStatusText(value) {
  const mapper = {
    PLANNED: '待开课',
    ONGOING: '进行中',
    COMPLETED: '已结束',
    CANCELLED: '已取消'
  }
  return mapper[value] || '-'
}

function genderText(value) {
  if (value === 'MALE') return '男'
  if (value === 'FEMALE') return '女'
  return '-'
}

function formatRate(rate) {
  if (rate == null) return '-'
  return `${(Number(rate) * 100).toFixed(1)}%`
}

function formatEnrollment(row) {
  const current = row?.currentEnrollment ?? 0
  const max = row?.maxCapacity ?? null
  return `${current}/${max || '不限'}`
}

function formatTimeRange(start, end) {
  if (!start || !end) return '-'
  return `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`
}

function coachOptionLabel(item) {
  return `${item.name}${item.status === 'INACTIVE' ? '（已停用）' : ''}`
}

function showRequestError(error, fallbackMessage) {
  const message = error?.response?.data?.message || error?.userMessage || fallbackMessage
  if (!error?.globalMessageHandled || error?.response?.data?.message) {
    ElMessage.error(message)
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
}

function resetDetailState() {
  Object.keys(detail).forEach((key) => delete detail[key])
  detailStudents.value = []
  detailAttendance.totalSessions = 0
  detailAttendance.avgAttendanceRate = 0
  detailAttendance.trend = []
  courseAttendanceChartOption.value = null
}

function refreshDetailAttendanceChart() {
  const trend = detailAttendance.trend || []
  courseAttendanceChartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: {
      type: 'category',
      data: trend.map((item) => item.date)
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '出勤',
        type: 'line',
        smooth: true,
        data: trend.map((item) => item.present)
      },
      {
        name: '总计',
        type: 'line',
        smooth: true,
        lineStyle: { type: 'dashed' },
        data: trend.map((item) => item.total)
      }
    ]
  }
}

async function loadCoachOptions() {
  try {
    const data = await listCoaches({ page: 0, size: 200 })
    coachOptions.value = data.content
  } catch (error) {
    showRequestError(error, '加载教练列表失败')
  }
}

async function fetchData() {
  loading.value = true
  try {
    const data = await listCourses({
      page: query.page,
      size: query.size,
      name: query.name || undefined,
      status: query.status || undefined
    })
    rows.value = data.content
    total.value = data.totalElements
  } catch (error) {
    showRequestError(error, '加载课程失败')
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, queryDefaults)
  clearDraft(QUERY_DRAFT_KEY)
  fetchData()
}

function handleQuickSearch() {
  query.page = 0
  fetchData()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除课程“${row.name}”吗？`, '删除确认', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    try {
      await deleteCourse(row.id)
      ElMessage.success('课程已删除')
      fetchData()
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || ''
      if (msg.includes('关联数据')) {
        await ElMessageBox.confirm(`${msg}\n\n是否强制删除（将同时删除关联考勤和训练记录）？`, '强制删除确认', {
          type: 'warning', confirmButtonText: '强制删除', cancelButtonText: '取消'
        })
        await deleteCourse(row.id, true)
        ElMessage.success('课程及关联数据已删除')
        fetchData()
      } else {
        ElMessage.error(msg || '删除失败')
      }
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
  }
}

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  const cached = loadDraft(FORM_DRAFT_KEY, {})
  Object.assign(form, sanitizeFormDraft(cached))
  formVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingId.value = row.id
  Object.assign(form, {
    courseCode: row.courseCode,
    name: row.name,
    courseType: row.courseType,
    coachName: row.coachName,
    venue: row.venue,
    startTime: normalizeDateTimeLocal(row.startTime),
    durationMinutes: row.durationMinutes,
    maxCapacity: row.maxCapacity ?? null,
    courseDate: normalizeDateValue(row.courseDate),
    classStartTime: normalizeTimeValue(row.classStartTime),
    classEndTime: normalizeTimeValue(row.classEndTime),
    trainingTheme: row.trainingTheme || '',
    targetAgeRange: row.targetAgeRange || '',
    targetGoals: row.targetGoals || '',
    focusPoints: row.focusPoints || '',
    status: row.status,
    description: row.description
  })
  formVisible.value = true
}

function cancelForm() {
  formVisible.value = false
  clearDraft(FORM_DRAFT_KEY)
  resetForm()
}

async function openDetail(id) {
  detailVisible.value = true
  detailLoading.value = true
  detailTab.value = 'basic'
  resetDetailState()
  try {
    const [courseData, students, attendanceStats] = await Promise.all([
      getCourse(id),
      getCourseStudents(id),
      getCourseAttendanceStats(id)
    ])
    Object.assign(detail, courseData)
    detailStudents.value = students || []
    detailAttendance.totalSessions = attendanceStats?.totalSessions || 0
    detailAttendance.avgAttendanceRate = attendanceStats?.avgAttendanceRate || 0
    detailAttendance.trend = attendanceStats?.trend || []
    refreshDetailAttendanceChart()
  } catch (error) {
    showRequestError(error, '获取课程详情失败')
  } finally {
    detailLoading.value = false
  }
}

function goStudentProfile(studentId) {
  if (!studentId) return
  detailVisible.value = false
  router.push(`/students/${studentId}/profile`)
}

async function submitForm() {
  const payload = {
    courseCode: normalizeText(form.courseCode),
    name: normalizeText(form.name),
    courseType: normalizeText(form.courseType),
    coachName: normalizeText(form.coachName),
    venue: normalizeText(form.venue),
    startTime: form.startTime ? `${form.startTime}:00` : '',
    durationMinutes: form.durationMinutes,
    maxCapacity: form.maxCapacity ?? null,
    courseDate: form.courseDate || null,
    classStartTime: form.classStartTime ? `${form.classStartTime}:00` : null,
    classEndTime: form.classEndTime ? `${form.classEndTime}:00` : null,
    trainingTheme: normalizeText(form.trainingTheme),
    targetAgeRange: normalizeText(form.targetAgeRange),
    targetGoals: normalizeText(form.targetGoals),
    focusPoints: normalizeText(form.focusPoints),
    status: form.status,
    description: normalizeText(form.description)
  }

  if (!payload.name || !payload.courseType || !payload.coachName || !payload.venue || !payload.startTime || !payload.durationMinutes) {
    ElMessage.warning('请填写必填字段')
    return
  }

  if (formMode.value === 'create' && !payload.courseCode) {
    ElMessage.warning('请填写课程编码')
    return
  }

  if ((payload.classStartTime && !payload.classEndTime) || (!payload.classStartTime && payload.classEndTime)) {
    ElMessage.warning('开始时间和结束时间需同时填写')
    return
  }
  if ((payload.classStartTime || payload.classEndTime) && !payload.courseDate) {
    ElMessage.warning('填写上课时间段时请先选择上课日期')
    return
  }

  saving.value = true
  try {
    if (formMode.value === 'create') {
      await saveCourseWithConflictRetry(async (ignoreConflict) => {
        await createCourse(payload, { ignoreConflict })
      })
      ElMessage.success('课程创建成功')
    } else {
      await saveCourseWithConflictRetry(async (ignoreConflict) => {
        await updateCourse(editingId.value, {
          name: payload.name,
          courseType: payload.courseType,
          coachName: payload.coachName,
          venue: payload.venue,
          startTime: payload.startTime,
          durationMinutes: payload.durationMinutes,
          maxCapacity: payload.maxCapacity,
          courseDate: payload.courseDate,
          classStartTime: payload.classStartTime,
          classEndTime: payload.classEndTime,
          trainingTheme: payload.trainingTheme,
          targetAgeRange: payload.targetAgeRange,
          targetGoals: payload.targetGoals,
          focusPoints: payload.focusPoints,
          status: payload.status,
          description: payload.description
        }, { ignoreConflict })
      })
      ElMessage.success('课程更新成功')
    }
    clearDraft(FORM_DRAFT_KEY)
    resetForm()
    formVisible.value = false
    fetchData()
  } catch (error) {
    showRequestError(error, '保存课程失败')
  } finally {
    saving.value = false
  }
}

async function saveCourseWithConflictRetry(submitter) {
  try {
    await submitter(false)
  } catch (error) {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || ''
    if (status !== 409) {
      throw error
    }
    await ElMessageBox.confirm(
      `${message || '检测到教练时间冲突'}，是否忽略冲突继续保存？`,
      '时间冲突',
      {
        type: 'warning',
        confirmButtonText: '忽略冲突并继续',
        cancelButtonText: '取消'
      }
    )
    await submitter(true)
  }
}

function handlePageChange(pageNumber) {
  query.page = pageNumber - 1
  fetchData()
}

function handleSizeChange(sizeValue) {
  query.size = sizeValue
  query.page = 0
  fetchData()
}

watch(
  query,
  () => saveDraft(QUERY_DRAFT_KEY, { ...query }),
  { deep: true }
)

watch(
  form,
  () => {
    if (formVisible.value) {
      saveDraft(FORM_DRAFT_KEY, { ...form })
    }
  },
  { deep: true }
)

onMounted(async () => {
  await Promise.all([loadCoachOptions(), fetchData()])
})
</script>

<style scoped>
.helper-text {
  margin-top: 8px;
  color: var(--color-muted);
  font-size: 12px;
}

.metric-card {
  height: 100%;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.native-field {
  width: 100%;
  height: 32px;
  padding: 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  color: var(--el-text-color-regular);
  background: #fff;
  box-sizing: border-box;
}

.native-field:focus {
  border-color: var(--el-color-primary);
}
</style>
