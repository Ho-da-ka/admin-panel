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
      <el-button @click="handleExport">导出 Excel</el-button>
      <el-button v-if="isAdmin" @click="handleDownloadTemplate">下载导入模板</el-button>
      <el-upload
        v-if="isAdmin"
        :show-file-list="false"
        accept=".xlsx,.xls"
        :http-request="handleImportRequest"
      >
        <el-button :loading="importing">导入 Excel</el-button>
      </el-upload>
      <el-button v-if="isAdmin" type="success" @click="openCreate">新增学员</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column label="登录账号" min-width="150">
        <template #default="scope">{{ studentLoginUsername(scope.row.studentNo) }}</template>
      </el-table-column>
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
      <el-table-column label="操作" width="390" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openProfile(scope.row.id)">详情</el-button>
          <el-button v-if="isAdmin" size="small" type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-if="isAdmin" size="small" type="warning" @click="handleSetPassword(scope.row)">改密</el-button>
          <el-button v-if="isAdmin" size="small" type="info" @click="handleResetPassword(scope.row)">重置密码</el-button>
          <el-button v-if="isAdmin" size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无学员数据" />

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

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新增学员' : '编辑学员'" width="640px">
      <el-form label-position="top">
        <div class="form-section-title">基本信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号" required v-if="formMode === 'create'">
              <el-input v-model="form.studentNo" placeholder="请输入学号" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" placeholder="请输入姓名" maxlength="64" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" required>
              <el-select v-model="form.gender" style="width: 100%">
                <el-option label="男" value="MALE" />
                <el-option label="女" value="FEMALE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期" required>
              <el-date-picker v-model="form.birthDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" placeholder="选择日期" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">监护人信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="监护人姓名">
              <el-input v-model="form.guardianName" placeholder="请输入姓名" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="监护人电话">
              <el-input v-model="form.guardianPhone" placeholder="请输入联系电话" maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">训练详情</div>
        <el-form-item label="在训状态" required>
          <el-radio-group v-model="form.status">
            <el-radio-button label="ACTIVE">在训</el-radio-button>
            <el-radio-button label="INACTIVE">停训</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="阶段目标">
              <el-input v-model="form.goalFocus" placeholder="例如：提高心肺耐力" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="训练标签">
              <el-input v-model="form.trainingTags" maxlength="255" placeholder="如：核心稳定, 柔韧性" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="风险提示">
          <el-input v-model="form.riskNotes" placeholder="是否有过敏或既往病史" maxlength="255" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标开始日期">
              <el-date-picker v-model="form.goalStartDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" placeholder="选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标结束日期">
              <el-date-picker v-model="form.goalEndDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" placeholder="选择日期" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="其他备注">
          <el-input v-model="form.remarks" placeholder="请输入其他说明信息" maxlength="255" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelForm">取 消</el-button>
          <el-button type="primary" :loading="saving" @click="submitForm">保 存</el-button>
        </div>
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
        <el-descriptions-item label="阶段目标">{{ detail.goalFocus || '-' }}</el-descriptions-item>
        <el-descriptions-item label="训练标签">{{ detail.trainingTags || '-' }}</el-descriptions-item>
        <el-descriptions-item label="风险提示">{{ detail.riskNotes || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目标周期">{{ formatGoalPeriod(detail.goalStartDate, detail.goalEndDate) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remarks }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createStudent,
  deleteStudent,
  downloadStudentImportTemplate,
  getStudent,
  importStudents,
  listStudents,
  updateStudent
} from '../../api/modules/students'
import { adminResetPassword, adminSetPassword } from '../../api/modules/auth'
import { getRole } from '../../utils/auth'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { exportToExcel } from '../../utils/export'
import { GUARDIAN_PHONE_REGEX, isFutureDate, normalizeText } from '../../utils/validators'

const QUERY_DRAFT_KEY = 'students.query'
const FORM_DRAFT_KEY = 'students.form'

const isAdmin = getRole() === 'ADMIN'
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const rows = ref([])
const total = ref(0)

const queryDefaults = { page: 0, size: 10, name: '', status: '' }
const initialQuery = { ...queryDefaults, ...loadDraft(QUERY_DRAFT_KEY, queryDefaults) }
if (route.query.name) {
  initialQuery.name = normalizeRouteQuery(route.query.name)
  initialQuery.page = 0
}
const query = reactive(initialQuery)

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
    goalFocus: '',
    trainingTags: '',
    riskNotes: '',
    goalStartDate: '',
    goalEndDate: '',
    remarks: ''
  }
}

function genderText(value) {
  return value === 'MALE' ? '男' : value === 'FEMALE' ? '女' : '-'
}

function studentStatusText(value) {
  return value === 'ACTIVE' ? '在训' : value === 'INACTIVE' ? '停训' : '-'
}

function studentLoginUsername(studentNo) {
  return `student_${String(studentNo || '').toLowerCase()}`
}

function formatGoalPeriod(startDate, endDate) {
  if (!startDate && !endDate) return '-'
  return `${startDate || '-'} ~ ${endDate || '-'}`
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

function applyRouteQuery({ fetch = false } = {}) {
  if (!route.query.name) return
  const routeName = normalizeRouteQuery(route.query.name)
  if (!routeName) return
  query.name = routeName
  query.page = 0
  if (fetch) {
    fetchData()
  }
}

function normalizeRouteQuery(value) {
  const rawValue = Array.isArray(value) ? value[0] : value
  return String(rawValue || '').trim()
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
    goalFocus: row.goalFocus,
    trainingTags: row.trainingTags,
    riskNotes: row.riskNotes,
    goalStartDate: row.goalStartDate,
    goalEndDate: row.goalEndDate,
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
    goalFocus: normalizeText(form.goalFocus),
    trainingTags: normalizeText(form.trainingTags),
    riskNotes: normalizeText(form.riskNotes),
    goalStartDate: form.goalStartDate || null,
    goalEndDate: form.goalEndDate || null,
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

  if (payload.goalStartDate && payload.goalEndDate && payload.goalStartDate > payload.goalEndDate) {
    ElMessage.warning('目标开始日期不能晚于结束日期')
    return
  }

  if (formMode.value === 'create' && !payload.studentNo) {
    ElMessage.warning('请填写学号')
    return
  }

  saving.value = true
  try {
    if (formMode.value === 'create') {
      const created = await createStudent(payload)
      const username = studentLoginUsername(created.studentNo)
      const initialPassword = `${created.studentNo}@123`
      ElMessageBox.alert(`创建成功\n账号：${username}\n初始密码：${initialPassword}`, '学员创建成功', {
        confirmButtonText: '我知道了'
      })
    } else {
      await updateStudent(editingId.value, {
        name: payload.name,
        gender: payload.gender,
        birthDate: payload.birthDate,
        guardianName: payload.guardianName,
        guardianPhone: payload.guardianPhone,
        status: payload.status,
        goalFocus: payload.goalFocus,
        trainingTags: payload.trainingTags,
        riskNotes: payload.riskNotes,
        goalStartDate: payload.goalStartDate,
        goalEndDate: payload.goalEndDate,
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

function openProfile(id) {
  router.push(`/students/${id}/profile`)
}

async function handleSetPassword(row) {
  try {
    const username = studentLoginUsername(row.studentNo)
    const { value } = await ElMessageBox.prompt(`为账号 ${username} 设置新密码`, '管理员改密', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPlaceholder: '请输入新密码（至少6位）',
      inputValidator: (value) => (value && value.length >= 6 ? true : '新密码至少6位')
    })

    await adminSetPassword({
      username,
      newPassword: value
    })
    ElMessage.success(`账号 ${username} 密码已更新`)
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '改密失败')
  }
}

async function handleResetPassword(row) {
  const username = studentLoginUsername(row.studentNo)
  try {
    await ElMessageBox.confirm(`确认将账号 ${username} 密码重置为初始密码吗？`, '重置密码确认', {
      type: 'warning',
      confirmButtonText: '重置',
      cancelButtonText: '取消'
    })
    const result = await adminResetPassword({ username })
    ElMessageBox.alert(`账号：${result.username}\n初始密码：${result.newPassword}`, '重置成功', {
      confirmButtonText: '我知道了'
    })
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '重置密码失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除学员“${row.name}”吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteStudent(row.id)
    ElMessage.success('学员已删除')
    fetchData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '删除学员失败')
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

function handleExport() {
  const data = rows.value.map((item) => ({
    id: item.id,
    studentNo: item.studentNo,
    name: item.name,
    gender: genderText(item.gender),
    status: studentStatusText(item.status),
    guardianName: item.guardianName || '',
    guardianPhone: item.guardianPhone || ''
  }))
  exportToExcel(
    data,
    [
      { label: 'ID', prop: 'id' },
      { label: '学号', prop: 'studentNo' },
      { label: '姓名', prop: 'name' },
      { label: '性别', prop: 'gender' },
      { label: '状态', prop: 'status' },
      { label: '监护人', prop: 'guardianName' },
      { label: '监护人电话', prop: 'guardianPhone' }
    ],
    '学员列表'
  )
}

async function handleDownloadTemplate() {
  try {
    await downloadStudentImportTemplate()
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '模板下载失败')
  }
}

async function handleImportRequest(options) {
  importing.value = true
  try {
    const result = await importStudents(options.file)
    const errors = (result.errors || []).slice(0, 10)
    const errorText = errors.length > 0 ? `\n失败明细：\n${errors.join('\n')}` : ''
    await ElMessageBox.alert(
      `成功：${result.successCount}\n失败：${result.failCount}${errorText}`,
      '导入完成',
      { confirmButtonText: '确定' }
    )
    await fetchData()
    options.onSuccess?.()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '导入失败')
    options.onError?.(error)
  } finally {
    importing.value = false
  }
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

watch(
  () => route.query.name,
  () => applyRouteQuery({ fetch: true })
)

onMounted(() => {
  applyRouteQuery()
  fetchData()
})
</script>
