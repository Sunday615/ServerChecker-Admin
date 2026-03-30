<script setup lang="ts">
type LatestRun = null | {
  run_key: string
  generated_at: string
  overall_status: string
  total_hosts: number
  total_services: number
  total_failed: number
  total_web_failed: number
}

type RecentRun = {
  run_key: string
  generated_at: string
  overall_status: string
  total_hosts: number
  total_services: number
  total_failed: number
  total_web_failed: number
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
const issueMixChartRef = ref<HTMLElement | null>(null)
const failingSitesChartRef = ref<HTMLElement | null>(null)

let echartsModule: EChartsModule | null = null
let trendChart: EChartsInstance | null = null
let issueMixChart: EChartsInstance | null = null
let failingSitesChart: EChartsInstance | null = null
let resizeObserver: ResizeObserver | null = null
let themeRegistered = false

const resizeCharts = () => {
  trendChart?.resize()
  issueMixChart?.resize()
  failingSitesChart?.resize()
}

const chartSignature = computed(() => JSON.stringify({
  latestRun: props.latestRun?.run_key || '',
  failingServiceCount: props.failingServiceCount,
  failingWebCount: props.failingWebCount,
  recentRuns: props.recentRuns.map(run => [run.run_key, run.total_failed, run.total_web_failed, run.generated_at]),
  failingSites: props.failingSites.map(site => [site.site_name, site.failing_services])
}))

const totalOpenIssues = computed(() => props.failingServiceCount + props.failingWebCount)

const latestRunNote = computed(() => {
  if (!props.latestRun) {
    return 'Waiting for the first checker run.'
  }

  return `${props.latestRun.total_services} services across ${props.latestRun.total_hosts} hosts in the latest snapshot.`
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

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const axisLabelColor = '#62738d'
const splitLineColor = '#e8eef8'
const textColor = '#15253f'

const registerTheme = (echarts: EChartsModule) => {
  if (themeRegistered) {
    return
  }

  echarts.registerTheme('portalLight', {
    color: ['#173a8a', '#4c66ad', '#8ba0cf', '#d6e1f5'],
    backgroundColor: 'transparent',
    textStyle: {
      color: textColor,
      fontFamily: 'IBM Plex Sans, sans-serif'
    },
    title: {
      textStyle: {
        color: textColor,
        fontWeight: 600
      },
      subtextStyle: {
        color: axisLabelColor
      }
    },
    legend: {
      textStyle: {
        color: axisLabelColor
      }
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#d9e3f2',
      borderWidth: 1,
      textStyle: {
        color: textColor
      }
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: '#d4deec'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#d4deec'
        }
      },
      axisLabel: {
        color: axisLabelColor
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
        color: axisLabelColor
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor
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

const initChart = (element: HTMLElement | null, current: EChartsInstance | null) => {
  if (!element) {
    return null
  }

  if (current) {
    return current
  }

  if (!echartsModule) {
    return null
  }

  return echartsModule.init(element, 'portalLight', {
    renderer: 'canvas'
  })
}

const trendOption = () => {
  const runs = [...props.recentRuns]
    .slice(0, 10)
    .reverse()

  return {
    animationDuration: 600,
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 0,
      right: 0,
      icon: 'circle'
    },
    grid: {
      top: 48,
      left: 18,
      right: 10,
      bottom: 20,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: runs.map(run => formatChartDate(run.generated_at)),
      axisLabel: {
        color: axisLabelColor,
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: 'Service issues',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: runs.map(run => toNumber(run.total_failed)),
        lineStyle: {
          width: 3,
          color: '#173a8a'
        },
        itemStyle: {
          color: '#173a8a',
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
              { offset: 0, color: 'rgba(23, 58, 138, 0.28)' },
              { offset: 1, color: 'rgba(23, 58, 138, 0.03)' }
            ]
          }
        }
      },
      {
        name: 'Web issues',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: runs.map(run => toNumber(run.total_web_failed)),
        lineStyle: {
          width: 3,
          color: '#4c66ad'
        },
        itemStyle: {
          color: '#4c66ad',
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
              { offset: 0, color: 'rgba(76, 102, 173, 0.2)' },
              { offset: 1, color: 'rgba(76, 102, 173, 0.02)' }
            ]
          }
        }
      }
    ]
  }
}

const issueMixOption = () => {
  const serviceIssues = props.failingServiceCount
  const webIssues = props.failingWebCount
  const hasIssues = serviceIssues + webIssues > 0
  const seriesData = hasIssues
    ? [
        { value: serviceIssues, name: 'Service issues' },
        { value: webIssues, name: 'Web issues' }
      ]
    : [
        {
          value: 1,
          name: 'Stable',
          itemStyle: {
            color: '#d8e3f6'
          }
        }
      ]

  return {
    animationDuration: 600,
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle'
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: hasIssues ? `${totalOpenIssues.value}\nopen issues` : 'Stable\nlatest run',
          textAlign: 'center',
          fill: textColor,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 24,
          fontFamily: 'IBM Plex Sans, sans-serif'
        }
      }
    ],
    series: [
      {
        type: 'pie',
        radius: ['58%', '76%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        label: {
          show: false
        },
        emphasis: {
          scale: false
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 4
        },
        data: seriesData
      }
    ]
  }
}

const failingSitesOption = () => {
  const sites = [...props.failingSites]
    .slice(0, 6)
    .map(site => ({
      name: site.site_name,
      value: toNumber(site.failing_services)
    }))

  const preparedSites = sites.length > 0 ? sites : [{ name: 'All clear', value: 0 }]
  const maxValue = Math.max(...preparedSites.map(site => site.value), 1)

  return {
    animationDuration: 600,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 12,
      left: 12,
      right: 12,
      bottom: 8,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: maxValue,
      minInterval: 1
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: preparedSites.map(site => site.name),
      axisTick: {
        show: false
      }
    },
    series: [
      {
        type: 'bar',
        data: preparedSites.map(site => site.value),
        barWidth: 14,
        itemStyle: {
          borderRadius: [999, 999, 999, 999],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#173a8a' },
              { offset: 1, color: '#7c95d8' }
            ]
          }
        },
        label: {
          show: true,
          position: 'right',
          color: axisLabelColor,
          formatter: '{c}'
        }
      }
    ]
  }
}

const renderCharts = async () => {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  await getEcharts()

  trendChart = initChart(trendChartRef.value, trendChart)
  issueMixChart = initChart(issueMixChartRef.value, issueMixChart)
  failingSitesChart = initChart(failingSitesChartRef.value, failingSitesChart)

  trendChart?.setOption(trendOption(), true)
  issueMixChart?.setOption(issueMixOption(), true)
  failingSitesChart?.setOption(failingSitesOption(), true)

  resizeCharts()

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      resizeCharts()
    })

    ;[trendChartRef.value, issueMixChartRef.value, failingSitesChartRef.value]
      .filter((element): element is HTMLElement => Boolean(element))
      .forEach(element => resizeObserver?.observe(element))
  }
}

const disposeCharts = () => {
  resizeObserver?.disconnect()
  resizeObserver = null

  trendChart?.dispose()
  issueMixChart?.dispose()
  failingSitesChart?.dispose()

  trendChart = null
  issueMixChart = null
  failingSitesChart = null
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
  <section class="dashboard-charts">
    <article class="chart-card chart-card--trend">
      <div class="chart-card__header">
        <div>
          <span class="section-kicker">Trends</span>
          <h2 class="chart-card__title">
            Failure trend
          </h2>
          <p class="chart-card__note">
            Service and web issues from the last 10 checker runs.
          </p>
        </div>

        <div class="chart-card__meta">
          {{ latestRunNote }}
        </div>
      </div>

      <div
        ref="trendChartRef"
        class="chart-card__canvas chart-card__canvas--lg"
      />
    </article>

    <div class="dashboard-charts__stack">
      <article class="chart-card">
        <div class="chart-card__header">
          <div>
            <span class="section-kicker">Current mix</span>
            <h2 class="chart-card__title">
              Active issues
            </h2>
            <p class="chart-card__note">
              Latest snapshot split between service and web monitoring.
            </p>
          </div>
        </div>

        <div
          ref="issueMixChartRef"
          class="chart-card__canvas"
        />
      </article>

      <article class="chart-card">
        <div class="chart-card__header">
          <div>
            <span class="section-kicker">Site ranking</span>
            <h2 class="chart-card__title">
              Failing sites
            </h2>
            <p class="chart-card__note">
              Sites with the most open service issues right now.
            </p>
          </div>
        </div>

        <div
          ref="failingSitesChartRef"
          class="chart-card__canvas chart-card__canvas--sm"
        />
      </article>
    </div>
  </section>
</template>
