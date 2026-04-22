<template>
  <el-container class="shell">
    <el-aside class="sidebar" width="220px">
      <div class="logo">ZF青少年体能教务平台</div>
      <el-menu :default-active="activePath" router class="menu">
        <el-menu-item index="/dashboard">仪表盘</el-menu-item>
        <el-menu-item index="/students">学员管理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/parents">家长管理</el-menu-item>
        <el-menu-item index="/coaches">教练管理</el-menu-item>
        <el-menu-item index="/courses">课程管理</el-menu-item>
        <el-menu-item index="/attendances">考勤管理</el-menu-item>
        <el-menu-item index="/fitness-tests">体测管理</el-menu-item>
        <el-menu-item index="/training-records">训练记录</el-menu-item>
        <el-menu-item index="/stage-evaluations">阶段评估</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">{{ route.meta.title || '工作台' }}</div>
        <div class="header-right">
          <el-tag type="success">{{ roleLabel }}</el-tag>
          <span class="username">{{ username }}</span>
          <el-button plain size="small" @click="passwordDialogVisible = true">修改密码</el-button>
          <el-button type="danger" plain size="small" @click="logout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="passwordDialogVisible" title="修改密码" width="420px">
    <el-form label-position="top">
      <el-form-item label="旧密码" required>
        <el-input v-model="passwordForm.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input v-model="passwordForm.newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认新密码" required>
        <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="cancelChangePassword">取消</el-button>
      <el-button type="primary" :loading="changingPassword" @click="submitChangePassword">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { changeOwnPassword, logout as requestLogout } from '../api/modules/auth'
import { clearAuth, getDisplayName, getRole } from '../utils/auth'

const route = useRoute()
const router = useRouter()

const activePath = computed(() => route.path)
const role = getRole()
const isAdmin = role === 'ADMIN'
const roleLabelMap = {
  ADMIN: '管理员',
  COACH: '教练',
  STUDENT: '学生',
  PARENT: '家长'
}
const roleLabel = roleLabelMap[role] || '未识别角色'
const username = getDisplayName() || '未登录用户'
const passwordDialogVisible = ref(false)
const changingPassword = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function resetPasswordForm() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

async function logout() {
  try {
    await requestLogout({})
  } catch {
    // ignore logout failure, local token will still be cleared
  }
  clearAuth()
  router.replace('/login')
}

function cancelChangePassword() {
  passwordDialogVisible.value = false
  resetPasswordForm()
}

async function submitChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请完整填写密码信息')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码长度至少 6 位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  changingPassword.value = true
  try {
    await changeOwnPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    resetPasswordForm()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || error.message || '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.shell {
  min-height: 100vh;
}

.sidebar {
  background: var(--bg-strong);
  color: #fff;
}

.logo {
  font-weight: 700;
  letter-spacing: 0.5px;
  font-size: 16px;
  padding: 22px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.menu {
  border-right: none;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.9);
}

.menu :deep(.el-menu-item.is-active) {
  background: rgba(241, 143, 1, 0.26);
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #eaecf0;
}

.header-left {
  font-size: 18px;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  color: var(--color-muted);
}

.main {
  background: linear-gradient(180deg, #f7fbfb 0%, #f6faf8 100%);
  min-height: calc(100vh - 60px);
}

@media (max-width: 960px) {
  .sidebar {
    width: 74px !important;
  }

  .logo {
    font-size: 0;
    padding: 20px 0;
  }

  .menu :deep(.el-menu-item) {
    padding-left: 20px !important;
  }
}
</style>
