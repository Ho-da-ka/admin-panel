<template>
  <el-container class="shell">
    <el-aside class="sidebar" width="220px">
      <div class="logo">ZF Youth Fitness</div>
      <el-menu :default-active="activePath" router class="menu">
        <el-menu-item index="/dashboard">仪表盘</el-menu-item>
        <el-menu-item index="/students">学员管理</el-menu-item>
        <el-menu-item index="/courses">课程管理</el-menu-item>
        <el-menu-item index="/attendances">考勤管理</el-menu-item>
        <el-menu-item index="/fitness-tests">体测管理</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">{{ route.meta.title || '工作台' }}</div>
        <div class="header-right">
          <el-tag type="success">{{ role || 'UNKNOWN' }}</el-tag>
          <span class="username">{{ username }}</span>
          <el-button type="danger" plain size="small" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearAuth, getDisplayName, getRole } from '../utils/auth'

const route = useRoute()
const router = useRouter()

const activePath = computed(() => route.path)
const role = getRole()
const username = getDisplayName()

function logout() {
  clearAuth()
  router.replace('/login')
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
  font-size: 18px;
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
