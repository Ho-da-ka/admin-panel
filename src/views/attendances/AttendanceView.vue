<template>
  <div class="page-panel">
    <h2 class="page-title">考勤管理</h2>

    <div class="toolbar">
      <el-select v-model="filters.studentId" clearable filterable placeholder="学员" style="width: 180px" @change="search">
        <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-select v-model="filters.courseId" clearable filterable placeholder="课程" style="width: 180px" @change="search">
        <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-date-picker v-model="filters.startDate" value-format="YYYY-MM-DD" type="date" placeholder="开始日期" @change="search" />
      <el-date-picker v-model="filters.endDate" value-format="YYYY-MM-DD" type="date" placeholder="结束日期" @change="search" />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="success" @click="openCreate">新增考勤</el-button>
      <el-button type="warning" @click="openBatchDialog">批量考勤</el-button>
      <el-button @click="handleExport">导出 Excel</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentName" label="学员" width="130" />
      <el-table-column prop="courseName" label="课程" width="170" />
      <el-table-column prop="attendanceDate" label="考勤日期" width="130" />
      <el-table-column label="状态" width="120">
        <template #default="scope">{{ statusText(scope.row.status) }}</template>
      </el-table-column>
      <el-table-column prop="note" label="备注" min-width="160" />
      <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && rows.length === 0" description="暂无考勤记录，请调整筛选条件或新增考勤" />

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      style="margin-top: 16px"
      @size-change="search"
      @current-change="search"
    />

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑考勤记录' : '新增单人考勤'" width="540px">
      <el-form label-position="top">
        <template v-if="!editId">
          <div class="form-section-title">记录对象</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择学员" required>
                <el-select v-model="form.studentId" filterable placeholder="请选择学员" style="width: 100%">
                  <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="对应课程" required>
                <el-select v-model="form.courseId" filterable placeholder="请选择课程" style="width: 100%">
                  <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="考勤日期" required>
            <el-date-picker v-model="form.attendanceDate" value-format="YYYY-MM-DD" type="date" placeholder="选择日期" style="width: 100%" />
          </el-form-item>
        </template>

        <div class="form-section-title">考勤信息</div>
        <el-form-item label="出勤状态" required>
          <el-radio-group v-model="form.status">
            <el-radio-button label="PRESENT">出勤</el-radio-button>
            <el-radio-button label="LATE">迟到</el-radio-button>
            <el-radio-button label="ABSENT">缺勤</el-radio-button>
            <el-radio-button label="LEAVE">请假</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="情况备注">
          <el-input v-model="form.note" type="textarea" placeholder="请输入备注说明（选填）" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelForm">取 消</el-button>
          <el-button type="primary" :loading="saving" @click="submit">保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量考勤录入" width="820px">
      <el-form label-position="top">
        <div class="form-section-title">批量设置条件</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="目标课程" required>
              <el-select v-model="batchForm.courseId" filterable placeholder="请选择课程" style="width: 100%">
                <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="考勤日期" required>
              <el-date-picker v-model="batchForm.attendanceDate" value-format="YYYY-MM-DD" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="一键默认状态">
              <el-select v-model="batchForm.defaultStatus" style="width: 100%" @change="applyDefaultBatchStatus">
                <el-option label="出勤" value="PRESENT" />
                <el-option label="迟到" value="LATE" />
                <el-option label="缺勤" value="ABSENT" />
                <el-option label="请假" value="LEAVE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div style="margin: 24px 0 12px; display: flex; justify-content: space-between; align-items: center">
        <div class="form-section-title" style="margin: 0">学员名单列表</div>
        <el-button type="primary" plain :loading="batchLoadingStudents" @click="loadBatchStudents">加载课程学员</el-button>
      </div>

      <el-table :data="batchRows" stripe border height="380" style="border-radius: 8px; overflow: hidden">
        <el-table-column prop="studentName" label="学员姓名" min-width="160" />
        <el-table-column label="出勤状态" width="220">
          <template #default="scope">
            <el-select v-model="scope.row.status" placeholder="请选择" style="width: 160px">
              <el-option label="出勤" value="PRESENT" />
              <el-option label="迟到" value="LATE" />
              <el-option label="缺勤" value="ABSENT" />
              <el-option label="请假" value="LEAVE" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="batchRows.length === 0" :image-size="100" description="请先选择课程并加载学员" />

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeBatchDialog">取 消</el-button>
          <el-button type="primary" :loading="batchSubmitting" @click="submitBatch">提交考勤记录</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  batchCreateAttendance,
  createAttendance,
  deleteAttendance,
  searchAttendances,
  updateAttendance
} from '../../api/modules/attendance'
import { getCourseStudents, listCourses } from '../../api/modules/courses'
import { listStudents } from '../../api/modules/students'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { exportToExcel } from '../../utils/export'
import { normalizeText } from '../../utils/validators'

const FILTER_DRAFT_KEY = 'attendances.filters'
const FORM_DRAFT_KEY = 'attendances.form'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const studentOptions = ref([])
const courseOptions = ref([])

const filterDefaults = { studentId: null, courseId: null, startDate: '', endDate: '' }
const filters = reactive({ ...filterDefaults, ...loadDraft(FILTER_DRAFT_KEY, filterDefaults) })

const dialogVisible = ref(false)
const editId = ref(null)
const form = reactive({ studentId: null, courseId: null, attendanceDate: '', status: 'PRESENT', note: '' })

const batchDialogVisible = ref(false)
const batchLoadingStudents = ref(false)
const batchSubmitting = ref(false)
const batchForm = reactive({
  courseId: null,
  attendanceDate: '',
  defaultStatus: 'PRESENT'
})
const batchRows = ref([])

function statusText(value) {
  return { PRESENT: '出勤', LATE: '迟到', ABSENT: '缺勤', LEAVE: '请假' }[value] || '-'
}

function resetForm() {
  Object.assign(form, { studentId: null, courseId: null, attendanceDate: '', status: 'PRESENT', note: '' })
  editId.value = null
}

function openCreate() {
  resetForm()
  Object.assign(form, loadDraft(FORM_DRAFT_KEY, {}))
  dialogVisible.value = true
}

function openEdit(row) {
  resetForm()
  editId.value = row.id
  form.status = row.status
  form.note = row.note || ''
  dialogVisible.value = true
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
    const data = await searchAttendances({
      studentId: filters.studentId || undefined,
      courseId: filters.courseId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: currentPage.value - 1,
      size: pageSize.value
    })
    rows.value = data.content
    total.value = data.totalElements
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (editId.value) {
    if (!form.status) {
      ElMessage.warning('请选择状态')
      return
    }
    saving.value = true
    try {
      await updateAttendance(editId.value, { status: form.status, note: normalizeText(form.note) })
      ElMessage.success('考勤已更新')
      dialogVisible.value = false
      search()
    } catch (error) {
      ElMessage.error(error?.response?.data?.message || error.message || '更新失败')
    } finally {
      saving.value = false
    }
    return
  }

  const payload = {
    studentId: form.studentId,
    courseId: form.courseId,
    attendanceDate: form.attendanceDate,
    status: form.status,
    note: normalizeText(form.note)
  }
  if (!payload.studentId || !payload.courseId || !payload.attendanceDate || !payload.status) {
    ElMessage.warning('请填写必填字段')
    return
  }
  saving.value = true
  try {
    await createAttendance(payload)
    ElMessage.success('考勤已保存')
    dialogVisible.value = false
    clearDraft(FORM_DRAFT_KEY)
    resetForm()
    search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function cancelForm() {
  dialogVisible.value = false
  clearDraft(FORM_DRAFT_KEY)
  resetForm()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除考勤记录 #${row.id} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteAttendance(row.id)
    ElMessage.success('考勤记录已删除')
    search()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '删除失败')
  }
}

function openBatchDialog() {
  batchDialogVisible.value = true
  batchRows.value = []
}

function closeBatchDialog() {
  batchDialogVisible.value = false
  batchRows.value = []
}

function applyDefaultBatchStatus() {
  batchRows.value = batchRows.value.map((item) => ({
    ...item,
    status: batchForm.defaultStatus
  }))
}

async function loadBatchStudents() {
  if (!batchForm.courseId || !batchForm.attendanceDate) {
    ElMessage.warning('请先选择课程和考勤日期')
    return
  }
  batchLoadingStudents.value = true
  try {
    const students = await getCourseStudents(batchForm.courseId)
    batchRows.value = students.map((item) => ({
      studentId: item.studentId,
      studentName: item.studentName,
      status: batchForm.defaultStatus
    }))
    if (batchRows.value.length === 0) {
      ElMessage.warning('该课程暂无可用学员')
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载课程学员失败')
  } finally {
    batchLoadingStudents.value = false
  }
}

async function submitBatch() {
  if (!batchForm.courseId || !batchForm.attendanceDate) {
    ElMessage.warning('请先选择课程和考勤日期')
    return
  }
  if (batchRows.value.length === 0) {
    ElMessage.warning('请先加载学员')
    return
  }

  const grouped = batchRows.value.reduce((acc, item) => {
    const status = item.status || batchForm.defaultStatus
    if (!acc[status]) acc[status] = []
    acc[status].push(item.studentId)
    return acc
  }, {})

  batchSubmitting.value = true
  try {
    let createdCount = 0
    for (const [status, studentIds] of Object.entries(grouped)) {
      const created = await batchCreateAttendance({
        courseId: batchForm.courseId,
        attendanceDate: batchForm.attendanceDate,
        studentIds,
        status
      })
      createdCount += created.length
    }
    ElMessage.success(`批量考勤完成，本次新增 ${createdCount} 条记录`)
    closeBatchDialog()
    search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '批量提交失败')
  } finally {
    batchSubmitting.value = false
  }
}

function handleExport() {
  const data = rows.value.map((item) => ({
    id: item.id,
    studentName: item.studentName,
    courseName: item.courseName,
    attendanceDate: item.attendanceDate,
    status: statusText(item.status),
    note: item.note || ''
  }))
  exportToExcel(
    data,
    [
      { label: 'ID', prop: 'id' },
      { label: '学员', prop: 'studentName' },
      { label: '课程', prop: 'courseName' },
      { label: '日期', prop: 'attendanceDate' },
      { label: '状态', prop: 'status' },
      { label: '备注', prop: 'note' }
    ],
    '考勤记录'
  )
}

watch(filters, () => saveDraft(FILTER_DRAFT_KEY, { ...filters }), { deep: true })
watch(form, () => {
  if (dialogVisible.value && !editId.value) {
    saveDraft(FORM_DRAFT_KEY, { ...form })
  }
}, { deep: true })

onMounted(async () => {
  try {
    await loadOptions()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '初始化失败')
  }
})
</script>

<style scoped>
.helper-text {
  color: #909399;
  font-size: 12px;
}
</style>
