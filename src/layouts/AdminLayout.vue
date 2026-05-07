<template>
  <el-container class="shell">
    <!-- Sidebar -->
    <el-aside class="sidebar" width="260px">
      <div class="logo-area">
        <div class="logo-box">ZF</div>
        <div class="logo-text">教务管理平台</div>
      </div>
      <el-menu :default-active="activePath" router class="menu">
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/ai-hub">
          <el-icon><MagicStick /></el-icon>
          <span>AI智慧中心</span>
        </el-menu-item>
        <el-menu-item index="/students">
          <el-icon><User /></el-icon>
          <span>学员管理</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/parents">
          <el-icon><House /></el-icon>
          <span>家长管理</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/coaches">
          <el-icon><Avatar /></el-icon>
          <span>教练管理</span>
        </el-menu-item>
        <el-menu-item index="/courses">
          <el-icon><Calendar /></el-icon>
          <span>课程管理</span>
        </el-menu-item>
        <el-menu-item index="/attendances">
          <el-icon><Checked /></el-icon>
          <span>考勤管理</span>
        </el-menu-item>
        <el-menu-item index="/fitness-tests">
          <el-icon><Odometer /></el-icon>
          <span>体测管理</span>
        </el-menu-item>
        <el-menu-item index="/training-records">
          <el-icon><Stopwatch /></el-icon>
          <span>训练记录</span>
        </el-menu-item>
        <el-menu-item index="/stage-evaluations">
          <el-icon><PieChart /></el-icon>
          <span>阶段评估</span>
        </el-menu-item>
      </el-menu>

      <!-- User Info Footer -->
      <div class="sidebar-footer">
        <div class="user-card">
          <el-avatar :size="36" class="user-avatar">{{ username.charAt(0) }}</el-avatar>
          <div class="user-meta">
            <div class="user-name">{{ username }}</div>
            <div class="user-role">{{ roleLabel }}</div>
          </div>
        </div>
      </div>
    </el-aside>

    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <span class="page-header-title">{{ route.meta.title || '工作台' }}</span>
        </div>
        <div class="header-right">
          <div class="header-actions">
            <el-tooltip content="修改密码" placement="bottom">
              <el-button circle size="default" @click="passwordDialogVisible = true">
                <el-icon><Lock /></el-icon>
              </el-button>
            </el-tooltip>
            <el-button type="danger" plain @click="logout">退出登录</el-button>
          </div>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="passwordDialogVisible" title="修改密码" width="420px" destroy-on-close>
    <el-form label-position="top">
      <el-form-item label="旧密码" required>
        <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="至少 6 位" />
      </el-form-item>
      <el-form-item label="确认新密码" required>
        <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
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
import {
  Monitor, User, House, Avatar, Calendar, Checked, Odometer, Stopwatch, PieChart, Lock, MagicStick
} from '@element-plus/icons-vue'
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
const roleLabel = roleLabelMap[role] || '用户'
const username = getDisplayName() || '管理员'
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
  } catch (e) {}
  clearAuth()
  router.replace('/login')
}

function cancelChangePassword() {
  passwordDialogVisible.value = false
  resetPasswordForm()
}

async function submitChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请完整填写信息')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }

  changingPassword.value = true
  try {
    await changeOwnPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('修改成功')
    passwordDialogVisible.value = false
    resetPasswordForm()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '修改失败')
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped lang="scss">
.shell {
  height: 100vh;
}

.sidebar {
  background-color: var(--admin-sidebar-bg);
  color: var(--admin-sidebar-text);
  border-right: 1px solid var(--admin-border);
  display: flex;
  flex-direction: column;
  z-index: 10;
  transition: all 0.3s ease;
}

.logo-area {
  padding: 32px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-box {
  width: 32px;
  height: 32px;
  background: var(--admin-primary);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.logo-text {
  color: #0f172a;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.menu {
  border-right: none;
  background-color: transparent;
  flex: 1;
  padding: 0 12px;
}

.menu :deep(.el-menu-item) {
  color: var(--admin-sidebar-text);
  height: 44px;
  line-height: 44px;
  margin: 4px 0;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  opacity: 0.7;
}

.menu :deep(.el-menu-item:hover) {
  color: var(--admin-primary);
  background-color: var(--admin-sidebar-active-bg);
}

.menu :deep(.el-menu-item.is-active) {
  color: var(--admin-primary);
  background-color: var(--admin-sidebar-active-bg);
  font-weight: 700;
}

.menu :deep(.el-menu-item.is-active .el-icon) {
  opacity: 1;
}

.sidebar-footer {
  padding: 20px 16px;
  border-top: 1px solid var(--admin-border);
}

.user-card {
  background-color: var(--admin-bg);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background-color: var(--admin-primary);
  font-weight: 700;
  font-size: 14px;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.header {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid var(--admin-border);
  padding: 0 32px;
  z-index: 5;
}

.page-header-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-content {
  background-color: var(--admin-bg);
  padding: 0;
  overflow-y: auto;
}

.content-wrapper {
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 80px !important;
  }
  .logo-text, .menu span, .user-meta, .sidebar-footer {
    display: none;
  }
  .logo-area {
    justify-content: center;
    padding: 24px 0;
  }
  .menu {
    padding: 0 10px;
  }
}
</style>

