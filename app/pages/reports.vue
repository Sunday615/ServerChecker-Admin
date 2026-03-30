<script setup lang="ts">
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

const { formatDate, artifactUrl } = usePortalUtils()

const { data, refresh } = await useFetch<ReportsResponse>('/api/reports/latest', {
  default: () => ({
    databaseOnline: true,
    message: '',
    latestRun: null,
    siteReports: []
  })
})
</script>

<template>
  <div class="page-stack">
    <section class="page-hero">
      <div>
        <span class="section-kicker">Artifacts</span>
        <h1 class="page-title">
          Reports
        </h1>
        <p class="page-copy">
          Open the latest generated HTML summaries and screenshots from the checker output.
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

    <div v-if="!data.databaseOnline && data.message" class="message-banner message-banner--warning">
      {{ data.message }}
    </div>

    <article class="panel-card">
      <div class="panel-card__header">
        <div>
          <span class="section-kicker">Latest Output</span>
          <h2 class="panel-card__title">
            Report bundle
          </h2>
        </div>

        <PortalStatusPill :status="data.latestRun?.overall_status" />
      </div>

      <div v-if="data.latestRun" class="kv-grid">
        <div class="kv-item">
          <span class="kv-item__label">Run key</span>
          <strong>{{ data.latestRun.run_key }}</strong>
        </div>
        <div class="kv-item">
          <span class="kv-item__label">Generated</span>
          <strong>{{ formatDate(data.latestRun.generated_at) }}</strong>
        </div>
      </div>

      <div v-if="data.latestRun?.web_summary_report_path" class="action-row">
        <UButton
          :href="artifactUrl(data.latestRun.web_summary_report_path)"
          external
          target="_blank"
          rel="noopener noreferrer"
          icon="i-lucide-file-text"
        >
          Open web summary
        </UButton>
      </div>
    </article>

    <section class="card-grid">
      <article v-for="report in data.siteReports" :key="report.site_name" class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">Site report</span>
            <h2 class="panel-card__title">
              {{ report.site_name }}
            </h2>
          </div>
        </div>

        <div class="action-row">
          <UButton
            v-if="report.report_html_path"
            :href="artifactUrl(report.report_html_path)"
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
            v-if="report.summary_screenshot_file"
            :href="artifactUrl(report.summary_screenshot_file)"
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
    </section>
  </div>
</template>
