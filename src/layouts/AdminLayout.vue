<template>
  <el-container class="shell">
    <!-- Sidebar -->
    <el-aside class="sidebar" width="260px">
      <div class="logo-area">
        <div class="logo-box">ZF</div>
        <div class="logo-text">青少年体能教务</div>
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
        <el-menu-item index="/coaches">
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
    </el-aside>

    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <span class="page-header-title">{{ route.meta.title || '工作台' }}</span>
        </div>
        <div class="header-right">
          <div class="user-info">
            <el-tag size="small" effect="dark" type="primary" class="role-tag">{{ roleLabel }}</el-tag>
            <span class="display-name">{{ username }}</span>
          </div>
          <div class="header-actions">
            <el-tooltip content="修改密码" placement="bottom">
              <el-button circle size="small" @click="passwordDialogVisible = true">
                <el-icon><Lock /></el-icon>
              </el-button>
            </el-tooltip>
            <el-button type="danger" link @click="logout">退出登录</el-button>
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
  border-right: none;
  display: flex;
  flex-direction: column;
}

.logo-area {
  padding: 32px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-box {
  width: 36px;
  height: 36px;
  background-color: var(--admin-primary);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 18px;
}

.logo-text {
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.5px;
}

.menu {
  border-right: none;
  background-color: transparent;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  color: var(--admin-sidebar-text);
  height: 50px;
  line-height: 50px;
  margin: 4px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.menu :deep(.el-menu-item:hover) {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: var(--admin-primary);
  font-weight: 600;
}

.header {
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid var(--admin-border);
  padding: 0 32px;
}

.page-header-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.display-name {
  font-weight: 600;
  color: #334155;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 24px;
  border-left: 1px solid var(--admin-border);
}

.main-content {
  background-color: var(--admin-bg);
  padding: 0;
  overflow-y: auto;
}

.content-wrapper {
  padding: 32px;
  max-width: 1440px;
  margin: 0 auto;
}

/* Transition */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

@media (max-width: 1024px) {
  .sidebar {
    width: 80px !important;
  }
  .logo-text, .menu span {
    display: none;
  }
  .logo-area {
    justify-content: center;
    padding: 24px 0;
  }
}
</style>
