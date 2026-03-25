<template>
  <div class="page-panel">
    <h2 class="page-title">教练管理</h2>

    <div class="toolbar">
      <el-input
        v-model="query.name"
        placeholder="按教练姓名搜索"
        style="max-width: 240px"
        clearable
        @keyup.enter="handleQuickSearch"
        @clear="handleQuickSearch"
      />
      <el-select v-model="query.status" placeholder="教练状态" clearable style="width: 180px" @change="handleQuickSearch">
        <el-option label="在职" value="ACTIVE" />
        <el-option label="停用" value="INACTIVE" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button v-if="isAdmin" type="success" @click="openCreate">新增教练</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="coachCode" label="教练编号" width="130" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column label="性别" width="100">
        <template #default="{ row }">{{ genderText(row.gender) }}</template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="specialty" label="擅长方向" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">{{ coachStatusText(row.status) }}</template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="isAdmin" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="isAdmin" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新增教练' : '编辑教练'" width="560px">
      <el-form label-position="top">
        <el-form-item v-if="formMode === 'create'" label="教练编号" required>
          <el-input v-model="form.coachCode" maxlength="32" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item label="性别" required>
          <el-select v-model="form.gender" style="width: 100%">
            <el-option label="男" value="MALE" />
            <el-option label="女" value="FEMALE" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" maxlength="20" />
        </el-form-item>
        <el-form-item label="擅长方向">
          <el-input v-model="form.specialty" maxlength="255" type="textarea" show-word-limit />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="在职" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remarks" maxlength="255" type="textarea" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelForm">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="教练详情" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="教练编号">{{ detail.coachCode }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ genderText(detail.gender) }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="擅长方向">{{ detail.specialty || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ coachStatusText(detail.status) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createCoach, deleteCoach, getCoach, listCoaches, updateCoach } from '../../api/modules'
import { getRole } from '../../utils/auth'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { GUARDIAN_PHONE_REGEX, normalizeText } from '../../utils/validators'

const QUERY_DRAFT_KEY = 'coaches.query'
const FORM_DRAFT_KEY = 'coaches.form'

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
    coachCode: '',
    name: '',
    gender: 'MALE',
    phone: '',
    specialty: '',
    status: 'ACTIVE',
    remarks: ''
  }
}

function genderText(value) {
  return value === 'MALE' ? '男' : value === 'FEMALE' ? '女' : '-'
}

function coachStatusText(value) {
  return value === 'ACTIVE' ? '在职' : value === 'INACTIVE' ? '停用' : '-'
}

function resetForm() {
  Object.assign(form, emptyForm())
}

async function fetchData() {
  loading.value = true
  try {
    const data = await listCoaches({
      page: query.page,
      size: query.size,
      name: query.name || undefined,
      status: query.status || undefined
    })
    rows.value = data.content
    total.value = data.totalElements
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载教练失败')
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
    coachCode: row.coachCode,
    name: row.name,
    gender: row.gender,
    phone: row.phone,
    specialty: row.specialty,
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
    const data = await getCoach(id)
    Object.assign(detail, data)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '获取教练详情失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除教练“${row.name}”吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteCoach(row.id)
    ElMessage.success('教练已删除')
    fetchData()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error?.response?.data?.message || error.message || '删除教练失败')
  }
}

async function submitForm() {
  const payload = {
    coachCode: normalizeText(form.coachCode),
    name: normalizeText(form.name),
    gender: form.gender,
    phone: normalizeText(form.phone),
    specialty: normalizeText(form.specialty),
    status: form.status,
    remarks: normalizeText(form.remarks)
  }

  if (!payload.name || !payload.gender) {
    ElMessage.warning('请填写必填字段')
    return
  }

  if (payload.phone && !GUARDIAN_PHONE_REGEX.test(payload.phone)) {
    ElMessage.warning('手机号格式不正确，请输入 6 到 20 位数字、加号或短横线')
    return
  }

  if (formMode.value === 'create' && !payload.coachCode) {
    ElMessage.warning('请填写教练编号')
    return
  }

  saving.value = true
  try {
    if (formMode.value === 'create') {
      await createCoach(payload)
      ElMessage.success('教练创建成功')
    } else {
      await updateCoach(editingId.value, {
        name: payload.name,
        gender: payload.gender,
        phone: payload.phone,
        specialty: payload.specialty,
        status: payload.status,
        remarks: payload.remarks
      })
      ElMessage.success('教练更新成功')
    }
    clearDraft(FORM_DRAFT_KEY)
    resetForm()
    formVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存教练失败')
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
