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

type DashboardResponse = {
  databaseOnline: boolean
  message: string
  totalSiteCount: number
  latestRun: LatestRun
  failingServiceCount: number
  failingWebCount: number
  failingSites: Array<{
    site_name: string
    failing_services: number | string
    stable_services: number | string
    monitored_services: number | string
  }>
  failingServices: Array<{
    service_result_id: number
    run_key: string
    generated_at: string
    site_name: string
    host_address: string
    host_display_name: string
    service_name: string
    check_profile_name: string
    status: string
    connection_error: string
    service_report_html_path: string
    service_screenshot_file: string
  }>
  failingWebChecks: Array<{
    web_result_id: number
    run_key: string
    generated_at: string
    site_name: string
    target_name: string
    target_url: string
    final_url: string
    status: string
    message: string
    screenshot_file: string
    web_report_html_path: string
  }>
  recentRuns: Array<NonNullable<LatestRun>>
}

type ReportsResponse = {
  databaseOnline: boolean
  message: string
  latestRun: null | {
    id: number
    run_key: string
    generated_at: string
    overall_status: string
    web_summary_report_path: string
  }
  siteReports: Array<{
    site_name: string
    report_html_path: string
    summary_screenshot_file: string
  }>
}

type RailItem = {
  id: string
  icon: string
  title: string
  subtitle: string
  note: string
  status: string
  tag: string
  href: string
  generatedAt: string
}

type ReportCard = {
  key: string
  title: string
  note: string
  href: string
  icon: string
}

const { formatDate, artifactUrl } = usePortalUtils()

useSeoMeta({
  title: 'Dashboard',
  description: 'Live monitoring dashboard powered by the Python server checker and MySQL-backed Nuxt API routes.'
})

const emptyDashboardResponse = (): DashboardResponse => ({
  databaseOnline: true,
  message: '',
  totalSiteCount: 0,
  latestRun: null,
  failingServiceCount: 0,
  failingWebCount: 0,
  failingSites: [],
  failingServices: [],
  failingWebChecks: [],
  recentRuns: []
})

const emptyReportsResponse = (): ReportsResponse => ({
  databaseOnline: true,
  message: '',
  latestRun: null,
  siteReports: []
})

const { data, refresh: refreshDashboard } = await useFetch<DashboardResponse>('/api/dashboard/summary', {
  default: emptyDashboardResponse
})

const { data: reports, refresh: refreshReports } = await useFetch<ReportsResponse>('/api/reports/latest', {
  default: emptyReportsResponse
})

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const greeting = computed(() => {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
})

const latestRun = computed(() => data.value.latestRun)

const totalServiceCount = computed(() => toNumber(latestRun.value?.total_services))
const totalWebCount = computed(() => toNumber(latestRun.value?.total_web_checks))
const totalIssues = computed(() => data.value.failingServiceCount + data.value.failingWebCount)
const totalMonitors = computed(() => totalServiceCount.value + totalWebCount.value)
const stableServiceCount = computed(() => Math.max(totalServiceCount.value - data.value.failingServiceCount, 0))
const stableWebCount = computed(() => Math.max(totalWebCount.value - data.value.failingWebCount, 0))
const totalPassing = computed(() => stableServiceCount.value + stableWebCount.value)

const serviceHealth = computed(() => {
  if (!totalServiceCount.value) {
    return 0
  }

  return Math.round((stableServiceCount.value / totalServiceCount.value) * 100)
})

const webHealth = computed(() => {
  if (!totalWebCount.value) {
    return 0
  }

  return Math.round((stableWebCount.value / totalWebCount.value) * 100)
})

const overallHealth = computed(() => {
  if (!totalMonitors.value) {
    return 0
  }

  return Math.round((totalPassing.value / totalMonitors.value) * 100)
})

const railFeed = computed<RailItem[]>(() => {
  const serviceItems = data.value.failingServices.map(item => ({
    id: `service-${item.service_result_id}`,
    icon: 'i-lucide-server',
    title: item.service_name,
    subtitle: `${item.site_name} • ${item.host_display_name || item.host_address}`,
    note: item.connection_error || `Check profile: ${item.check_profile_name || 'default'}`,
    status: item.status,
    tag: 'Service',
    href: artifactUrl(item.service_report_html_path || item.service_screenshot_file),
    generatedAt: item.generated_at
  }))

  const webItems = data.value.failingWebChecks.map(item => ({
    id: `web-${item.web_result_id}`,
    icon: 'i-lucide-globe',
    title: item.target_name,
    subtitle: `${item.site_name} • ${item.target_url}`,
    note: item.message || (item.final_url ? `Final URL: ${item.final_url}` : 'Browser check needs attention'),
    status: item.status,
    tag: 'Web',
    href: artifactUrl(item.web_report_html_path || item.screenshot_file),
    generatedAt: item.generated_at
  }))

  return [...serviceItems, ...webItems]
    .sort((left, right) => new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime())
    .slice(0, 8)
})

const recentRunChips = computed(() => {
  return data.value.recentRuns.slice(0, 6).map((run, index) => {
    const date = new Date(run.generated_at)
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date

    return {
      key: run.run_key,
      active: index === 0,
      day: new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(safeDate),
      month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(safeDate)
    }
  })
})

const coverageSegments = computed(() => {
  const stableServices = stableServiceCount.value
  const stableWeb = stableWebCount.value
  const activeAlerts = totalIssues.value
  const total = stableServices + stableWeb + activeAlerts || 1

  return [
    {
      label: 'Healthy services',
      count: stableServices,
      tone: 'primary',
      width: `${(stableServices / total) * 100}%`
    },
    {
      label: 'Healthy web',
      count: stableWeb,
      tone: 'secondary',
      width: `${(stableWeb / total) * 100}%`
    },
    {
      label: 'Active alerts',
      count: activeAlerts,
      tone: 'warning',
      width: `${(activeAlerts / total) * 100}%`
    }
  ]
})

const siteTags = computed(() => {
  return data.value.failingSites
    .slice(0, 4)
    .map(site => ({
      site_name: site.site_name,
      failing_services: toNumber(site.failing_services),
      monitored_services: toNumber(site.monitored_services)
    }))
})

const reportCards = computed<ReportCard[]>(() => {
  const items: ReportCard[] = []

  if (reports.value.latestRun?.web_summary_report_path) {
    items.push({
      key: 'web-summary',
      title: 'Latest web summary',
      note: reports.value.latestRun.run_key,
      href: artifactUrl(reports.value.latestRun.web_summary_report_path),
      icon: 'i-lucide-file-text'
    })
  }

  for (const report of reports.value.siteReports.slice(0, 3)) {
    items.push({
      key: report.site_name,
      title: report.site_name,
      note: 'Open latest site report',
      href: artifactUrl(report.report_html_path || report.summary_screenshot_file),
      icon: 'i-lucide-folder-open'
    })
  }

  return items
})

const refreshAll = async () => {
  await Promise.allSettled([refreshDashboard(), refreshReports()])
}

let refreshTimer: number | null = null

onMounted(() => {
  refreshTimer = window.setInterval(() => {
    refreshAll()
  }, 45000)
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="page-stack dashboard-page">
    <section class="page-hero page-hero--dashboard">
      <div>
        <span class="section-kicker">Python runner + MySQL + Nuxt UI</span>
        <h1 class="page-title">
          {{ greeting }}, operations team
        </h1>
        <p class="page-copy">
          Command center for service checks, web screenshots, incident pressure, and generated report artifacts in one view.
        </p>
      </div>

      <div class="hero-actions">
        <div class="hero-inline-stats">
          <span>{{ data.totalSiteCount }} sites</span>
          <span>{{ totalMonitors }} monitors</span>
          <span>{{ latestRun ? formatDate(latestRun.generated_at) : 'Waiting for first run' }}</span>
        </div>

        <div class="hero-action-row">
          <UButton
            to="/reports"
            variant="soft"
            color="neutral"
            icon="i-lucide-files"
          >
            Open Reports
          </UButton>

          <UButton
            color="primary"
            icon="i-lucide-refresh-cw"
            @click="refreshAll"
          >
            Refresh Data
          </UButton>
        </div>
      </div>
    </section>

    <div
      v-if="!data.databaseOnline && data.message"
      class="message-banner message-banner--warning"
    >
      {{ data.message }}
    </div>

    <section class="dashboard-grid">
      <div class="dashboard-main">
        <section class="dashboard-stat-grid">
          <PortalStatCard
            label="Services live"
            :value="String(totalServiceCount)"
            hint="SSH and profile checks from the Python backend"
            :detail="`${serviceHealth}% healthy`"
            :progress="serviceHealth"
            icon="i-lucide-server"
            accent="primary"
          />

          <PortalStatCard
            label="Web targets"
            :value="String(totalWebCount)"
            hint="Browser journeys and screenshots"
            :detail="`${webHealth}% healthy`"
            :progress="webHealth"
            icon="i-lucide-monitor"
          />

          <PortalStatCard
            label="Global health"
            :value="`${overallHealth}%`"
            hint="Combined score across service and web monitoring"
            :detail="`${totalIssues} active alerts`"
            :progress="overallHealth"
            icon="i-lucide-shield-check"
          />
        </section>

        <PortalDashboardCharts
          :latest-run="latestRun"
          :recent-runs="data.recentRuns"
          :failing-sites="data.failingSites"
          :failing-service-count="data.failingServiceCount"
          :failing-web-count="data.failingWebCount"
        />

        <section class="dashboard-bottom-grid">
          <article class="panel-card info-card coverage-card">
            <div class="panel-card__header">
              <div>
                <span class="section-kicker">Coverage Mix</span>
                <h2 class="panel-card__title">
                  Monitoring distribution
                </h2>
                <p class="panel-card__subtext">
                  Healthy monitors versus active alerts in the latest synchronized snapshot.
                </p>
              </div>

              <span class="coverage-score">
                {{ overallHealth }}%
              </span>
            </div>

            <div class="coverage-bar">
              <div
                v-for="segment in coverageSegments"
                :key="segment.label"
                :class="['coverage-segment', `coverage-segment--${segment.tone}`]"
                :style="{ width: segment.width }"
              >
                <span class="coverage-segment__count">{{ segment.count }}</span>
              </div>
            </div>

            <div class="coverage-legend">
              <div
                v-for="segment in coverageSegments"
                :key="segment.label"
                class="coverage-legend__item"
              >
                <span :class="['coverage-legend__dot', `coverage-legend__dot--${segment.tone}`]" />
                <strong>{{ segment.label }}</strong>
                <span>{{ segment.count }} items</span>
              </div>
            </div>

            <div class="rail-tags">
              <span
                v-for="site in siteTags"
                :key="site.site_name"
                class="rail-tag"
              >
                {{ site.site_name }} • {{ site.failing_services }}/{{ site.monitored_services }}
              </span>
            </div>
          </article>

          <article class="panel-card info-card">
            <div class="panel-card__header">
              <div>
                <span class="section-kicker">Artifacts</span>
                <h2 class="panel-card__title">
                  Latest report bundle
                </h2>
                <p class="panel-card__subtext">
                  Generated HTML reports and screenshots exposed through the Nuxt artifact endpoint.
                </p>
              </div>
            </div>

            <div class="action-card-grid">
              <a
                v-for="card in reportCards"
                :key="card.key"
                :href="card.href"
                target="_blank"
                rel="noopener noreferrer"
                class="action-card"
              >
                <span class="action-card__icon">
                  <UIcon :name="card.icon" />
                </span>

                <div class="action-card__content">
                  <strong>{{ card.title }}</strong>
                  <span>{{ card.note }}</span>
                </div>

                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="action-card__arrow"
                />
              </a>

              <NuxtLink
                v-if="reportCards.length === 0"
                to="/reports"
                class="action-card"
              >
                <span class="action-card__icon">
                  <UIcon name="i-lucide-files" />
                </span>

                <div class="action-card__content">
                  <strong>Open reports page</strong>
                  <span>No report bundle has been generated yet.</span>
                </div>

                <UIcon
                  name="i-lucide-arrow-right"
                  class="action-card__arrow"
                />
              </NuxtLink>
            </div>
          </article>
        </section>
      </div>

      <aside class="dashboard-rail">
        <article class="panel-card issue-card rail-card">
          <div class="panel-card__header">
            <div>
              <span class="section-kicker">Live Queue</span>
              <h2 class="panel-card__title">
                Current alerts
              </h2>
              <p class="panel-card__subtext">
                Latest failing service and browser checks from backend snapshots.
              </p>
            </div>

            <PortalStatusPill :status="latestRun?.overall_status" />
          </div>

          <div class="run-chip-row">
            <div
              v-for="chip in recentRunChips"
              :key="chip.key"
              :class="['run-chip', { 'run-chip--active': chip.active }]"
            >
              <strong>{{ chip.day }}</strong>
              <span>{{ chip.month }}</span>
            </div>
          </div>

          <div class="timeline-list">
            <a
              v-for="item in railFeed"
              :key="item.id"
              :href="item.href"
              :target="item.href === '#' ? undefined : '_blank'"
              :rel="item.href === '#' ? undefined : 'noopener noreferrer'"
              class="timeline-item"
            >
              <span class="timeline-item__icon">
                <UIcon :name="item.icon" />
              </span>

              <div class="timeline-item__body">
                <div class="timeline-item__top">
                  <span class="timeline-item__tag">{{ item.tag }}</span>
                  <span class="timeline-item__time">{{ formatDate(item.generatedAt) }}</span>
                </div>

                <strong class="timeline-item__title">{{ item.title }}</strong>
                <p class="timeline-item__subtitle">{{ item.subtitle }}</p>
                <p class="timeline-item__note">{{ item.note }}</p>
              </div>
            </a>

            <div
              v-if="railFeed.length === 0"
              class="timeline-empty"
            >
              Latest snapshot shows no open incidents.
            </div>
          </div>
        </article>

        <PortalRunControl
          @triggered="refreshAll"
          @completed="refreshAll"
        />
      </aside>
    </section>
  </div>
</template>
