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

const trendChartRef = ref<HTMLElement | null>(null)

let echartsModule: EChartsModule | null = null
let trendChart: EChartsInstance | null = null
let resizeObserver: ResizeObserver | null = null
let themeRegistered = false

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const chartSignature = computed(() => JSON.stringify({
  latestRun: props.latestRun?.run_key || '',
  failingServiceCount: props.failingServiceCount,
  failingWebCount: props.failingWebCount,
  recentRuns: props.recentRuns.map(run => [
    run.run_key,
    run.generated_at,
    run.total_failed,
    run.total_web_failed
  ]),
  failingSites: props.failingSites.map(site => [site.site_name, site.failing_services])
}))

const totalOpenIssues = computed(() => props.failingServiceCount + props.failingWebCount)

const latestRunNote = computed(() => {
  if (!props.latestRun) {
    return 'Waiting for the first checker snapshot.'
  }

  const monitorCount = toNumber(props.latestRun.total_services) + toNumber(props.latestRun.total_web_checks)
  return `${toNumber(props.latestRun.total_hosts)} hosts and ${monitorCount} live monitors in the latest run.`
})

const topHotspot = computed(() => {
  const site = props.failingSites[0]
  if (!site) {
    return 'All monitored sites are stable.'
  }

  return `${site.site_name} has ${toNumber(site.failing_services)} active service issues.`
})

const formatChartDate = (value: string) => {
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

  echarts.registerTheme('portalCommand', {
    color: ['#4f5dff', '#6db8ff', '#a4b4ff', '#dbe2ff'],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#1a2147',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    },
    title: {
      textStyle: {
        color: '#1a2147',
        fontWeight: 700
      },
      subtextStyle: {
        color: '#7f88ab'
      }
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#dbe2ff',
      borderWidth: 1,
      textStyle: {
        color: '#1a2147'
      }
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: '#d9e0f6'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#7f88ab'
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
        color: '#7f88ab'
      },
      splitLine: {
        lineStyle: {
          color: '#ecf0fb'
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

const ensureChart = (element: HTMLElement | null) => {
  if (!element || !echartsModule) {
    return null
  }

  if (trendChart) {
    return trendChart
  }

  trendChart = echartsModule.init(element, 'portalCommand', {
    renderer: 'canvas'
  })

  return trendChart
}

const trendOption = () => {
  const runs = [...props.recentRuns]
    .slice(0, 10)
    .reverse()

  const preparedRuns = runs.length > 0
    ? runs
    : [
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

  return {
    animationDuration: 700,
    animationEasing: 'cubicOut' as const,
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 6,
      right: 0,
      icon: 'circle',
      textStyle: {
        color: '#6d7697'
      }
    },
    grid: {
      top: 56,
      left: 18,
      right: 16,
      bottom: 28,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: preparedRuns.map(run => formatChartDate(run.generated_at))
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: 'Service alerts',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 9,
        data: preparedRuns.map(run => toNumber(run.total_failed)),
        lineStyle: {
          width: 4,
          color: '#4f5dff'
        },
        itemStyle: {
          color: '#4f5dff',
          borderColor: '#ffffff',
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
              { offset: 0, color: 'rgba(79, 93, 255, 0.28)' },
              { offset: 1, color: 'rgba(79, 93, 255, 0.02)' }
            ]
          }
        }
      },
      {
        name: 'Web alerts',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: preparedRuns.map(run => toNumber(run.total_web_failed)),
        lineStyle: {
          width: 3,
          color: '#6db8ff'
        },
        itemStyle: {
          color: '#6db8ff',
          borderColor: '#ffffff',
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
              { offset: 0, color: 'rgba(109, 184, 255, 0.18)' },
              { offset: 1, color: 'rgba(109, 184, 255, 0.02)' }
            ]
          }
        }
      }
    ]
  }
}

const resizeChart = () => {
  trendChart?.resize()
}

const renderCharts = async () => {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  await getEcharts()

  const chart = ensureChart(trendChartRef.value)
  chart?.setOption(trendOption(), true)
  resizeChart()

  if (!resizeObserver && trendChartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeChart()
    })

    resizeObserver.observe(trendChartRef.value)
  }
}

const disposeCharts = () => {
  resizeObserver?.disconnect()
  resizeObserver = null

  trendChart?.dispose()
  trendChart = null
}

watch(chartSignature, () => {
  renderCharts()
})

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  disposeCharts()
})
</script>

<template>
  <section class="dashboard-analytics">
    <article class="panel-card chart-card chart-card--trend">
      <div class="chart-card__header">
        <div>
          <span class="section-kicker">Incident Trend</span>
          <h2 class="panel-card__title">
            Alerts across recent checker runs
          </h2>
          <p class="chart-card__note">
            {{ latestRunNote }}
          </p>
        </div>

        <div class="chart-card__summary">
          <span>Open alerts</span>
          <strong>{{ totalOpenIssues }}</strong>
          <p>{{ topHotspot }}</p>
        </div>
      </div>

      <div
        ref="trendChartRef"
        class="chart-card__canvas chart-card__canvas--lg"
      />
    </article>
  </section>
</template>
