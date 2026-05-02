<template>
  <div class="ai-insights-card" v-loading="loading">
    <div class="ai-header">
      <div class="ai-title">
        <el-icon class="magic-icon"><MagicStick /></el-icon>
        <span>AI 智能综述</span>
      </div>
      <el-button link type="primary" size="small" @click="fetchInsights">
        <el-icon><Refresh /></el-icon> 重新生成
      </el-button>
    </div>

    <div v-if="insights" class="ai-content">
      <div class="ai-summary">
        <p class="summary-text">{{ insights.summary }}</p>
      </div>

      <div class="ai-details">
        <div class="detail-section">
          <div class="section-label">优势项</div>
          <div class="strength-grid">
            <div v-for="(item, idx) in insights.strengths" :key="idx" class="strength-item">
              <el-tag size="small" effect="plain" type="success">{{ item.item }}</el-tag>
              <span class="level">{{ item.level }}</span>
              <p class="desc">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-label">建议</div>
          <ul class="suggestion-list">
            <li v-for="(s, idx) in insights.suggestions" :key="idx">{{ s }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { MagicStick, Refresh } from '@element-plus/icons-vue'
import { getStudentInsights } from '../../api/modules/ai'

const props = defineProps({
  studentId: {
    type: [Number, String],
    required: true
  }
})

const loading = ref(false)
const insights = ref(null)

async function fetchInsights() {
  if (!props.studentId) return
  loading.value = true
  try {
    insights.value = await getStudentInsights(props.studentId)
  } catch (error) {
    console.error('AI Insights Error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInsights()
})
</script>

<style scoped lang="scss">
.ai-insights-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9faff 100%);
  border: 1px solid transparent;
  border-image: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%) 1;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.05);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;

  .magic-icon {
    color: #a855f7;
    font-size: 22px;
  }
}

.summary-text {
  font-size: 15px;
  line-height: 1.7;
  color: #334155;
  background: rgba(255, 255, 255, 0.5);
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
}

.ai-details {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  margin-top: 24px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.strength-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.strength-item {
  .level {
    font-size: 13px;
    font-weight: 700;
    color: #10b981;
    margin-left: 10px;
  }
  .desc {
    font-size: 13px;
    color: #64748b;
    margin-top: 6px;
    margin-bottom: 0;
  }
}

.suggestion-list {
  padding-left: 18px;
  margin: 0;
  li {
    font-size: 14px;
    color: #475569;
    margin-bottom: 12px;
    &::marker {
      color: #3b82f6;
    }
  }
}

@media (max-width: 768px) {
  .ai-details {
    grid-template-columns: 1fr;
  }
}
</style>
