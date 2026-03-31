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

type MetricCard = {
  label: string
  value: string
  hint: string
  detail: string
  detailTone: 'success' | 'danger' | 'neutral'
  progress: number
  icon: string
  accent: 'primary' | 'soft'
}

type IncidentRow = {
  id: string
  kind: 'service' | 'web'
  kindLabel: string
  icon: string
  title: string
  note: string
  site: string
  runKey: string
  endpoint: string
  updatedAt: string
  status: string
  href: string
  generatedAt: string
}

const activeTab = ref<'all' | 'service' | 'web'>('all')

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

const formatShortDate = (value: string | null | undefined) => {
  if (!value) {
    return 'Awaiting first sync'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date)
}

const latestRun = computed(() => data.value.latestRun)

const totalServiceCount = computed(() => toNumber(latestRun.value?.total_services))
const totalWebCount = computed(() => toNumber(latestRun.value?.total_web_checks))
const totalIssues = computed(() => data.value.failingServiceCount + data.value.failingWebCount)
const totalMonitors = computed(() => totalServiceCount.value + totalWebCount.value)
const stableServiceCount = computed(() => Math.max(totalServiceCount.value - data.value.failingServiceCount, 0))
const stableWebCount = computed(() => Math.max(totalWebCount.value - data.value.failingWebCount, 0))
const totalPassing = computed(() => stableServiceCount.value + stableWebCount.value)
const exposedSiteCount = computed(() => data.value.failingSites.filter(site => toNumber(site.failing_services) > 0).length)

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

const serviceRisk = computed(() => Math.max(100 - serviceHealth.value, 0))
const webRisk = computed(() => Math.max(100 - webHealth.value, 0))

const latestArtifactHref = computed(() => {
  if (reports.value.latestRun?.web_summary_report_path) {
    return artifactUrl(reports.value.latestRun.web_summary_report_path)
  }

  const firstSiteReport = reports.value.siteReports[0]

  if (firstSiteReport) {
    return artifactUrl(firstSiteReport.report_html_path || firstSiteReport.summary_screenshot_file)
  }

  return ''
})

const reportCount = computed(() => {
  return reports.value.siteReports.length + (reports.value.latestRun?.web_summary_report_path ? 1 : 0)
})

const lastSyncedLabel = computed(() => {
  return latestRun.value?.generated_at
    ? `Synced ${formatShortDate(latestRun.value.generated_at)}`
    : 'Awaiting first sync'
})

const dateRangeLabel = computed(() => {
  const runs = data.value.recentRuns

  if (!runs.length) {
    return 'Latest snapshot'
  }

  const newest = runs[0]!
  const oldest = runs[runs.length - 1]!

  return `${formatShortDate(oldest.generated_at)} - ${formatShortDate(newest.generated_at)}`
})

const overviewCards = computed<MetricCard[]>(() => {
  return [
    {
      label: 'Total Threats',
      value: String(totalIssues.value),
      hint: 'Combined failing service and browser checks',
      detail: `${data.value.failingServiceCount} infra • ${data.value.failingWebCount} web`,
      detailTone: totalIssues.value ? 'danger' : 'success',
      progress: totalMonitors.value ? Math.min(Math.round((totalIssues.value / totalMonitors.value) * 100), 100) : 0,
      icon: 'i-lucide-shield-alert',
      accent: 'primary'
    },
    {
      label: 'Service Risk',
      value: `${serviceRisk.value}%`,
      hint: 'Infrastructure attack surface from live checks',
      detail: `${data.value.failingServiceCount} service channels exposed`,
      detailTone: data.value.failingServiceCount ? 'danger' : 'success',
      progress: serviceRisk.value,
      icon: 'i-lucide-server-crash',
      accent: 'soft'
    },
    {
      label: 'Web Risk',
      value: `${webRisk.value}%`,
      hint: 'Browser journeys and target URLs under pressure',
      detail: `${data.value.failingWebCount} browser flows flagged`,
      detailTone: data.value.failingWebCount ? 'danger' : 'success',
      progress: webRisk.value,
      icon: 'i-lucide-globe-lock',
      accent: 'soft'
    },
    {
      label: 'Secure Coverage',
      value: `${overallHealth.value}%`,
      hint: 'Healthy coverage across monitored assets',
      detail: `${totalPassing.value}/${Math.max(totalMonitors.value, 0)} checks stable • ${exposedSiteCount.value} hot sites`,
      detailTone: totalIssues.value ? 'neutral' : 'success',
      progress: overallHealth.value,
      icon: 'i-lucide-badge-check',
      accent: 'soft'
    }
  ]
})

const incidentRows = computed<IncidentRow[]>(() => {
  const serviceItems = data.value.failingServices.map(item => ({
    id: `service-${item.service_result_id}`,
    kind: 'service' as const,
    kindLabel: 'Service',
    icon: 'i-lucide-server',
    title: item.service_name,
    note: item.connection_error || `${item.host_display_name || item.host_address} • ${item.check_profile_name || 'default profile'}`,
    site: item.site_name,
    runKey: item.run_key,
    endpoint: item.host_display_name || item.host_address,
    updatedAt: formatDate(item.generated_at),
    status: item.status,
    href: artifactUrl(item.service_report_html_path || item.service_screenshot_file),
    generatedAt: item.generated_at
  }))

  const webItems = data.value.failingWebChecks.map(item => ({
    id: `web-${item.web_result_id}`,
    kind: 'web' as const,
    kindLabel: 'Web',
    icon: 'i-lucide-globe',
    title: item.target_name,
    note: item.message || item.final_url || item.target_url,
    site: item.site_name,
    runKey: item.run_key,
    endpoint: item.final_url || item.target_url,
    updatedAt: formatDate(item.generated_at),
    status: item.status,
    href: artifactUrl(item.web_report_html_path || item.screenshot_file),
    generatedAt: item.generated_at
  }))

  return [...serviceItems, ...webItems]
    .sort((left, right) => new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime())
    .slice(0, 12)
})

const issueTabs = computed(() => {
  const serviceCount = incidentRows.value.filter(item => item.kind === 'service').length
  const webCount = incidentRows.value.filter(item => item.kind === 'web').length

  return [
    {
      id: 'all' as const,
      label: 'All threats',
      count: incidentRows.value.length
    },
    {
      id: 'service' as const,
      label: 'Services',
      count: serviceCount
    },
    {
      id: 'web' as const,
      label: 'Web threats',
      count: webCount
    }
  ]
})

const filteredRows = computed(() => {
  if (activeTab.value === 'all') {
    return incidentRows.value
  }

  return incidentRows.value.filter(item => item.kind === activeTab.value)
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
    <section class="page-hero dashboard-hero">
      <div class="dashboard-hero__copy">
        <span class="section-kicker">Current Risk</span>
        <h2 class="page-title">
          Live threat posture across service and web monitoring.
        </h2>
        <p class="page-copy">
          Backend snapshots from the Python checker are rendered as a modern dark response console with risk scoring, threat mix, hotspot tracking, and artifact access.
        </p>
      </div>

      <div class="dashboard-hero__actions">
        <span class="toolbar-pill">Daily sync</span>
        <span class="toolbar-pill">{{ lastSyncedLabel }}</span>
        <span class="toolbar-pill">{{ dateRangeLabel }}</span>
        <span class="toolbar-pill">{{ reportCount }} files</span>

        <UButton
          color="primary"
          icon="i-lucide-refresh-cw"
          @click="refreshAll"
        >
          Refresh data
        </UButton>

        <UButton
          v-if="latestArtifactHref"
          :href="latestArtifactHref"
          external
          target="_blank"
          rel="noopener noreferrer"
          variant="soft"
          color="neutral"
          icon="i-lucide-folder-open"
        >
          Open latest file
        </UButton>

        <UButton
          v-else
          to="/reports"
          variant="soft"
          color="neutral"
          icon="i-lucide-files"
        >
          View files
        </UButton>
      </div>
    </section>

    <div
      v-if="!data.databaseOnline && data.message"
      class="message-banner message-banner--warning"
    >
      {{ data.message }}
    </div>

    <section class="dashboard-stat-grid">
      <PortalStatCard
        v-for="card in overviewCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :hint="card.hint"
        :detail="card.detail"
        :detail-tone="card.detailTone"
        :progress="card.progress"
        :icon="card.icon"
        :accent="card.accent"
      />
    </section>

    <PortalDashboardCharts
      :latest-run="latestRun"
      :recent-runs="data.recentRuns"
      :failing-sites="data.failingSites"
      :failing-service-count="data.failingServiceCount"
      :failing-web-count="data.failingWebCount"
    />

    <section class="table-card panel-card">
      <div class="panel-card__header">
        <div>
          <span class="section-kicker">Threat Details</span>
          <h2 class="panel-card__title">
            Active findings
          </h2>
          <p class="panel-card__subtext">
            Investigate failing service channels and browser targets pulled from the latest synchronized run data.
          </p>
        </div>

        <div class="section-heading__actions">
          <NuxtLink
            to="/services"
            class="table-link table-link--ghost"
          >
            Service alerts
          </NuxtLink>

          <NuxtLink
            to="/web-checks"
            class="table-link table-link--ghost"
          >
            Web threats
          </NuxtLink>

          <NuxtLink
            to="/reports"
            class="table-link table-link--ghost"
          >
            Files
          </NuxtLink>
        </div>
      </div>

      <div class="table-toolbar">
        <div class="tab-strip">
          <button
            v-for="tab in issueTabs"
            :key="tab.id"
            type="button"
            :class="['tab-chip', { 'is-active': activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span>{{ tab.label }}</span>
            <small>{{ tab.count }}</small>
          </button>
        </div>

        <div class="table-actions">
          <span class="toolbar-pill">{{ totalMonitors }} monitored assets</span>
        </div>
      </div>

      <div class="table-shell">
        <table class="portal-table">
          <thead>
            <tr>
              <th>Threat vector</th>
              <th>Type</th>
              <th>Site</th>
              <th>Run key</th>
              <th>Endpoint</th>
              <th>Detected</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in filteredRows"
              :key="row.id"
            >
              <td>
                <div class="table-item">
                  <span class="table-item__icon">
                    <UIcon :name="row.icon" />
                  </span>

                  <div class="table-item__text">
                    <strong>{{ row.title }}</strong>
                    <span>{{ row.note }}</span>
                  </div>
                </div>
              </td>

              <td>
                <span class="table-badge">{{ row.kindLabel }}</span>
              </td>

              <td>{{ row.site }}</td>
              <td>{{ row.runKey }}</td>
              <td>{{ row.endpoint }}</td>
              <td>{{ row.updatedAt }}</td>

              <td>
                <PortalStatusPill :status="row.status" />
              </td>

              <td class="portal-table__actions">
                <a
                  v-if="row.href"
                  :href="row.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="table-link"
                >
                  Open
                </a>

                <span
                  v-else
                  class="table-link table-link--muted"
                >
                  Unavailable
                </span>
              </td>
            </tr>

            <tr v-if="filteredRows.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <strong>No threats in this slice</strong>
                  <span>Failing services and web checks will appear here as soon as the backend reports them.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
