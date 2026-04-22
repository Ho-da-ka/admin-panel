import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export function useChart(domRef, optionRef) {
  let chart = null
  let currentDom = null

  function disposeChart() {
    chart?.dispose()
    chart = null
    currentDom = null
  }

  function ensureChart() {
    const dom = domRef.value
    if (!dom) return

    if (!chart || currentDom !== dom) {
      disposeChart()
      chart = echarts.init(dom)
      currentDom = dom
    }

    if (optionRef.value) {
      chart.setOption(optionRef.value, true)
    }
  }

  onMounted(async () => {
    await nextTick()
    ensureChart()
  })

  watch(
    () => domRef.value,
    async (dom) => {
      if (!dom) {
        disposeChart()
        return
      }
      await nextTick()
      ensureChart()
    },
    { flush: 'post' }
  )

  watch(
    optionRef,
    async (value) => {
      if (!value) return
      await nextTick()
      ensureChart()
    },
    { deep: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    disposeChart()
  })
}
