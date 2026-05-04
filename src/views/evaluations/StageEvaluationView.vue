<template>
  <div class="page-panel">
    <h2 class="page-title">阶段评估</h2>

    <div class="toolbar">
      <el-select
        v-model="filters.studentId"
        clearable
        filterable
        placeholder="选择学员"
        style="width: 220px"
        @change="search"
      >
        <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
      <el-button type="success" @click="openCreate">新增阶段评估</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="studentName" label="学员" width="120" />
      <el-table-column prop="cycleName" label="周期名称" min-width="160" />
      <el-table-column label="评估周期" min-width="200">
        <template #default="{ row }">{{ `${row.periodStart} ~ ${row.periodEnd}` }}</template>
      </el-table-column>
      <el-table-column label="出勤率" width="120">
        <template #default="{ row }">{{ formatRate(row.attendanceRate) }}</template>
      </el-table-column>
      <el-table-column prop="trainingSummary" label="训练完成情况" min-width="180" show-overflow-tooltip />
      <el-table-column prop="fitnessSummary" label="体测变化" min-width="180" show-overflow-tooltip />
      <el-table-column prop="coachEvaluation" label="教练评价" min-width="200" show-overflow-tooltip />
      <el-table-column prop="nextStagePlan" label="下阶段计划" min-width="200" show-overflow-tooltip />
      <el-table-column prop="parentReport" label="家长报告" min-width="220" show-overflow-tooltip />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && rows.length === 0" description="暂无阶段评估" />

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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
      <el-form label-position="top">
        <div class="form-section-title">评估基础</div>
        <el-form-item label="对应学员" required>
          <el-select v-model="form.studentId" filterable placeholder="请选择学员" style="width: 100%">
            <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="评估周期名称" required>
          <el-input v-model="form.cycleName" placeholder="如：2026年第一季度体能评估" maxlength="100" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="周期开始日期" required>
              <el-date-picker v-model="form.periodStart" value-format="YYYY-MM-DD" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期结束日期" required>
              <el-date-picker v-model="form.periodEnd" value-format="YYYY-MM-DD" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">详细评估内容</div>
        <el-form-item label="1. 训练完成情况总结" required>
          <el-input v-model="form.trainingSummary" type="textarea" placeholder="总结该学员本阶段课程参与及动作达标情况" maxlength="255" :rows="3" show-word-limit />
        </el-form-item>

        <el-form-item label="2. 体测数据变化分析" required>
          <el-input v-model="form.fitnessSummary" type="textarea" placeholder="分析身高、体重及各项体能指标的变化趋势" maxlength="255" :rows="3" show-word-limit />
        </el-form-item>

        <el-form-item label="3. 教练综合评价" required>
          <el-input v-model="form.coachEvaluation" type="textarea" placeholder="从专注度、积极性、协调性等方面进行综合点评" maxlength="500" :rows="4" show-word-limit />
        </el-form-item>

        <el-form-item label="4. 下阶段针对性计划" required>
          <el-input v-model="form.nextStagePlan" type="textarea" placeholder="基于本阶段表现，制定下一周期的训练重点" maxlength="500" :rows="4" show-word-limit />
        </el-form-item>

        <el-alert
          type="info"
          :closable="false"
          title="数据同步提示"
          description="出勤率将根据您所选的评估周期日期段，自动从考勤数据库中计算得出。"
          show-icon
          style="margin-top: 20px"
        />
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelForm">取 消</el-button>
          <el-button type="primary" :loading="saving" @click="submit">保 存 评 估</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createStageEvaluation,
  listStageEvaluations,
  updateStageEvaluation
} from '../../api/modules/evaluations'
import { listStudents } from '../../api/modules/students'
import { normalizeText } from '../../utils/validators'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const rows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const editingId = ref(null)
const studentOptions = ref([])

const filters = reactive({
  studentId: null
})

const formDefaults = {
  studentId: null,
  cycleName: '',
  periodStart: '',
  periodEnd: '',
  trainingSummary: '',
  fitnessSummary: '',
  coachEvaluation: '',
  nextStagePlan: ''
}

const form = reactive({ ...formDefaults })

const dialogTitle = computed(() => (editingId.value ? '编辑阶段评估' : '新增阶段评估'))

function formatRate(rate) {
  if (rate == null) return '-'
  return `${(Number(rate) * 100).toFixed(1)}%`
}

function resetForm() {
  Object.assign(form, formDefaults)
}

function assignForm(payload) {
  Object.assign(form, {
    studentId: payload.studentId ?? null,
    cycleName: payload.cycleName ?? '',
    periodStart: payload.periodStart ?? '',
    periodEnd: payload.periodEnd ?? '',
    trainingSummary: payload.trainingSummary ?? '',
    fitnessSummary: payload.fitnessSummary ?? '',
    coachEvaluation: payload.coachEvaluation ?? '',
    nextStagePlan: payload.nextStagePlan ?? ''
  })
}

async function loadStudents() {
  const data = await listStudents({ page: 0, size: 200 })
  studentOptions.value = data.content || []
}

async function search() {
  loading.value = true
  try {
    const data = await listStageEvaluations({
      studentId: filters.studentId || undefined,
      page: currentPage.value - 1,
      size: pageSize.value
    })
    rows.value = data.content || []
    total.value = data.totalElements || 0
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '查询阶段评估失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.studentId = null
  currentPage.value = 1
  search()
}

function openCreate() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  assignForm(row)
  dialogVisible.value = true
}

function cancelForm() {
  dialogVisible.value = false
  editingId.value = null
  resetForm()
}

async function submit() {
  const payload = {
    studentId: form.studentId,
    cycleName: normalizeText(form.cycleName),
    periodStart: form.periodStart,
    periodEnd: form.periodEnd,
    trainingSummary: normalizeText(form.trainingSummary),
    fitnessSummary: normalizeText(form.fitnessSummary),
    coachEvaluation: normalizeText(form.coachEvaluation),
    nextStagePlan: normalizeText(form.nextStagePlan)
  }

  if (
    !payload.studentId ||
    !payload.cycleName ||
    !payload.periodStart ||
    !payload.periodEnd ||
    !payload.trainingSummary ||
    !payload.fitnessSummary ||
    !payload.coachEvaluation ||
    !payload.nextStagePlan
  ) {
    ElMessage.warning('请填写必填字段')
    return
  }

  if (payload.periodStart > payload.periodEnd) {
    ElMessage.warning('开始日期不能晚于结束日期')
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await updateStageEvaluation(editingId.value, payload)
      ElMessage.success('阶段评估已更新')
    } else {
      await createStageEvaluation(payload)
      ElMessage.success('阶段评估已创建')
    }
    cancelForm()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存阶段评估失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await loadStudents()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '阶段评估页面初始化失败')
  }
})
</script>
