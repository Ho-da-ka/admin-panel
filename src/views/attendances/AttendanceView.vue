<template>
  <div class="page-panel">
    <h2 class="page-title">考勤管理</h2>

    <div class="toolbar">
      <el-select v-model="filters.studentId" clearable filterable placeholder="学员" style="width: 180px">
        <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-select v-model="filters.courseId" clearable filterable placeholder="课程" style="width: 180px">
        <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-date-picker v-model="filters.startDate" value-format="YYYY-MM-DD" type="date" placeholder="开始日期" />
      <el-date-picker v-model="filters.endDate" value-format="YYYY-MM-DD" type="date" placeholder="结束日期" />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="success" @click="dialogVisible = true">新增考勤</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="studentName" label="学员" width="130" />
      <el-table-column prop="courseName" label="课程" width="170" />
      <el-table-column prop="attendanceDate" label="考勤日期" width="130" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column prop="note" label="备注" min-width="160" />
      <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增考勤" width="520px">
      <el-form label-position="top">
        <el-form-item label="学员">
          <el-select v-model="form.studentId" filterable style="width: 100%">
            <el-option v-for="item in studentOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="课程">
          <el-select v-model="form.courseId" filterable style="width: 100%">
            <el-option v-for="item in courseOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="考勤日期">
          <el-date-picker v-model="form.attendanceDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="PRESENT" value="PRESENT" />
            <el-option label="LATE" value="LATE" />
            <el-option label="ABSENT" value="ABSENT" />
            <el-option label="LEAVE" value="LEAVE" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" maxlength="255" />
        </el-form-item>
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
import { createAttendance, listCourses, listStudents, searchAttendances } from '../../api/modules'

const loading = ref(false)
const saving = ref(false)

const rows = ref([])
const studentOptions = ref([])
const courseOptions = ref([])

const filters = reactive({
  studentId: null,
  courseId: null,
  startDate: '',
  endDate: ''
})

const dialogVisible = ref(false)
const form = reactive({
  studentId: null,
  courseId: null,
  attendanceDate: '',
  status: 'PRESENT',
  note: ''
})

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
    rows.value = await searchAttendances({
      studentId: filters.studentId || undefined,
      courseId: filters.courseId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    })
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.studentId || !form.courseId || !form.attendanceDate || !form.status) {
    ElMessage.warning('请填写必填字段')
    return
  }

  saving.value = true
  try {
    await createAttendance({ ...form })
    ElMessage.success('考勤已保存')
    dialogVisible.value = false
    form.studentId = null
    form.courseId = null
    form.attendanceDate = ''
    form.status = 'PRESENT'
    form.note = ''
    search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await loadOptions()
    await search()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '初始化失败')
  }
})
</script>
