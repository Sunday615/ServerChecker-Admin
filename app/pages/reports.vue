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
      <PortalSectionHeader
        level="page"
        eyebrow="Artifacts"
        title="Reports"
        description="Open the latest generated HTML summaries and screenshots from the checker output."
      />

      <PortalActionButton
        icon="i-lucide-refresh-cw"
        tone="secondary"
        size="md"
        @click="refresh()"
      >
        Refresh
      </PortalActionButton>
    </section>

    <div v-if="!data.databaseOnline && data.message" class="message-banner message-banner--warning">
      {{ data.message }}
    </div>

    <PortalCard>
      <div class="panel-card__header">
        <PortalSectionHeader
          level="section"
          eyebrow="Latest Output"
          title="Report bundle"
        />

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
        <PortalActionButton
          :href="artifactUrl(data.latestRun.web_summary_report_path)"
          target="_blank"
          tone="primary"
          size="md"
          icon="i-lucide-file-text"
        >
          Open web summary
        </PortalActionButton>
      </div>
    </PortalCard>

    <section class="card-grid">
      <PortalCard v-for="report in data.siteReports" :key="report.site_name">
        <div class="panel-card__header">
          <PortalSectionHeader
            level="section"
            eyebrow="Site report"
            :title="report.site_name"
          />
        </div>

        <div class="action-row">
          <PortalActionButton
            v-if="report.report_html_path"
            :href="artifactUrl(report.report_html_path)"
            target="_blank"
            tone="secondary"
            size="sm"
            icon="i-lucide-file-text"
          >
            HTML
          </PortalActionButton>
          <PortalActionButton
            v-if="report.summary_screenshot_file"
            :href="artifactUrl(report.summary_screenshot_file)"
            target="_blank"
            tone="secondary"
            size="sm"
            icon="i-lucide-image"
          >
            PNG
          </PortalActionButton>
        </div>
      </PortalCard>
    </section>
  </div>
</template>
