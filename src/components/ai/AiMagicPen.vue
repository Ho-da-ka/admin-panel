<template>
  <div class="ai-magic-pen">
    <el-tooltip
      effect="dark"
      :content="loading ? '正在魔法生成中...' : 'AI 智能生成'"
      placement="top"
    >
      <el-button
        circle
        type="primary"
        class="magic-btn"
        :loading="loading"
        @click="handleGenerate"
      >
        <template #icon v-if="!loading">
          <el-icon><MagicStick /></el-icon>
        </template>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { generateTrainingSummary } from '../../api/modules/ai'

const props = defineProps({
  // Data needed for generation
  trainingData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['generated'])
const loading = ref(false)

async function handleGenerate() {
  if (!props.trainingData.trainingContent) {
    ElMessage.warning('请先填写训练内容，以便 AI 分析')
    return
  }

  loading.value = true
  try {
    const result = await generateTrainingSummary(props.trainingData)
    emit('generated', result)
    ElMessage.success('AI 已完成生成')
  } catch (error) {
    ElMessage.error(error.message || 'AI 生成失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ai-magic-pen {
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
}

.magic-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
  border: none;
  transition: all 0.3s;
}

.magic-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}
</style>
