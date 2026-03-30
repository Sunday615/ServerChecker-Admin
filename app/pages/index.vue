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

const { formatDate, artifactUrl } = usePortalUtils()

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
</script>

<template>
  <div class="page-stack">
    <section class="page-hero">
      <div>
        <span class="section-kicker">Overview</span>
        <h1 class="page-title">
          Monitoring dashboard
        </h1>
        <p class="page-copy">
          See the latest checker run, current failing services, web issues, and report artifacts from one control panel.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="soft"
        @click="refresh()"
      >
        Refresh
      </UButton>
    </section>

    <div
      v-if="!data.databaseOnline && data.message"
      class="message-banner message-banner--warning"
    >
      {{ data.message }}
    </div>

    <section class="stats-grid">
      <PortalStatCard
        label="Latest Run"
        :value="data.latestRun?.run_key || 'No data'"
        :hint="formatDate(data.latestRun?.generated_at)"
      />
      <PortalStatCard
        label="Failing Services"
        :value="String(data.failingServiceCount)"
        hint="Latest service snapshot"
      />
      <PortalStatCard
        label="Failing Web Checks"
        :value="String(data.failingWebCount)"
        hint="Latest web snapshot"
      />
      <PortalStatCard
        label="Last Result"
        :value="data.latestRun?.overall_status || 'UNKNOWN'"
        :hint="data.latestRun ? `${data.latestRun.total_failed} service issues / ${data.latestRun.total_web_failed} web issues` : 'Waiting for first run'"
      />
    </section>

    <ClientOnly>
      <PortalDashboardCharts
        :latest-run="data.latestRun"
        :recent-runs="data.recentRuns"
        :failing-sites="data.failingSites"
        :failing-service-count="data.failingServiceCount"
        :failing-web-count="data.failingWebCount"
      />
    </ClientOnly>

    <section class="panel-grid">
      <article class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">Latest Run</span>
            <h2 class="panel-card__title">
              Run summary
            </h2>
          </div>

          <PortalStatusPill :status="data.latestRun?.overall_status" />
        </div>

        <div
          v-if="data.latestRun"
          class="kv-grid"
        >
          <div class="kv-item">
            <span class="kv-item__label">Run key</span>
            <strong>{{ data.latestRun.run_key }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Generated</span>
            <strong>{{ formatDate(data.latestRun.generated_at) }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Hosts</span>
            <strong>{{ data.latestRun.total_hosts }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Services</span>
            <strong>{{ data.latestRun.total_services }}</strong>
          </div>
        </div>

        <div
          v-else
          class="empty-box"
        >
          No run data available yet.
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">Current Problems</span>
            <h2 class="panel-card__title">
              Failing sites
            </h2>
          </div>
        </div>

        <div
          v-if="data.failingSites.length === 0"
          class="empty-box"
        >
          No failing site groups right now.
        </div>

        <div
          v-else
          class="stack-list"
        >
          <div
            v-for="site in data.failingSites"
            :key="site.site_name"
            class="stack-row"
          >
            <div>
              <strong>{{ site.site_name }}</strong>
              <p>{{ site.failing_services }} failing services</p>
            </div>
            <PortalStatusPill :status="site.failing_services > 0 ? 'FAIL' : 'PASS'" />
          </div>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="panel-card__header">
        <div>
          <span class="section-kicker">Recent Activity</span>
          <h2 class="panel-card__title">
            Run history
          </h2>
        </div>
      </div>

      <div
        v-if="data.recentRuns.length === 0"
        class="empty-box"
      >
        No recent run history found.
      </div>

      <div
        v-else
        class="card-grid card-grid--compact"
      >
        <article
          v-for="run in data.recentRuns"
          :key="run.run_key"
          class="info-card"
        >
          <div class="info-card__header">
            <div>
              <strong>{{ run.run_key }}</strong>
              <p>{{ formatDate(run.generated_at) }}</p>
            </div>
            <PortalStatusPill :status="run.overall_status" />
          </div>

          <div class="mini-stats">
            <span>{{ run.total_services }} services</span>
            <span>{{ run.total_failed }} service issues</span>
            <span>{{ run.total_web_failed }} web issues</span>
          </div>
        </article>
      </div>
    </section>

    <section class="panel-grid">
      <article class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">Service Failures</span>
            <h2 class="panel-card__title">
              Open service issues
            </h2>
          </div>
        </div>

        <div
          v-if="data.failingServices.length === 0"
          class="empty-box"
        >
          No failing services.
        </div>

        <div
          v-else
          class="card-grid"
        >
          <article
            v-for="item in data.failingServices"
            :key="item.service_result_id"
            class="issue-card"
          >
            <div class="info-card__header">
              <div>
                <strong>{{ item.service_name }}</strong>
                <p>{{ item.site_name }} / {{ item.host_display_name || item.host_address }}</p>
              </div>
              <PortalStatusPill :status="item.status" />
            </div>

            <p
              v-if="item.connection_error"
              class="issue-card__message issue-card__message--error"
            >
              {{ item.connection_error }}
            </p>

            <div class="action-row">
              <UButton
                v-if="item.service_report_html_path"
                :href="artifactUrl(item.service_report_html_path)"
                external
                target="_blank"
                rel="noopener noreferrer"
                variant="soft"
                color="neutral"
                icon="i-lucide-file-text"
              >
                HTML
              </UButton>
              <UButton
                v-if="item.service_screenshot_file"
                :href="artifactUrl(item.service_screenshot_file)"
                external
                target="_blank"
                rel="noopener noreferrer"
                variant="soft"
                color="neutral"
                icon="i-lucide-image"
              >
                PNG
              </UButton>
            </div>
          </article>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">Web Failures</span>
            <h2 class="panel-card__title">
              Open web issues
            </h2>
          </div>
        </div>

        <div
          v-if="data.failingWebChecks.length === 0"
          class="empty-box"
        >
          No failing web checks.
        </div>

        <div
          v-else
          class="card-grid"
        >
          <article
            v-for="item in data.failingWebChecks"
            :key="item.web_result_id"
            class="issue-card"
          >
            <div class="info-card__header">
              <div>
                <strong>{{ item.target_name }}</strong>
                <p>{{ item.site_name }}</p>
              </div>
              <PortalStatusPill :status="item.status" />
            </div>

            <p class="issue-card__message">
              {{ item.message || item.target_url }}
            </p>

            <div class="action-row">
              <UButton
                v-if="item.web_report_html_path"
                :href="artifactUrl(item.web_report_html_path)"
                external
                target="_blank"
                rel="noopener noreferrer"
                variant="soft"
                color="neutral"
                icon="i-lucide-file-text"
              >
                HTML
              </UButton>
              <UButton
                v-if="item.screenshot_file"
                :href="artifactUrl(item.screenshot_file)"
                external
                target="_blank"
                rel="noopener noreferrer"
                variant="soft"
                color="neutral"
                icon="i-lucide-image"
              >
                PNG
              </UButton>
            </div>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>
