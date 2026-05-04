<template>
  <div class="login-wrap">
    <div class="shape shape-a"></div>
    <div class="shape shape-b"></div>

    <el-card class="login-card">
      <h1>管理后台登录</h1>
      <p>ZF青少年体能培训教务管理平台</p>

      <el-form label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" required>
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>

        <el-button :loading="loading" type="primary" style="width: 100%" @click="handleLogin">
          登录并进入系统
        </el-button>
      </el-form>

      <div class="tips">认证方式：JWT（Bearer Token）</div>
      <div class="tips">管理后台仅支持管理员与教练登录，家长请在小程序端使用手机号 + 密码登录。</div>
      <div class="tips">家长账号首次自动创建时，初始密码为手机号后 6 位。</div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../api/modules/auth'
import { clearAuth, setAuth } from '../utils/auth'
import { encryptLoginPassword } from '../utils/loginCrypto'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'Admin@123'
})

const roleLabels = {
  ADMIN: '管理员',
  COACH: '教练',
  STUDENT: '学生',
  PARENT: '家长'
}

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }

  loading.value = true
  try {
    const encryptedPayload = encryptLoginPassword(form.password)
    const authData = await login({
      username: form.username.trim(),
      encryptedPassword: encryptedPayload.encryptedPassword,
      iv: encryptedPayload.iv
    })

    if (!['ADMIN', 'COACH'].includes(authData.role)) {
      clearAuth()
      ElMessage.warning(`当前账号角色为 ${roleLabels[authData.role] || authData.role}，请使用小程序端登录`)
      return
    }

    setAuth({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      username: authData.username,
      role: authData.role
    })
    ElMessage.success('登录成功')
    router.replace('/dashboard')
  } catch (error) {
    clearAuth()
    ElMessage.error(error?.response?.data?.message || error.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f3f4f6; /* Modern light gray */
  position: relative;
  overflow: hidden;
}

/* Add a subtle background pattern */
.login-wrap::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.5;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  animation: float 10s ease-in-out infinite alternate;
}

.shape-a {
  width: 400px;
  height: 400px;
  background: rgba(59, 130, 246, 0.3); /* Primary blue */
  top: -100px;
  left: -100px;
}

.shape-b {
  width: 350px;
  height: 350px;
  background: rgba(16, 185, 129, 0.2); /* Emerald green */
  bottom: -100px;
  right: -100px;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(20px) scale(1.05); }
}

.login-card {
  width: 440px;
  max-width: calc(100vw - 32px);
  z-index: 1;
  border-radius: 20px;
  border: none;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px;
}

.login-card h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  text-align: center;
  letter-spacing: -0.5px;
}

.login-card p {
  margin: 12px 0 32px;
  color: #6b7280;
  text-align: center;
  font-size: 15px;
}

.tips {
  margin-top: 16px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px;
}

:deep(.el-input__wrapper) {
  padding: 8px 12px;
  box-shadow: 0 0 0 1px #d1d5db inset;
  transition: all 0.2s;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6 inset;
}

:deep(.el-button--primary) {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  margin-top: 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
</style>
