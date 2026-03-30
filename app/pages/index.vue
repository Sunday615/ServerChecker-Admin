<script setup lang="ts">
type SummaryMetric = {
  latestRun: null | {
    run_key: string
    generated_at: string
    overall_status: string
    total_hosts: number
    total_services: number
    total_failed: number
    total_web_failed: number
  }
  failingServiceCount: number
  failingWebCount: number
  failingSites: Array<{ site_name: string, failing_services: number }>
  failingServices: Array<{
    service_result_id: number
    site_name: string
    host_address: string
    host_display_name: string
    service_name: string
    status: string
    connection_error: string
    service_report_html_path: string
    service_screenshot_file: string
  }>
  failingWebChecks: Array<{
    web_result_id: number
    site_name: string
    target_name: string
    target_url: string
    status: string
    message: string
    screenshot_file: string
    web_report_html_path: string
  }>
  recentRuns: Array<{
    run_key: string
    generated_at: string
    overall_status: string
    total_hosts: number
    total_services: number
    total_failed: number
    total_web_failed: number
  }>
  databaseOnline: boolean
  message: string
}

const { data, refresh } = await useFetch<SummaryMetric>('/api/dashboard/summary', {
  default: () => ({
    latestRun: null,
    failingServiceCount: 0,
    failingWebCount: 0,
    failingSites: [],
    failingServices: [],
    failingWebChecks: [],
    recentRuns: [],
    databaseOnline: true,
    message: ''
  })
})

const artifactUrl = (filePath?: string) => {
  if (!filePath) {
    return '#'
  }

  return `/api/artifacts?path=${encodeURIComponent(filePath)}`
}

const formatDate = (value?: string) => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<template>
  <div class="page-stack">
    <section class="hero-panel motion-hero">
      <div class="hero-panel__header">
        <div>
          <div class="eyebrow">
            <UIcon name="i-lucide-activity" />
            Live monitoring workspace
          </div>
          <h1 class="hero-title">
            Unified control room for service checks and web reports
          </h1>
          <p class="hero-description">
            This portal reads the same MySQL-backed run history created by <code>server-checker</code>,
            gives you one place to review failures, inspect artifacts, and launch a new checker run.
          </p>
        </div>

        <RunCheckButton />
      </div>

      <div class="hero-actions">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="subtle"
          @click="refresh()"
        >
          Refresh dashboard
        </UButton>
        <UButton
          to="/services"
          icon="i-lucide-server"
          variant="subtle"
        >
          View services
        </UButton>
        <UButton
          to="/reports"
          icon="i-lucide-file-bar-chart"
          variant="subtle"
        >
          Browse reports
        </UButton>
      </div>
    </section>

    <div
      v-if="!data.databaseOnline && data.message"
      class="alert-banner"
    >
      {{ data.message }}
    </div>

    <section class="metrics-grid">
      <MetricCard
        class="motion-card"
        label="Last run"
        :value="data.latestRun?.run_key || 'No data'"
        :hint="formatDate(data.latestRun?.generated_at)"
      />
      <MetricCard
        class="motion-card"
        label="Failing services"
        :value="String(data.failingServiceCount)"
        hint="Current latest status across all services"
      />
      <MetricCard
        class="motion-card"
        label="Failing web checks"
        :value="String(data.failingWebCount)"
        hint="Current latest screenshot and login flows"
      />
      <MetricCard
        class="motion-card"
        label="Last run result"
        :value="data.latestRun?.overall_status || 'UNKNOWN'"
        :hint="data.latestRun ? `${data.latestRun.total_failed} service fails / ${data.latestRun.total_web_failed} web fails` : 'Waiting for first run'"
      />
    </section>

    <section class="content-grid">
      <div class="panel motion-panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">
              Recent runs
            </h2>
            <p class="panel__description">
              Latest checker executions written by the Python worker.
            </p>
          </div>
        </div>

        <div v-if="data.recentRuns.length === 0" class="empty-state">
          No run history yet.
        </div>

        <div v-else class="entity-grid entity-grid--compact">
          <article
            v-for="run in data.recentRuns"
            :key="run.run_key"
            class="entity-card motion-card"
          >
            <div class="entity-card__header">
              <div>
                <div class="entity-card__eyebrow">
                  Recent run
                </div>
                <h3 class="entity-card__title">
                  {{ run.run_key }}
                </h3>
                <p class="entity-card__subtitle">
                  {{ formatDate(run.generated_at) }}
                </p>
              </div>

              <StatusBadge :status="run.overall_status" />
            </div>

            <div class="entity-card__stats">
              <div class="entity-stat">
                <span class="entity-stat__label">Services</span>
                <span class="entity-stat__value">{{ run.total_services }}</span>
              </div>
              <div class="entity-stat">
                <span class="entity-stat__label">Service fails</span>
                <span class="entity-stat__value">{{ run.total_failed }}</span>
              </div>
              <div class="entity-stat">
                <span class="entity-stat__label">Web fails</span>
                <span class="entity-stat__value">{{ run.total_web_failed }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="panel motion-panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">
              Failing sites
            </h2>
            <p class="panel__description">
              Grouped by current latest service result.
            </p>
          </div>
        </div>

        <div v-if="data.failingSites.length === 0" class="empty-state">
          No site-level failures right now.
        </div>

        <div v-else class="entity-grid entity-grid--compact">
          <article
            v-for="site in data.failingSites"
            :key="site.site_name"
            class="entity-card motion-card"
          >
            <div class="entity-card__header">
              <div>
                <div class="entity-card__eyebrow">
                  Site health
                </div>
                <h3 class="entity-card__title">
                  {{ site.site_name }}
                </h3>
                <p class="entity-card__subtitle">
                  Failing services on latest snapshot
                </p>
              </div>

              <StatusBadge :status="site.failing_services > 0 ? 'FAIL' : 'PASS'" />
            </div>

            <div class="entity-card__stats">
              <div class="entity-stat">
                <span class="entity-stat__label">Failing services</span>
                <span class="entity-stat__value">{{ site.failing_services }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="stack-grid">
      <div class="panel motion-panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">
              Latest failing services
            </h2>
            <p class="panel__description">
              Jump straight into service report HTML or screenshots.
            </p>
          </div>
        </div>

        <div v-if="data.failingServices.length === 0" class="empty-state">
          No failing services.
        </div>

        <div v-else class="entity-grid">
          <article
            v-for="service in data.failingServices"
            :key="service.service_result_id"
            class="entity-card motion-card"
          >
            <div class="entity-card__header">
              <div>
                <div class="entity-card__eyebrow">
                  {{ service.site_name }}
                </div>
                <h3 class="entity-card__title">
                  {{ service.service_name }}
                </h3>
                <p class="entity-card__subtitle">
                  {{ service.host_display_name || service.host_address }}
                </p>
              </div>

              <StatusBadge :status="service.status" />
            </div>

            <div
              v-if="service.connection_error"
              class="entity-card__message entity-card__message--error"
            >
              {{ service.connection_error }}
            </div>

            <div class="entity-card__footer">
              <div class="inline-actions">
                <a
                  v-if="service.service_report_html_path"
                  :href="artifactUrl(service.service_report_html_path)"
                  target="_blank"
                  class="link-button"
                >
                  HTML
                </a>
                <a
                  v-if="service.service_screenshot_file"
                  :href="artifactUrl(service.service_screenshot_file)"
                  target="_blank"
                  class="link-button"
                >
                  PNG
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="panel motion-panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">
              Latest failing web checks
            </h2>
            <p class="panel__description">
              Screenshots and messages captured from web targets.
            </p>
          </div>
        </div>

        <div v-if="data.failingWebChecks.length === 0" class="empty-state">
          No failing web checks.
        </div>

        <div v-else class="entity-grid">
          <article
            v-for="item in data.failingWebChecks"
            :key="item.web_result_id"
            class="entity-card motion-card"
          >
            <div class="entity-card__header">
              <div>
                <div class="entity-card__eyebrow">
                  {{ item.site_name }}
                </div>
                <h3 class="entity-card__title">
                  {{ item.target_name }}
                </h3>
                <p class="entity-card__subtitle entity-card__subtitle--wrap">
                  {{ item.target_url }}
                </p>
              </div>

              <StatusBadge :status="item.status" />
            </div>

            <div class="entity-card__message">
              {{ item.message || '-' }}
            </div>

            <div class="entity-card__footer">
              <div class="inline-actions">
                <a
                  v-if="item.screenshot_file"
                  :href="artifactUrl(item.screenshot_file)"
                  target="_blank"
                  class="link-button"
                >
                  Screenshot
                </a>
                <a
                  v-if="item.web_report_html_path"
                  :href="artifactUrl(item.web_report_html_path)"
                  target="_blank"
                  class="link-button"
                >
                  HTML
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
