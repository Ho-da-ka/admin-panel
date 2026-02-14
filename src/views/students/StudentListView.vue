<template>
  <div class="page-panel">
    <h2 class="page-title">学员管理</h2>

    <div class="toolbar">
      <el-input
        v-model="query.name"
        placeholder="按姓名搜索"
        style="max-width: 220px"
        clearable
        @keyup.enter="handleQuickSearch"
        @clear="handleQuickSearch"
      />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px" @change="handleQuickSearch">
        <el-option label="在训" value="ACTIVE" />
        <el-option label="停训" value="INACTIVE" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button v-if="isAdmin" type="success" @click="openCreate">新增学员</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column label="性别" width="100">
        <template #default="scope">{{ genderText(scope.row.gender) }}</template>
      </el-table-column>
      <el-table-column prop="birthDate" label="生日" width="120" />
      <el-table-column prop="guardianName" label="监护人" width="120" />
      <el-table-column prop="guardianPhone" label="监护人电话" width="140" />
      <el-table-column label="状态" width="110">
        <template #default="scope">{{ studentStatusText(scope.row.status) }}</template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
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

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新增学员' : '编辑学员'" width="560px">
      <el-form label-position="top">
        <el-form-item label="学号" required v-if="formMode === 'create'">
          <el-input v-model="form.studentNo" maxlength="32" />
        </el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.name" maxlength="64" /></el-form-item>
        <el-form-item label="性别" required>
          <el-select v-model="form.gender" style="width: 100%">
            <el-option label="男" value="MALE" />
            <el-option label="女" value="FEMALE" />
          </el-select>
        </el-form-item>
        <el-form-item label="出生日期" required>
          <el-date-picker v-model="form.birthDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="监护人姓名"><el-input v-model="form.guardianName" maxlength="64" /></el-form-item>
        <el-form-item label="监护人电话"><el-input v-model="form.guardianPhone" maxlength="20" /></el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="在训" value="ACTIVE" />
            <el-option label="停训" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remarks" maxlength="255" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelForm">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="学员详情" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ detail.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ genderText(detail.gender) }}</el-descriptions-item>
        <el-descriptions-item label="生日">{{ detail.birthDate }}</el-descriptions-item>
        <el-descriptions-item label="监护人">{{ detail.guardianName }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ detail.guardianPhone }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ studentStatusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remarks }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createStudent, getStudent, listStudents, updateStudent } from '../../api/modules'
import { getRole } from '../../utils/auth'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { GUARDIAN_PHONE_REGEX, isFutureDate, normalizeText } from '../../utils/validators'

const QUERY_DRAFT_KEY = 'students.query'
const FORM_DRAFT_KEY = 'students.form'

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
    studentNo: '',
    name: '',
    gender: 'MALE',
    birthDate: '',
    guardianName: '',
    guardianPhone: '',
    status: 'ACTIVE',
    remarks: ''
  }
}

function genderText(value) {
  return value === 'MALE' ? '男' : value === 'FEMALE' ? '女' : '-'
}

function studentStatusText(value) {
  return value === 'ACTIVE' ? '在训' : value === 'INACTIVE' ? '停训' : '-'
}

function resetForm() {
  Object.assign(form, emptyForm())
}

async function fetchData() {
  loading.value = true
  try {
    const data = await listStudents({
      page: query.page,
      size: query.size,
      name: query.name || undefined,
      status: query.status || undefined
    })
    rows.value = data.content
    total.value = data.totalElements
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载学员失败')
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
    studentNo: row.studentNo,
    name: row.name,
    gender: row.gender,
    birthDate: row.birthDate,
    guardianName: row.guardianName,
    guardianPhone: row.guardianPhone,
    status: row.status,
    remarks: row.remarks
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
    const data = await getStudent(id)
    Object.assign(detail, data)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '获取详情失败')
  }
}

async function submitForm() {
  const payload = {
    studentNo: normalizeText(form.studentNo),
    name: normalizeText(form.name),
    gender: form.gender,
    birthDate: form.birthDate,
    guardianName: normalizeText(form.guardianName),
    guardianPhone: normalizeText(form.guardianPhone),
    status: form.status,
    remarks: normalizeText(form.remarks)
  }

  if (!payload.name || !payload.gender || !payload.birthDate) {
    ElMessage.warning('请填写必填字段')
    return
  }

  if (isFutureDate(payload.birthDate)) {
    ElMessage.warning('出生日期不能晚于今天')
    return
  }

  if (!GUARDIAN_PHONE_REGEX.test(payload.guardianPhone || '')) {
    ElMessage.warning('监护人电话格式不正确（支持6-20位数字或+、-）')
    return
  }

  if (formMode.value === 'create' && !payload.studentNo) {
    ElMessage.warning('请填写学号')
    return
  }

  saving.value = true
  try {
    if (formMode.value === 'create') {
      await createStudent(payload)
      ElMessage.success('学员创建成功')
    } else {
      await updateStudent(editingId.value, {
        name: payload.name,
        gender: payload.gender,
        birthDate: payload.birthDate,
        guardianName: payload.guardianName,
        guardianPhone: payload.guardianPhone,
        status: payload.status,
        remarks: payload.remarks
      })
      ElMessage.success('学员更新成功')
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
