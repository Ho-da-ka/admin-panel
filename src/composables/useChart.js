import { onBeforeUnmount, onMounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export function useChart(domRef, optionRef) {
  let chart = null

  onMounted(() => {
    chart = echarts.init(domRef.value)
    if (optionRef.value) chart.setOption(optionRef.value)
  })

  watch(optionRef, (val) => {
    if (val && chart) chart.setOption(val, true)
  }, { deep: true })

  onBeforeUnmount(() => chart?.dispose())
}
