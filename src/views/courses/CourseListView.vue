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
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 180px" @change="handleQuickSearch">
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
      <el-table-column prop="courseCode" label="课程编码" width="120" />
      <el-table-column prop="name" label="课程名" width="160" />
      <el-table-column prop="courseType" label="类型" width="120" />
      <el-table-column prop="coachName" label="教练" width="120" />
      <el-table-column prop="venue" label="场地" width="140" />
      <el-table-column prop="startTime" label="开始时间" width="170" />
      <el-table-column prop="durationMinutes" label="时长(分钟)" width="110" />
      <el-table-column label="状态" width="120">
        <template #default="scope">{{ courseStatusText(scope.row.status) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openDetail(scope.row.id)">详情</el-button>
          <el-button v-if="isAdmin" size="small" type="primary" @click="openEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

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

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新增课程' : '编辑课程'" width="620px">
      <el-form label-position="top">
        <el-form-item label="课程编码" required v-if="formMode === 'create'">
          <el-input v-model="form.courseCode" maxlength="32" />
        </el-form-item>
        <el-form-item label="课程名称" required><el-input v-model="form.name" maxlength="100" /></el-form-item>
        <el-form-item label="课程类型" required><el-input v-model="form.courseType" maxlength="64" /></el-form-item>
        <el-form-item label="教练姓名" required><el-input v-model="form.coachName" maxlength="64" /></el-form-item>
        <el-form-item label="场地" required><el-input v-model="form.venue" maxlength="128" /></el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker v-model="form.startTime" value-format="YYYY-MM-DDTHH:mm:ss" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长（分钟）" required><el-input-number v-model="form.durationMinutes" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待开课" value="PLANNED" />
            <el-option label="进行中" value="ONGOING" />
            <el-option label="已结束" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" maxlength="255" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelForm">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="课程详情" width="560px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="课程编码">{{ detail.courseCode }}</el-descriptions-item>
        <el-descriptions-item label="课程名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detail.courseType }}</el-descriptions-item>
        <el-descriptions-item label="教练">{{ detail.coachName }}</el-descriptions-item>
        <el-descriptions-item label="场地">{{ detail.venue }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="时长">{{ detail.durationMinutes }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ courseStatusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detail.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createCourse, getCourse, listCourses, updateCourse } from '../../api/modules'
import { getRole } from '../../utils/auth'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { normalizeText } from '../../utils/validators'

const QUERY_DRAFT_KEY = 'courses.query'
const FORM_DRAFT_KEY = 'courses.form'

const isAdmin = getRole() === 'ADMIN'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)

const queryDefaults = { page: 0, size: 10, name: '', status: '' }
const query = reactive({ ...queryDefaults, ...loadDraft(QUERY_DRAFT_KEY, queryDefaults) })

const currentPage = computed(() => query.page + 1)

const formVisible = ref(false)
const formMode = ref('create')
const editingId = ref(null)
const form = reactive({ ...emptyForm(), ...loadDraft(FORM_DRAFT_KEY, emptyForm()) })

const detailVisible = ref(false)
const detail = reactive({})

function emptyForm() {
  return {
    courseCode: '',
    name: '',
    courseType: '',
    coachName: '',
    venue: '',
    startTime: '',
    durationMinutes: 60,
    status: 'PLANNED',
    description: ''
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

function resetForm() {
  Object.assign(form, emptyForm())
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
    ElMessage.error(error?.response?.data?.message || error.message || '加载课程失败')
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

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
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
    startTime: row.startTime,
    durationMinutes: row.durationMinutes,
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
  try {
    const data = await getCourse(id)
    Object.assign(detail, data)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '获取详情失败')
  }
}

async function submitForm() {
  const payload = {
    courseCode: normalizeText(form.courseCode),
    name: normalizeText(form.name),
    courseType: normalizeText(form.courseType),
    coachName: normalizeText(form.coachName),
    venue: normalizeText(form.venue),
    startTime: form.startTime,
    durationMinutes: form.durationMinutes,
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

  saving.value = true
  try {
    if (formMode.value === 'create') {
      await createCourse(payload)
      ElMessage.success('课程创建成功')
    } else {
      await updateCourse(editingId.value, {
        name: payload.name,
        courseType: payload.courseType,
        coachName: payload.coachName,
        venue: payload.venue,
        startTime: payload.startTime,
        durationMinutes: payload.durationMinutes,
        status: payload.status,
        description: payload.description
      })
      ElMessage.success('课程更新成功')
    }
    clearDraft(FORM_DRAFT_KEY)
    resetForm()
    formVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存失败')
  } finally {
    saving.value = false
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

onMounted(fetchData)
</script>
