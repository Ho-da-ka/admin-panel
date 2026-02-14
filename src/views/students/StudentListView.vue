<template>
  <div class="page-panel">
    <h2 class="page-title">学员管理</h2>

    <div class="toolbar">
      <el-input v-model="query.name" placeholder="按姓名搜索" style="max-width: 220px" clearable />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px">
        <el-option label="ACTIVE" value="ACTIVE" />
        <el-option label="INACTIVE" value="INACTIVE" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button v-if="isAdmin" type="success" @click="openCreate">新增学员</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="gender" label="性别" width="100" />
      <el-table-column prop="birthDate" label="生日" width="120" />
      <el-table-column prop="guardianName" label="监护人" width="120" />
      <el-table-column prop="guardianPhone" label="监护人电话" width="140" />
      <el-table-column prop="status" label="状态" width="110" />
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
        <el-form-item label="学号" v-if="formMode === 'create'">
          <el-input v-model="form.studentNo" maxlength="32" />
        </el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" maxlength="64" /></el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender" style="width: 100%">
            <el-option label="MALE" value="MALE" />
            <el-option label="FEMALE" value="FEMALE" />
          </el-select>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker v-model="form.birthDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="监护人姓名"><el-input v-model="form.guardianName" maxlength="64" /></el-form-item>
        <el-form-item label="监护人电话"><el-input v-model="form.guardianPhone" maxlength="20" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remarks" maxlength="255" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="学员详情" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ detail.studentNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.gender }}</el-descriptions-item>
        <el-descriptions-item label="生日">{{ detail.birthDate }}</el-descriptions-item>
        <el-descriptions-item label="监护人">{{ detail.guardianName }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ detail.guardianPhone }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remarks }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createStudent, getStudent, listStudents, updateStudent } from '../../api/modules'
import { getRole } from '../../utils/auth'

const isAdmin = getRole() === 'ADMIN'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)

const query = reactive({
  page: 0,
  size: 10,
  name: '',
  status: ''
})

const currentPage = computed(() => query.page + 1)

const formVisible = ref(false)
const formMode = ref('create')
const editingId = ref(null)
const form = reactive(emptyForm())

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
  query.page = 0
  query.size = 10
  query.name = ''
  query.status = ''
  fetchData()
}

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
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
  if (!form.name || !form.gender || !form.birthDate) {
    ElMessage.warning('请填写必填字段')
    return
  }

  if (formMode.value === 'create' && !form.studentNo) {
    ElMessage.warning('请填写学号')
    return
  }

  saving.value = true
  try {
    if (formMode.value === 'create') {
      await createStudent({ ...form })
      ElMessage.success('学员创建成功')
    } else {
      await updateStudent(editingId.value, {
        name: form.name,
        gender: form.gender,
        birthDate: form.birthDate,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        status: form.status,
        remarks: form.remarks
      })
      ElMessage.success('学员更新成功')
    }
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

onMounted(fetchData)
</script>
