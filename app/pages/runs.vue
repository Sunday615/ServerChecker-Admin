<script setup lang="ts">
type RunsResponse = {
  databaseOnline: boolean
  message: string
  items: Array<{
    run_key: string
    generated_at: string
    overall_status: string
    total_hosts: number
    total_services: number
    total_passed: number
    total_failed: number
    total_web_checks: number
    total_web_passed: number
    total_web_failed: number
    web_summary_report_path: string
  }>
}

const { formatDate, artifactUrl } = usePortalUtils()

const { data, refresh } = await useFetch<RunsResponse>('/api/runs', {
  query: {
    limit: 40
  },
  default: () => ({
    databaseOnline: true,
    message: '',
    items: []
  })
})
</script>

<template>
  <div class="page-stack">
    <section class="page-hero">
      <div>
        <span class="section-kicker">Runs</span>
        <h1 class="page-title">
          Run history
        </h1>
        <p class="page-copy">
          Review each execution from the checker, including service counts, web counts, and report output.
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

    <section class="card-grid">
      <article v-for="run in data.items" :key="run.run_key" class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">Checker Run</span>
            <h2 class="panel-card__title">
              {{ run.run_key }}
            </h2>
            <p class="panel-card__subtext">
              {{ formatDate(run.generated_at) }}
            </p>
          </div>

          <PortalStatusPill :status="run.overall_status" />
        </div>

        <div class="kv-grid">
          <div class="kv-item">
            <span class="kv-item__label">Hosts</span>
            <strong>{{ run.total_hosts }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Services</span>
            <strong>{{ run.total_services }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Passed</span>
            <strong>{{ run.total_passed }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Failed</span>
            <strong>{{ run.total_failed }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Web checks</span>
            <strong>{{ run.total_web_checks }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Web failed</span>
            <strong>{{ run.total_web_failed }}</strong>
          </div>
        </div>

        <div class="action-row">
          <UButton
            v-if="run.web_summary_report_path"
            :href="artifactUrl(run.web_summary_report_path)"
            external
            target="_blank"
            rel="noopener noreferrer"
            variant="soft"
            color="neutral"
            icon="i-lucide-file-text"
          >
            Web summary
          </UButton>
        </div>
      </article>
    </section>
  </div>
</template>
