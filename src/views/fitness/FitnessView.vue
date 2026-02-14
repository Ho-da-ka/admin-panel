<template>
  <div class="page-panel">
    <h2 class="page-title">体测管理</h2>

    <div class="toolbar">
      <el-select v-model="filters.studentId" clearable filterable placeholder="选择学员" style="width: 220px">
        <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button type="primary" @click="search">查询体测记录</el-button>
      <el-button type="success" @click="dialogVisible = true">新增体测</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentName" label="学员" width="130" />
      <el-table-column prop="testDate" label="测试日期" width="130" />
      <el-table-column prop="itemName" label="项目" width="140" />
      <el-table-column prop="testValue" label="数值" width="100" />
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="comment" label="评语" min-width="180" />
      <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增体测" width="520px">
      <el-form label-position="top">
        <el-form-item label="学员">
          <el-select v-model="form.studentId" filterable style="width: 100%">
            <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="测试日期">
          <el-date-picker v-model="form.testDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>

        <el-form-item label="项目"><el-input v-model="form.itemName" maxlength="100" /></el-form-item>

        <el-form-item label="数值">
          <el-input-number v-model="form.testValue" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="单位"><el-input v-model="form.unit" maxlength="32" /></el-form-item>

        <el-form-item label="评语"><el-input v-model="form.comment" maxlength="255" type="textarea" /></el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createFitnessTest, listFitnessTests, listStudents } from '../../api/modules'

const loading = ref(false)
const saving = ref(false)

const rows = ref([])
const studentOptions = ref([])

const filters = reactive({
  studentId: null
})

const dialogVisible = ref(false)
const form = reactive({
  studentId: null,
  testDate: '',
  itemName: '',
  testValue: 1,
  unit: 's',
  comment: ''
})

async function loadStudents() {
  const data = await listStudents({ page: 0, size: 200 })
  studentOptions.value = data.content
}

async function search() {
  if (!filters.studentId) {
    rows.value = []
    ElMessage.info('请先选择学员再查询')
    return
  }

  loading.value = true
  try {
    rows.value = await listFitnessTests({ studentId: filters.studentId })
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.studentId || !form.testDate || !form.itemName || !form.testValue || !form.unit) {
    ElMessage.warning('请填写必填字段')
    return
  }

  saving.value = true
  try {
    await createFitnessTest({ ...form })
    ElMessage.success('体测记录已保存')
    dialogVisible.value = false
    form.studentId = null
    form.testDate = ''
    form.itemName = ''
    form.testValue = 1
    form.unit = 's'
    form.comment = ''
    if (filters.studentId) {
      await search()
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await loadStudents()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '初始化失败')
  }
})
</script>
