<template>
  <div class="page-panel">
    <h2 class="page-title">体测管理</h2>

    <div class="toolbar">
      <el-select v-model="filters.studentId" clearable filterable placeholder="选择学员" style="width: 220px" @change="search">
        <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="success" @click="openCreate">新增体测</el-button>
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
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && rows.length === 0" description="暂无体测记录" />

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

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑体测' : '新增体测'" width="520px">
      <el-form label-position="top">
        <el-form-item v-if="!editId" label="学员" required>
          <el-select v-model="form.studentId" filterable style="width: 100%">
            <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="测试日期" required>
          <el-date-picker v-model="form.testDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>

        <el-form-item label="项目" required>
          <el-select
            v-model="form.itemName"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入项目"
            style="width: 100%"
            @change="onItemChange"
          >
            <el-option v-for="item in FITNESS_ITEMS" :key="item.label" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>

        <el-form-item label="数值" required>
          <el-input-number v-model="form.testValue" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="单位" required>
          <el-input v-model="form.unit" maxlength="32" />
        </el-form-item>

        <el-form-item label="评语">
          <el-input v-model="form.comment" maxlength="255" type="textarea" />
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
import { createFitnessTest, deleteFitnessTest, listFitnessTests, listStudents, updateFitnessTest } from '../../api/modules'
import { clearDraft, loadDraft, saveDraft } from '../../utils/draft'
import { normalizeText } from '../../utils/validators'

const FITNESS_ITEMS = [
  { label: '身高', unit: 'cm' },
  { label: '体重', unit: 'kg' },
  { label: '50米跑', unit: '秒' },
  { label: '立定跳远', unit: 'cm' },
  { label: '坐位体前屈', unit: 'cm' },
  { label: '引体向上', unit: '次' },
  { label: '仰卧起坐', unit: '次/分钟' },
  { label: '1000米跑', unit: '秒' },
  { label: '800米跑', unit: '秒' },
]

const FILTER_DRAFT_KEY = 'fitness.filters'
const FORM_DRAFT_KEY = 'fitness.form'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const studentOptions = ref([])

const filterDefaults = { studentId: null }
const filters = reactive({ ...filterDefaults, ...loadDraft(FILTER_DRAFT_KEY, filterDefaults) })

const dialogVisible = ref(false)
const editId = ref(null)
const form = reactive({ studentId: null, testDate: '', itemName: '', testValue: 1, unit: '', comment: '' })

function resetForm() {
  Object.assign(form, { studentId: null, testDate: '', itemName: '', testValue: 1, unit: '', comment: '' })
  editId.value = null
}

function onItemChange(val) {
  const preset = FITNESS_ITEMS.find(i => i.label === val)
  if (preset) form.unit = preset.unit
}

function openCreate() {
  resetForm()
  Object.assign(form, loadDraft(FORM_DRAFT_KEY, {}))
  dialogVisible.value = true
}

function openEdit(row) {
  resetForm()
  editId.value = row.id
  Object.assign(form, {
    testDate: row.testDate,
    itemName: row.itemName,
    testValue: Number(row.testValue),
    unit: row.unit,
    comment: row.comment || ''
  })
  dialogVisible.value = true
}

async function search() {
  loading.value = true
  try {
    const data = await listFitnessTests({
      studentId: filters.studentId || undefined,
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
  if (!form.testDate || !form.itemName || !form.testValue || !form.unit) {
    ElMessage.warning('请填写必填字段')
    return
  }

  saving.value = true
  try {
    if (editId.value) {
      await updateFitnessTest(editId.value, {
        testDate: form.testDate,
        itemName: normalizeText(form.itemName),
        testValue: form.testValue,
        unit: normalizeText(form.unit),
        comment: normalizeText(form.comment)
      })
      ElMessage.success('体测记录已更新')
    } else {
      if (!form.studentId) { ElMessage.warning('请选择学员'); saving.value = false; return }
      await createFitnessTest({
        studentId: form.studentId,
        testDate: form.testDate,
        itemName: normalizeText(form.itemName),
        testValue: form.testValue,
        unit: normalizeText(form.unit),
        comment: normalizeText(form.comment)
      })
      ElMessage.success('体测记录已保存')
      clearDraft(FORM_DRAFT_KEY)
    }
    dialogVisible.value = false
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
    await ElMessageBox.confirm(`确认删除体测记录 #${row.id}（${row.itemName}）吗？`, '删除确认', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    await deleteFitnessTest(row.id)
    ElMessage.success('体测记录已删除')
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
    const data = await listStudents({ page: 0, size: 200 })
    studentOptions.value = data.content
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '初始化失败')
  }
})
</script>
