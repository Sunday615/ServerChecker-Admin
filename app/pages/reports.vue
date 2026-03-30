<script setup lang="ts">
type LatestRun = {
  id: number
  run_key: string
  generated_at: string
  overall_status: string
  web_summary_report_path: string
}

type SiteReport = {
  site_name: string
  report_html_path: string
  summary_screenshot_file: string
}

const { data, refresh } = await useFetch<{
  databaseOnline: boolean
  message: string
  latestRun: LatestRun | null
  siteReports: SiteReport[]
}>('/api/reports/latest', {
  default: () => ({
    databaseOnline: true,
    message: '',
    latestRun: null,
    siteReports: []
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
    <section class="panel motion-hero">
      <div class="panel__header">
        <div>
          <h1 class="panel__title">
            Latest generated reports
          </h1>
          <p class="panel__description">
            Open existing HTML and PNG artifacts produced by the Python worker.
          </p>
        </div>

        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="subtle"
          @click="refresh()"
        >
          Refresh
        </UButton>
      </div>

      <div
        v-if="!data.databaseOnline && data.message"
        class="alert-banner"
      >
        {{ data.message }}
      </div>

      <div v-if="!data.latestRun" class="empty-state">
        No report artifacts found yet.
      </div>

      <template v-else>
        <div class="hero-panel motion-panel">
          <div class="hero-panel__header">
            <div>
              <div class="eyebrow">
                <UIcon name="i-lucide-file-text" />
                Latest run
              </div>
              <h2 class="hero-title">
                {{ data.latestRun.run_key }}
              </h2>
              <p class="hero-description">
                Generated {{ formatDate(data.latestRun.generated_at) }}
              </p>
            </div>

            <div class="inline-actions">
              <StatusBadge :status="data.latestRun.overall_status" />
              <a
                v-if="data.latestRun.web_summary_report_path"
                :href="artifactUrl(data.latestRun.web_summary_report_path)"
                target="_blank"
                class="link-button"
              >
                Open web summary
              </a>
            </div>
          </div>
        </div>

        <div class="entity-grid entity-grid--wide">
          <article
            v-for="report in data.siteReports"
            :key="report.site_name"
            class="entity-card entity-card--media motion-card"
          >
            <div class="entity-card__header">
              <div>
                <div class="entity-card__eyebrow">
                  Site report
                </div>
                <h2 class="entity-card__title">
                  {{ report.site_name }}
                </h2>
                <p class="entity-card__subtitle">
                  Site-level summary report
                </p>
              </div>
            </div>

            <img
              v-if="report.summary_screenshot_file"
              :src="artifactUrl(report.summary_screenshot_file)"
              :alt="`${report.site_name} summary`"
              class="thumbnail motion-media"
            >

            <div class="entity-card__footer">
              <a
                v-if="report.report_html_path"
                :href="artifactUrl(report.report_html_path)"
                target="_blank"
                class="link-button"
              >
                Open HTML
              </a>
              <a
                v-if="report.summary_screenshot_file"
                :href="artifactUrl(report.summary_screenshot_file)"
                target="_blank"
                class="link-button"
              >
                Open PNG
              </a>
            </div>
          </article>
        </div>
      </template>
    </section>
  </div>
</template>
