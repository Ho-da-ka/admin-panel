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

    <el-empty v-if="!loading && rows.length === 0" description="暂无考勤记录" />

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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑考勤' : '新增考勤'" width="520px">
      <el-form label-position="top">
        <template v-if="!editId">
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
          <el-form-item label="考勤日期" required>
            <el-date-picker v-model="form.attendanceDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
          </el-form-item>
        </template>
        <el-form-item label="状态" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="出勤" value="PRESENT" />
            <el-option label="迟到" value="LATE" />
            <el-option label="缺勤" value="ABSENT" />
            <el-option label="请假" value="LEAVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" maxlength="255" />
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
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createAttendance, deleteAttendance, listCourses, listStudents, searchAttendances, updateAttendance } from '../../api/modules'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
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
    if (!form.status) { ElMessage.warning('请选择状态'); return }
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
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await deleteAttendance(row.id)
    ElMessage.success('考勤记录已删除')
    search()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '删除失败')
  }
}

watch(filters, () => saveDraft(FILTER_DRAFT_KEY, { ...filters }), { deep: true })
watch(form, () => { if (dialogVisible.value && !editId.value) saveDraft(FORM_DRAFT_KEY, { ...form }) }, { deep: true })

onMounted(async () => {
  try {
    await loadOptions()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '初始化失败')
  }
})
</script>
