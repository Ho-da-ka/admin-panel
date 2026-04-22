<template>
  <div class="page-panel">
    <h2 class="page-title">家长管理</h2>

    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="按家长姓名、手机号或登录账号搜索"
        style="max-width: 240px"
        clearable
        @keyup.enter="handleQuickSearch"
        @clear="handleQuickSearch"
      />
      <el-input
        v-model="query.studentName"
        placeholder="按绑定学员姓名搜索"
        style="max-width: 220px"
        clearable
        @keyup.enter="handleQuickSearch"
        @clear="handleQuickSearch"
      />
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="displayName" label="家长姓名" width="150" />
      <el-table-column prop="phone" label="手机号" width="150" />
      <el-table-column prop="username" label="登录账号" width="160" />
      <el-table-column label="已绑学员" width="100">
        <template #default="{ row }">{{ row.studentCount || 0 }}</template>
      </el-table-column>
      <el-table-column label="绑定学员" min-width="220">
        <template #default="{ row }">{{ (row.studentNames || []).join('、') || '-' }}</template>
      </el-table-column>
      <el-table-column prop="lastLoginAt" label="最近登录" width="180" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">详情</el-button>
          <el-button size="small" type="primary" @click="openBindDialog(row)">人工绑定</el-button>
          <el-button size="small" type="warning" @click="handleSetPassword(row)">改密</el-button>
          <el-button size="small" type="info" @click="handleResetPassword(row)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无家长账号数据" />

    <div class="pagination-wrap">
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
  </div>

  <el-dialog v-model="detailVisible" title="家长详情" width="760px">
    <el-descriptions v-if="detail" :column="2" border>
      <el-descriptions-item label="家长姓名">{{ detail.displayName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ detail.phone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="登录账号">{{ detail.username || '-' }}</el-descriptions-item>
      <el-descriptions-item label="最近登录">{{ detail.lastLoginAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="绑定学员数">{{ (detail.students || []).length }}</el-descriptions-item>
    </el-descriptions>

    <div class="detail-actions">
      <el-button type="primary" @click="openBindDialog(currentParent)">人工绑定学员</el-button>
    </div>

    <el-table :data="detail?.students || []" stripe>
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="studentName" label="学员姓名" width="140" />
      <el-table-column prop="guardianPhone" label="档案监护人手机号" width="170" />
      <el-table-column label="绑定方式" width="120">
        <template #default="{ row }">{{ bindingTypeLabel(row.bindingType) }}</template>
      </el-table-column>
      <el-table-column label="操作" min-width="180">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleManualUnbind(row)">
            解除人工绑定
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <el-dialog v-model="bindVisible" title="人工绑定学员" width="520px">
    <el-form label-position="top">
      <el-form-item label="当前家长">
        <el-input :model-value="currentParentLabel" disabled />
      </el-form-item>
      <el-form-item label="选择学员" required>
        <el-select
          v-model="selectedStudentId"
          filterable
          placeholder="请选择学员"
          style="width: 100%"
        >
          <el-option
            v-for="student in studentOptions"
            :key="student.id"
            :label="`${student.name} (${student.studentNo || '-'})`"
            :value="student.id"
          >
            <div class="student-option">
              <span>{{ student.name }}（{{ student.studentNo || '-' }}）</span>
              <span class="student-option-phone">{{ student.guardianPhone || '无监护人手机号' }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="bindVisible = false">取消</el-button>
      <el-button type="primary" :loading="binding" @click="submitManualBinding">确认绑定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminResetPassword, adminSetPassword } from '../../api/modules/auth'
import { listStudents } from '../../api/modules/students'
import {
  createManualParentBinding,
  getParent,
  listParents,
  removeManualParentBinding
} from '../../api/modules/parents'
import { bindingTypeLabel, describeUnbindAction } from './parent-binding-actions'

const loading = ref(false)
const binding = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({
  page: 0,
  size: 10,
  keyword: '',
  studentName: ''
})

const currentPage = computed(() => query.page + 1)

const detailVisible = ref(false)
const bindVisible = ref(false)
const currentParent = ref(null)
const detail = ref(null)
const studentOptions = ref([])
const selectedStudentId = ref(null)

const currentParentLabel = computed(() => {
  if (!currentParent.value) return ''
  return `${currentParent.value.displayName || '-'} / ${currentParent.value.phone || '-'}`
})

async function fetchData() {
  loading.value = true
  try {
    const data = await listParents({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
      studentName: query.studentName || undefined
    })
    rows.value = data.content || []
    total.value = data.totalElements || 0
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载家长列表失败')
  } finally {
    loading.value = false
  }
}

function handleQuickSearch() {
  query.page = 0
  fetchData()
}

function resetQuery() {
  query.page = 0
  query.size = 10
  query.keyword = ''
  query.studentName = ''
  fetchData()
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

async function openDetail(id) {
  try {
    const data = await getParent(id)
    detail.value = data
    currentParent.value = {
      id: data.id,
      displayName: data.displayName,
      phone: data.phone,
      username: data.username
    }
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '获取家长详情失败')
  }
}

async function ensureStudentOptions() {
  if (studentOptions.value.length > 0) {
    return
  }
  const data = await listStudents({ page: 0, size: 200 })
  studentOptions.value = data.content || []
}

async function openBindDialog(row) {
  currentParent.value = row || currentParent.value
  selectedStudentId.value = null
  try {
    await ensureStudentOptions()
    bindVisible.value = true
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '加载学员列表失败')
  }
}

async function submitManualBinding() {
  if (!currentParent.value?.id || !selectedStudentId.value) {
    ElMessage.warning('请选择要绑定的学员')
    return
  }

  binding.value = true
  try {
    await createManualParentBinding({
      parentId: currentParent.value.id,
      studentId: selectedStudentId.value
    })
    ElMessage.success('家长与学员绑定关系已更新')
    bindVisible.value = false
    await fetchData()
    if (detailVisible.value) {
      await openDetail(currentParent.value.id)
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '人工绑定失败')
  } finally {
    binding.value = false
  }
}

async function handleManualUnbind(studentRow) {
  const action = describeUnbindAction(studentRow.bindingType)
  if (!action.allowed) {
    ElMessage.warning(action.confirmText)
    return
  }

  try {
    await ElMessageBox.confirm(action.confirmText, '解除人工绑定确认', {
      type: 'warning',
      confirmButtonText: '确认解除',
      cancelButtonText: '取消'
    })
    await removeManualParentBinding(currentParent.value.id, studentRow.studentId)
    ElMessage.success('绑定关系已更新')
    await fetchData()
    await openDetail(currentParent.value.id)
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '解绑失败')
  }
}

async function handleSetPassword(row) {
  try {
    const { value } = await ElMessageBox.prompt(`为账号 ${row.username} 设置新密码`, '管理员改密', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPlaceholder: '请输入新密码（至少 6 位）',
      inputValidator: (value) => (value && value.length >= 6 ? true : '新密码至少 6 位')
    })

    await adminSetPassword({
      username: row.username,
      newPassword: value
    })
    ElMessage.success(`账号 ${row.username} 密码已更新`)
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '改密失败')
  }
}

async function handleResetPassword(row) {
  try {
    await ElMessageBox.confirm(
      `确认将账号 ${row.username} 重置为家长初始密码吗？`,
      '重置密码确认',
      {
        type: 'warning',
        confirmButtonText: '重置',
        cancelButtonText: '取消'
      }
    )
    const result = await adminResetPassword({ username: row.username })
    await ElMessageBox.alert(
      `账号：${result.username}\n新密码：${result.newPassword}`,
      '重置成功',
      { confirmButtonText: '我知道了' }
    )
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.response?.data?.message || error.message || '重置密码失败')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.detail-actions {
  margin: 16px 0 12px;
  display: flex;
  justify-content: flex-end;
}

.student-option {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.student-option-phone {
  color: #909399;
  font-size: 12px;
}
</style>
