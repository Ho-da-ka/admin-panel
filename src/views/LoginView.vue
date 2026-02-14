<template>
  <div class="login-wrap">
    <div class="shape shape-a"></div>
    <div class="shape shape-b"></div>

    <el-card class="login-card">
      <h1>管理后台登录</h1>
      <p>ZF 青少年体能培训教务管理平台</p>

      <el-form label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="admin 或 coach" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="输入密码" />
        </el-form-item>

        <el-form-item label="角色标记（用于前端权限显示）">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="ADMIN" value="ADMIN" />
            <el-option label="COACH" value="COACH" />
          </el-select>
        </el-form-item>

        <el-button :loading="loading" type="primary" style="width: 100%" @click="handleLogin">
          登录并进入
        </el-button>
      </el-form>

      <div class="tips">后端当前认证方式：HTTP Basic（非 JWT 登录接口）</div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { listStudents } from '../api/modules'
import { clearAuth, setAuth } from '../utils/auth'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'Admin@123',
  role: 'ADMIN'
})

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }

  loading.value = true
  const token = btoa(`${form.username}:${form.password}`)

  try {
    setAuth({ token, username: form.username, role: form.role })
    await listStudents({ page: 0, size: 1 })
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
  background: radial-gradient(circle at 0% 0%, #daf7ea 0%, #edf3ff 38%, #fff8ea 100%);
  position: relative;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
}

.shape-a {
  width: 360px;
  height: 360px;
  background: rgba(31, 139, 122, 0.16);
  top: -120px;
  left: -90px;
}

.shape-b {
  width: 340px;
  height: 340px;
  background: rgba(241, 143, 1, 0.12);
  bottom: -130px;
  right: -120px;
}

.login-card {
  width: 420px;
  max-width: calc(100vw - 24px);
  z-index: 1;
  border-radius: 16px;
}

.login-card h1 {
  margin: 0;
  font-size: 24px;
}

.login-card p {
  margin: 8px 0 18px;
  color: #667085;
}

.tips {
  margin-top: 12px;
  color: #667085;
  font-size: 12px;
}
</style>
