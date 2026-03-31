<script setup lang="ts">
type LatestRun = null | {
  run_key: string
  generated_at: string
  overall_status: string
  total_hosts: number | string
  total_services: number | string
  total_passed: number | string
  total_failed: number | string
  total_web_checks: number | string
  total_web_passed: number | string
  total_web_failed: number | string
}

type RecentRun = {
  run_key: string
  generated_at: string
  overall_status: string
  total_hosts: number | string
  total_services: number | string
  total_passed: number | string
  total_failed: number | string
  total_web_checks: number | string
  total_web_passed: number | string
  total_web_failed: number | string
}

type FailingSite = {
  site_name: string
  failing_services: number | string
}

type EChartsModule = typeof import('echarts')
type EChartsInstance = import('echarts').ECharts

const props = defineProps<{
  latestRun: LatestRun
  recentRuns: RecentRun[]
  failingSites: FailingSite[]
  failingServiceCount: number
  failingWebCount: number
}>()

const volumeChartRef = ref<HTMLElement | null>(null)
const pressureChartRef = ref<HTMLElement | null>(null)

let echartsModule: EChartsModule | null = null
let volumeChart: EChartsInstance | null = null
let pressureChart: EChartsInstance | null = null
let resizeObserver: ResizeObserver | null = null
let themeRegistered = false

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const preparedRuns = computed(() => {
  const runs = [...props.recentRuns]
    .slice(0, 10)
    .reverse()

  if (runs.length) {
    return runs
  }

  return [
    {
      run_key: 'no-data',
      generated_at: '',
      overall_status: 'IDLE',
      total_hosts: 0,
      total_services: 0,
      total_passed: 0,
      total_failed: 0,
      total_web_checks: 0,
      total_web_passed: 0,
      total_web_failed: 0
    }
  ]
})

const chartSignature = computed(() => JSON.stringify({
  latestRun: props.latestRun?.run_key || '',
  recentRuns: preparedRuns.value.map(run => [
    run.run_key,
    run.generated_at,
    run.total_passed,
    run.total_web_passed,
    run.total_failed,
    run.total_web_failed
  ]),
  failingSites: props.failingSites.map(site => [site.site_name, site.failing_services]),
  failingServiceCount: props.failingServiceCount,
  failingWebCount: props.failingWebCount
}))

const latestPassingChecks = computed(() => {
  return toNumber(props.latestRun?.total_passed) + toNumber(props.latestRun?.total_web_passed)
})

const totalOpenIssues = computed(() => props.failingServiceCount + props.failingWebCount)

const highlightedSites = computed(() => props.failingSites.slice(0, 3))

const coverageNote = computed(() => {
  if (!props.latestRun) {
    return 'Waiting for the first synchronized snapshot from the checker backend.'
  }

  const hostCount = toNumber(props.latestRun.total_hosts)
  const monitorCount = toNumber(props.latestRun.total_services) + toNumber(props.latestRun.total_web_checks)

  return `${hostCount} hosts and ${monitorCount} checks were synchronized in the latest run.`
})

const pressureNote = computed(() => {
  const hotspot = highlightedSites.value[0]

  if (!totalOpenIssues.value) {
    return 'No active alerts were detected across the current snapshot.'
  }

  if (!hotspot) {
    return `${totalOpenIssues.value} live alerts require review.`
  }

  return `${totalOpenIssues.value} live alerts require review, led by ${hotspot.site_name}.`
})

const formatAxisDate = (value: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatTooltipDate = (value: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const registerTheme = (echarts: EChartsModule) => {
  if (themeRegistered) {
    return
  }

  echarts.registerTheme('portalAdmin', {
    color: ['#5a51f6', '#8f88ff', '#dfe3f3', '#22c55e'],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#111827',
      fontFamily: 'Manrope, sans-serif'
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7f0',
      borderWidth: 1,
      textStyle: {
        color: '#111827'
      }
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: '#e7eaf4'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#8a92a8'
      },
      splitLine: {
        show: false
      }
    },
    valueAxis: {
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#8a92a8'
      },
      splitLine: {
        lineStyle: {
          color: '#eef1f8'
        }
      }
    }
  })

  themeRegistered = true
}

const getEcharts = async () => {
  if (!echartsModule) {
    echartsModule = await import('echarts')
    registerTheme(echartsModule)
  }

  return echartsModule
}

const ensureChart = (
  current: EChartsInstance | null,
  element: HTMLElement | null
) => {
  if (!element || !echartsModule) {
    return null
  }

  if (current) {
    return current
  }

  return echartsModule.init(element, 'portalAdmin', {
    renderer: 'canvas'
  })
}

const volumeOption = () => {
  const runs = preparedRuns.value
  const totalChecks = runs.map(run => toNumber(run.total_services) + toNumber(run.total_web_checks))
  const passingChecks = runs.map(run => toNumber(run.total_passed) + toNumber(run.total_web_passed))

  return {
    animationDuration: 700,
    animationEasing: 'cubicOut' as const,
    tooltip: {
      trigger: 'axis',
      formatter: (items: Array<{ axisValue: string, data: number, seriesName: string, dataIndex: number }>) => {
        const point = items[0]
        const run = runs[point?.dataIndex || 0]
        const lines = items.map(item => `${item.seriesName}: ${item.data}`)
        return [formatTooltipDate(run?.generated_at || ''), ...lines].join('<br>')
      }
    },
    grid: {
      top: 24,
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: runs.map(run => formatAxisDate(run.generated_at))
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: 'Total checks',
        type: 'bar',
        silent: true,
        barWidth: 24,
        barGap: '-100%',
        data: totalChecks,
        itemStyle: {
          color: '#eef1f7',
          borderRadius: [12, 12, 8, 8]
        },
        emphasis: {
          disabled: true
        }
      },
      {
        name: 'Passing checks',
        type: 'bar',
        barWidth: 24,
        data: passingChecks,
        itemStyle: {
          color: '#5a51f6',
          borderRadius: [12, 12, 8, 8]
        }
      }
    ]
  }
}

const pressureOption = () => {
  const runs = preparedRuns.value

  return {
    animationDuration: 760,
    animationEasing: 'cubicOut' as const,
    tooltip: {
      trigger: 'axis',
      formatter: (items: Array<{ data: number, dataIndex: number }>) => {
        const point = items[0]
        const run = runs[point?.dataIndex || 0]
        return `${formatTooltipDate(run?.generated_at || '')}<br>Open alerts: ${point?.data || 0}`
      }
    },
    grid: {
      top: 16,
      left: 4,
      right: 4,
      bottom: 12,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: runs.map(run => formatAxisDate(run.generated_at))
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: 'Open alerts',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: runs.map(run => toNumber(run.total_failed) + toNumber(run.total_web_failed)),
        lineStyle: {
          width: 3,
          color: '#5a51f6'
        },
        itemStyle: {
          color: '#ffffff',
          borderColor: '#5a51f6',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(90, 81, 246, 0.22)' },
              { offset: 1, color: 'rgba(90, 81, 246, 0.02)' }
            ]
          }
        }
      }
    ]
  }
}

const resizeCharts = () => {
  volumeChart?.resize()
  pressureChart?.resize()
}

const renderCharts = async () => {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  await getEcharts()

  volumeChart = ensureChart(volumeChart, volumeChartRef.value)
  pressureChart = ensureChart(pressureChart, pressureChartRef.value)

  volumeChart?.setOption(volumeOption(), true)
  pressureChart?.setOption(pressureOption(), true)
  resizeCharts()

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      resizeCharts()
    })
  }

  if (volumeChartRef.value) {
    resizeObserver.observe(volumeChartRef.value)
  }

  if (pressureChartRef.value) {
    resizeObserver.observe(pressureChartRef.value)
  }
}

const disposeCharts = () => {
  resizeObserver?.disconnect()
  resizeObserver = null

  volumeChart?.dispose()
  pressureChart?.dispose()
  volumeChart = null
  pressureChart = null
}

watch(chartSignature, () => {
  renderCharts()
})

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeCharts()
})
</script>

<template>
  <section class="dashboard-analytics">
    <article class="panel-card chart-card chart-card--wide">
      <div class="chart-card__header">
        <div>
          <span class="section-kicker">Run coverage</span>
          <h2 class="panel-card__title">
            Passing checks across recent runs
          </h2>
          <p class="chart-card__note">
            {{ coverageNote }}
          </p>
        </div>

        <div class="chart-card__summary">
          <span class="chart-card__summary-label">Currently passing</span>
          <strong class="chart-card__summary-value">{{ latestPassingChecks }}</strong>
          <span class="chart-card__chip">Last {{ preparedRuns.length }} runs</span>
        </div>
      </div>

      <div
        ref="volumeChartRef"
        class="chart-card__canvas chart-card__canvas--lg"
      />
    </article>

    <article class="panel-card chart-card chart-card--narrow">
      <div class="chart-card__header">
        <div>
          <span class="section-kicker">Alert pressure</span>
          <h2 class="panel-card__title">
            Incident trend
          </h2>
          <p class="chart-card__note">
            {{ pressureNote }}
          </p>
        </div>

        <div class="chart-card__summary chart-card__summary--inline">
          <span class="chart-card__summary-label">Open alerts</span>
          <strong class="chart-card__summary-value">{{ totalOpenIssues }}</strong>
        </div>
      </div>

      <div
        ref="pressureChartRef"
        class="chart-card__canvas chart-card__canvas--md"
      />

      <div
        v-if="highlightedSites.length"
        class="chart-card__legend"
      >
        <span
          v-for="site in highlightedSites"
          :key="site.site_name"
          class="chart-card__legend-item"
        >
          <strong>{{ site.site_name }}</strong>
          <span>{{ toNumber(site.failing_services) }} open</span>
        </span>
      </div>
    </article>
  </section>
</template>
