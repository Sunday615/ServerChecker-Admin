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
  stable_services?: number | string
  monitored_services?: number | string
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

const summaryChartRef = ref<HTMLElement | null>(null)
const scoreChartRef = ref<HTMLElement | null>(null)
const mixChartRef = ref<HTMLElement | null>(null)

let echartsModule: EChartsModule | null = null
let summaryChart: EChartsInstance | null = null
let scoreChart: EChartsInstance | null = null
let mixChart: EChartsInstance | null = null
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

const totalMonitorCount = computed(() => {
  return toNumber(props.latestRun?.total_services) + toNumber(props.latestRun?.total_web_checks)
})

const healthyMonitorCount = computed(() => {
  return Math.max(totalMonitorCount.value - props.failingServiceCount - props.failingWebCount, 0)
})

const totalThreatCount = computed(() => props.failingServiceCount + props.failingWebCount)

const riskScore = computed(() => {
  if (!totalMonitorCount.value) {
    return 0
  }

  return Math.min(Math.round((totalThreatCount.value / totalMonitorCount.value) * 1000), 1000)
})

const riskBand = computed(() => {
  if (riskScore.value >= 750) {
    return 'Critical'
  }

  if (riskScore.value >= 500) {
    return 'High'
  }

  if (riskScore.value >= 250) {
    return 'Guarded'
  }

  return 'Low'
})

const hotspotSites = computed(() => {
  return props.failingSites
    .slice(0, 4)
    .map(site => {
      const failing = toNumber(site.failing_services)
      const monitored = Math.max(toNumber(site.monitored_services), failing, 1)
      const stable = Math.max(toNumber(site.stable_services), 0)

      return {
        site_name: site.site_name,
        failing,
        stable,
        monitored,
        width: `${Math.min((failing / monitored) * 100, 100)}%`
      }
    })
})

const mixLegend = computed(() => {
  return [
    {
      label: 'Service Alerts',
      value: props.failingServiceCount,
      tone: 'pink'
    },
    {
      label: 'Web Alerts',
      value: props.failingWebCount,
      tone: 'cyan'
    },
    {
      label: 'Healthy Coverage',
      value: healthyMonitorCount.value,
      tone: 'purple'
    }
  ]
})

const chartSignature = computed(() => JSON.stringify({
  latestRun: props.latestRun?.run_key || '',
  recentRuns: preparedRuns.value.map(run => [
    run.run_key,
    run.generated_at,
    run.total_failed,
    run.total_web_failed,
    run.total_services,
    run.total_web_checks
  ]),
  failingSites: props.failingSites.map(site => [
    site.site_name,
    site.failing_services,
    site.stable_services,
    site.monitored_services
  ]),
  failingServiceCount: props.failingServiceCount,
  failingWebCount: props.failingWebCount
}))

const summaryNote = computed(() => {
  if (!props.latestRun) {
    return 'Waiting for the first synchronized snapshot from the checker backend.'
  }

  return `${toNumber(props.latestRun.total_hosts)} hosts and ${totalMonitorCount.value} monitors were analyzed in the latest run.`
})

const hotspotNote = computed(() => {
  const hotspot = hotspotSites.value[0]

  if (!hotspot) {
    return 'No hot sites detected. Coverage is currently stable.'
  }

  return `${hotspot.site_name} is carrying the highest active pressure with ${hotspot.failing} open findings.`
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

  echarts.registerTheme('portalDarkThreat', {
    color: ['#af6cff', '#33d8ff', '#ff5ca8', '#ffb347'],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#f6f8ff',
      fontFamily: 'Manrope, sans-serif'
    },
    tooltip: {
      backgroundColor: '#10192d',
      borderColor: 'rgba(173, 184, 255, 0.14)',
      borderWidth: 1,
      textStyle: {
        color: '#f6f8ff'
      }
    },
    categoryAxis: {
      axisLine: {
        lineStyle: {
          color: 'rgba(173, 184, 255, 0.14)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#8d97ba'
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
        color: '#8d97ba'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(173, 184, 255, 0.09)'
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

const ensureChart = (current: EChartsInstance | null, element: HTMLElement | null) => {
  if (!element || !echartsModule) {
    return null
  }

  if (current) {
    return current
  }

  return echartsModule.init(element, 'portalDarkThreat', {
    renderer: 'canvas'
  })
}

const summaryOption = () => {
  const runs = preparedRuns.value
  const pressureSeries = runs.map(run => toNumber(run.total_failed) + toNumber(run.total_web_failed))

  return {
    animationDuration: 720,
    animationEasing: 'cubicOut' as const,
    tooltip: {
      trigger: 'axis',
      formatter: (items: Array<{ data: number, dataIndex: number }>) => {
        const point = items[0]
        const run = runs[point?.dataIndex || 0]
        return `${formatTooltipDate(run?.generated_at || '')}<br>Threat pressure: ${point?.data || 0}`
      }
    },
    grid: {
      top: 24,
      left: 4,
      right: 6,
      bottom: 10,
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
        name: 'Threat pressure',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: pressureSeries,
        lineStyle: {
          width: 4,
          color: '#af6cff'
        },
        itemStyle: {
          color: '#170d31',
          borderColor: '#e5d3ff',
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
              { offset: 0, color: 'rgba(175, 108, 255, 0.26)' },
              { offset: 1, color: 'rgba(175, 108, 255, 0.02)' }
            ]
          }
        }
      }
    ]
  }
}

const scoreOption = () => {
  return {
    animationDuration: 820,
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 1000,
        progress: {
          show: true,
          width: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#ff8a4d' },
                { offset: 0.58, color: '#ff5ca8' },
                { offset: 1, color: '#af6cff' }
              ]
            }
          }
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, 'rgba(173, 184, 255, 0.12)']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          distance: 18,
          color: '#7f89ac',
          fontSize: 11
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '10%'],
          formatter: (value: number) => `${Math.round(Number(value))}`,
          color: '#f6f8ff',
          fontSize: 28,
          fontWeight: 800
        },
        title: {
          offsetCenter: [0, '-18%'],
          color: '#8d97ba',
          fontSize: 12
        },
        data: [
          {
            value: riskScore.value,
            name: 'Risk score'
          }
        ]
      }
    ]
  }
}

const mixOption = () => {
  return {
    animationDuration: 720,
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderColor: '#0f1629',
          borderWidth: 4
        },
        label: {
          show: false
        },
        emphasis: {
          scale: false
        },
        data: [
          {
            value: props.failingServiceCount,
            name: 'Service Alerts',
            itemStyle: {
              color: '#ff5ca8'
            }
          },
          {
            value: props.failingWebCount,
            name: 'Web Alerts',
            itemStyle: {
              color: '#33d8ff'
            }
          },
          {
            value: healthyMonitorCount.value,
            name: 'Healthy Coverage',
            itemStyle: {
              color: '#8f63ff'
            }
          }
        ]
      }
    ]
  }
}

const resizeCharts = () => {
  summaryChart?.resize()
  scoreChart?.resize()
  mixChart?.resize()
}

const renderCharts = async () => {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  await getEcharts()

  summaryChart = ensureChart(summaryChart, summaryChartRef.value)
  scoreChart = ensureChart(scoreChart, scoreChartRef.value)
  mixChart = ensureChart(mixChart, mixChartRef.value)

  summaryChart?.setOption(summaryOption(), true)
  scoreChart?.setOption(scoreOption(), true)
  mixChart?.setOption(mixOption(), true)
  resizeCharts()

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      resizeCharts()
    })
  }

  if (summaryChartRef.value) {
    resizeObserver.observe(summaryChartRef.value)
  }

  if (scoreChartRef.value) {
    resizeObserver.observe(scoreChartRef.value)
  }

  if (mixChartRef.value) {
    resizeObserver.observe(mixChartRef.value)
  }
}

const disposeCharts = () => {
  resizeObserver?.disconnect()
  resizeObserver = null

  summaryChart?.dispose()
  scoreChart?.dispose()
  mixChart?.dispose()
  summaryChart = null
  scoreChart = null
  mixChart = null
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
    <article class="panel-card chart-card chart-card--summary">
      <div class="chart-card__header">
        <div>
          <span class="section-kicker">Threat Summary</span>
          <h2 class="panel-card__title">
            Pressure across recent runs
          </h2>
          <p class="chart-card__note">
            {{ summaryNote }}
          </p>
        </div>

        <span class="chart-card__chip">Daily</span>
      </div>

      <div
        ref="summaryChartRef"
        class="chart-card__canvas chart-card__canvas--summary"
      />
    </article>

    <div class="dashboard-analytics__stack">
      <article class="panel-card chart-card chart-card--score">
        <div class="chart-card__header">
          <div>
            <span class="section-kicker">Risk Score</span>
            <h2 class="panel-card__title">
              Escalation score
            </h2>
          </div>

          <span class="score-card__badge">{{ riskBand }}</span>
        </div>

        <div
          ref="scoreChartRef"
          class="chart-card__canvas chart-card__canvas--score"
        />
      </article>

      <article class="panel-card chart-card chart-card--mix">
        <div class="chart-card__header">
          <div>
            <span class="section-kicker">Threat Mix</span>
            <h2 class="panel-card__title">
              Attack surface split
            </h2>
          </div>
        </div>

        <div
          ref="mixChartRef"
          class="chart-card__canvas chart-card__canvas--mix"
        />

        <div class="legend-list">
          <span
            v-for="item in mixLegend"
            :key="item.label"
            class="legend-item"
          >
            <span :class="['legend-item__dot', `legend-item__dot--${item.tone}`]" />
            <strong>{{ item.label }}</strong>
            <span>{{ item.value }}</span>
          </span>
        </div>
      </article>
    </div>

    <article class="panel-card watchlist-card">
      <div class="panel-card__header">
        <div>
          <span class="section-kicker">Threat by Site</span>
          <h2 class="panel-card__title">
            Highest pressure zones
          </h2>
          <p class="panel-card__subtext">
            {{ hotspotNote }}
          </p>
        </div>

        <span class="chart-card__chip">Live</span>
      </div>

      <div class="watchlist-grid">
        <div
          v-for="site in hotspotSites"
          :key="site.site_name"
          class="watchlist-item"
        >
          <div class="watchlist-item__top">
            <strong>{{ site.site_name }}</strong>
            <span>{{ site.failing }}/{{ site.monitored }}</span>
          </div>

          <div class="watchlist-item__bar">
            <span
              class="watchlist-item__fill"
              :style="{ width: site.width }"
            />
          </div>

          <p>
            {{ site.stable }} stable checks remain in this zone.
          </p>
        </div>

        <div
          v-if="hotspotSites.length === 0"
          class="watchlist-item watchlist-item--empty"
        >
          <strong>All monitored sites are stable</strong>
          <p>No hotspot pressure is visible in the latest snapshot.</p>
        </div>
      </div>
    </article>
  </section>
</template>
