<template>
  <div class="page-panel">
    <h2 class="page-title">训练记录</h2>

    <div class="toolbar">
      <el-select v-model="filters.studentId" clearable filterable placeholder="选择学员" style="width: 180px" @change="search">
        <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-select v-model="filters.courseId" clearable filterable placeholder="选择课程" style="width: 180px" @change="search">
        <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-date-picker v-model="filters.startDate" value-format="YYYY-MM-DD" type="date" placeholder="开始日期" @change="search" />
      <el-date-picker v-model="filters.endDate" value-format="YYYY-MM-DD" type="date" placeholder="结束日期" @change="search" />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="success" @click="openCreate">新增训练记录</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentName" label="学员" width="120" />
      <el-table-column prop="courseName" label="课程" min-width="150" />
      <el-table-column prop="trainingDate" label="训练日期" width="120" />
      <el-table-column prop="durationMinutes" label="时长(分钟)" width="110" />
      <el-table-column prop="intensityLevel" label="强度" width="110" />
      <el-table-column prop="trainingContent" label="训练内容" min-width="220" show-overflow-tooltip />
      <el-table-column prop="performanceSummary" label="训练反馈" min-width="180" show-overflow-tooltip />
      <el-table-column prop="coachComment" label="教练评语" min-width="180" show-overflow-tooltip />
      <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form label-position="top">
        <el-form-item label="学员" required>
          <el-select v-model="form.studentId" filterable style="width: 100%">
            <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="课程" required>
          <el-select v-model="form.courseId" filterable style="width: 100%">
            <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="训练日期" required>
          <el-date-picker v-model="form.trainingDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>

        <el-form-item label="训练内容" required>
          <el-input v-model="form.trainingContent" type="textarea" maxlength="255" show-word-limit />
        </el-form-item>

        <el-form-item label="时长（分钟）" required>
          <el-input-number v-model="form.durationMinutes" :min="1" :step="5" style="width: 100%" />
        </el-form-item>

        <el-form-item label="强度等级">
          <el-select v-model="form.intensityLevel" clearable placeholder="请选择强度" style="width: 100%">
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
          </el-select>
        </el-form-item>

        <el-form-item label="训练反馈">
          <el-input v-model="form.performanceSummary" type="textarea" maxlength="255" show-word-limit />
        </el-form-item>

        <el-form-item label="教练评语">
          <el-input v-model="form.coachComment" type="textarea" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelForm">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createTrainingRecord,
  listCourses,
  listStudents,
  listTrainingRecords,
  updateTrainingRecord
} from '../../api/modules'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { normalizeText } from '../../utils/validators'

const FILTER_DRAFT_KEY = 'trainingRecords.filters'
const FORM_DRAFT_KEY = 'trainingRecords.form'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const mode = ref('create')
const editingId = ref(null)

const rows = ref([])
const studentOptions = ref([])
const courseOptions = ref([])

const filterDefaults = {
  studentId: null,
  courseId: null,
  startDate: '',
  endDate: ''
}
const formDefaults = {
  studentId: null,
  courseId: null,
  trainingDate: '',
  trainingContent: '',
  durationMinutes: 60,
  intensityLevel: '',
  performanceSummary: '',
  coachComment: ''
}

const filters = reactive({ ...filterDefaults, ...loadDraft(FILTER_DRAFT_KEY, filterDefaults) })
const form = reactive({ ...formDefaults })

const dialogTitle = computed(() => (mode.value === 'edit' ? '编辑训练记录' : '新增训练记录'))

function resetForm() {
  Object.assign(form, { ...formDefaults })
}

function assignForm(payload) {
  Object.assign(form, {
    studentId: payload.studentId ?? null,
    courseId: payload.courseId ?? null,
    trainingDate: payload.trainingDate ?? '',
    trainingContent: payload.trainingContent ?? '',
    durationMinutes: payload.durationMinutes ?? 60,
    intensityLevel: payload.intensityLevel ?? '',
    performanceSummary: payload.performanceSummary ?? '',
    coachComment: payload.coachComment ?? ''
  })
}

async function loadOptions() {
  const [students, courses] = await Promise.all([
    listStudents({ page: 0, size: 200 }),
    listCourses({ page: 0, size: 200 })
  ])
  studentOptions.value = students.content
  courseOptions.value = courses.content
}

async function search() {
  loading.value = true
  try {
    rows.value = await listTrainingRecords({
      studentId: filters.studentId || undefined,
      courseId: filters.courseId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    })
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '查询训练记录失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  mode.value = 'create'
  editingId.value = null
  assignForm({ ...formDefaults, ...loadDraft(FORM_DRAFT_KEY, formDefaults) })
  dialogVisible.value = true
}

function openEdit(row) {
  mode.value = 'edit'
  editingId.value = row.id
  clearDraft(FORM_DRAFT_KEY)
  assignForm(row)
  dialogVisible.value = true
}

async function submit() {
  const payload = {
    studentId: form.studentId,
    courseId: form.courseId,
    trainingDate: form.trainingDate,
    trainingContent: normalizeText(form.trainingContent),
    durationMinutes: form.durationMinutes,
    intensityLevel: normalizeText(form.intensityLevel),
    performanceSummary: normalizeText(form.performanceSummary),
    coachComment: normalizeText(form.coachComment)
  }

  if (!payload.studentId || !payload.courseId || !payload.trainingDate || !payload.trainingContent || !payload.durationMinutes) {
    ElMessage.warning('请填写必填字段')
    return
  }

  saving.value = true
  try {
    if (mode.value === 'edit' && editingId.value) {
      await updateTrainingRecord(editingId.value, payload)
      ElMessage.success('训练记录已更新')
    } else {
      await createTrainingRecord(payload)
      ElMessage.success('训练记录已保存')
    }
    dialogVisible.value = false
    clearDraft(FORM_DRAFT_KEY)
    resetForm()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存训练记录失败')
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  dialogVisible.value = false
  clearDraft(FORM_DRAFT_KEY)
  resetForm()
}

watch(
  filters,
  () => saveDraft(FILTER_DRAFT_KEY, { ...filters }),
  { deep: true }
)

watch(
  form,
  () => {
    if (dialogVisible.value && mode.value === 'create') {
      saveDraft(FORM_DRAFT_KEY, { ...form })
    }
  },
  { deep: true }
)

onMounted(async () => {
  try {
    await loadOptions()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '训练记录页面初始化失败')
  }
})
</script>
