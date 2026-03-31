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
      <PortalSectionHeader
        level="page"
        eyebrow="Runs"
        title="Run history"
        description="Review each execution from the checker, including service counts, web counts, and report output."
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

    <section class="card-grid">
      <PortalCard v-for="run in data.items" :key="run.run_key">
        <div class="panel-card__header">
          <PortalSectionHeader
            level="section"
            eyebrow="Checker Run"
            :title="run.run_key"
            :description="formatDate(run.generated_at)"
          />

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
          <PortalActionButton
            v-if="run.web_summary_report_path"
            :href="artifactUrl(run.web_summary_report_path)"
            target="_blank"
            tone="secondary"
            size="sm"
            icon="i-lucide-file-text"
          >
            Web summary
          </PortalActionButton>
        </div>
      </PortalCard>
    </section>
  </div>
</template>
