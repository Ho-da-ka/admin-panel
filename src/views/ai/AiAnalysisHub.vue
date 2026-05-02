<template>
  <div class="page-panel">
    <div class="hub-header">
      <div>
        <h2 class="page-title">AI 智慧分析中心</h2>
        <p class="hub-subtitle">基于深度学习挖掘机构运营与学员成长的核心价值</p>
      </div>
      <el-button type="primary" size="large" class="premium-btn">
        <el-icon><DocumentChecked /></el-icon> 生成全校月度分析报告
      </el-button>
    </div>

    <el-row :gutter="24">
      <!-- 智慧看板 -->
      <el-col :span="16">
        <div class="info-grid" style="margin-bottom: 24px">
          <div class="stat-card purple">
            <div class="stat-label">AI 活跃分析学员</div>
            <div class="stat-value">128 <span class="unit">位</span></div>
            <div class="stat-footer">占总人数的 85%</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-label">智能总结生成量</div>
            <div class="stat-value">1.4k <span class="unit">条</span></div>
            <div class="stat-footer">本月环比 +12%</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-label">家长反馈好评度</div>
            <div class="stat-value">4.9 <span class="unit">/ 5.0</span></div>
            <div class="stat-footer">基于 300+ 评价</div>
          </div>
        </div>

        <el-card shadow="never" header="全校学员能力维度分布 (AI 聚合)">
          <div ref="radarRef" style="height: 400px" />
        </el-card>
      </el-col>

      <!-- 智能提醒流 -->
      <el-col :span="8">
        <el-card shadow="never" class="alert-card">
          <template #header>
            <div class="alert-header">
              <span>AI 实时成长发现</span>
              <el-tag size="small" type="danger" effect="dark">3 个重要提醒</el-tag>
            </div>
          </template>
          
          <div class="alert-list">
            <div v-for="(item, idx) in alerts" :key="idx" class="alert-item">
              <div class="alert-dot" :class="item.type" />
              <div class="alert-content">
                <div class="alert-title">{{ item.title }}</div>
                <p class="alert-desc">{{ item.desc }}</p>
                <el-button link type="primary" size="small">立即跟进</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { DocumentChecked } from '@element-plus/icons-vue'
import { useChart } from '../../composables/useChart'

const radarRef = ref(null)
const radarOption = ref(null)
useChart(radarRef, radarOption)

const alerts = [
  { type: 'high', title: '学员 王小明 爆发力显著提升', desc: '近三次体测立定跳远均有突破，AI 建议更新其训练计划。' },
  { type: 'medium', title: '班级 少年体能B班 活跃度下降', desc: '本周出勤率低于平均水平 15%，AI 建议分析原因。' },
  { type: 'low', title: '新生成长洞察已就绪', desc: '共有 15 位学员的月度总结已通过 AI 自动生成。' }
]

onMounted(() => {
  radarOption.value = {
    radar: {
      indicator: [
        { name: '爆发力', max: 100 },
        { name: '耐力', max: 100 },
        { name: '协调性', max: 100 },
        { name: '柔韧性', max: 100 },
        { name: '核心力量', max: 100 }
      ],
      shape: 'circle'
    },
    series: [{
      name: '能力分布',
      type: 'radar',
      data: [
        {
          value: [85, 70, 92, 65, 80],
          name: '全校平均',
          areaStyle: { color: 'rgba(59, 130, 246, 0.2)' },
          lineStyle: { color: '#3B82F6' }
        }
      ]
    }]
  }
})
</script>

<style scoped lang="scss">
.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.hub-subtitle {
  color: #64748b;
  font-size: 14px;
  margin-top: -12px;
}

.premium-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%);
  border: none;
  &:hover { opacity: 0.9; }
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  
  &.purple { border-left: 6px solid #a855f7; }
  &.blue { border-left: 6px solid #3b82f6; }
  &.amber { border-left: 6px solid #f59e0b; }
}

.stat-label { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; }
.stat-value { font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px; .unit { font-size: 14px; color: #64748b; } }
.stat-footer { font-size: 12px; color: #10b981; }

.alert-header { display: flex; justify-content: space-between; align-items: center; width: 100%; font-weight: 800; }
.alert-list { display: flex; flex-direction: column; gap: 20px; }
.alert-item { display: flex; gap: 16px; }
.alert-dot { width: 8px; height: 8px; border-radius: 4px; margin-top: 6px; flex-shrink: 0; 
  &.high { background: #ef4444; }
  &.medium { background: #f59e0b; }
  &.low { background: #10b981; }
}
.alert-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.alert-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px; }
</style>
