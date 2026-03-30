<script setup lang="ts">
type RunItem = {
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
}

const { data, refresh } = await useFetch<{
  databaseOnline: boolean
  message: string
  items: RunItem[]
}>('/api/runs?limit=30', {
  default: () => ({
    databaseOnline: true,
    message: '',
    items: []
  })
})

const formatDate = (value?: string) => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const artifactUrl = (filePath?: string) => {
  if (!filePath) {
    return '#'
  }

  return `/api/artifacts?path=${encodeURIComponent(filePath)}`
}
</script>

<template>
  <div class="page-stack">
    <section class="panel motion-hero">
      <div class="panel__header">
        <div>
          <h1 class="panel__title">
            Run history
          </h1>
          <p class="panel__description">
            Every checker execution written by the Python worker and surfaced through MySQL.
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

      <div v-if="data.items.length === 0" class="empty-state">
        No run history yet.
      </div>

      <div v-else class="entity-grid">
        <article
          v-for="run in data.items"
          :key="run.run_key"
          class="entity-card motion-card"
        >
          <div class="entity-card__header">
            <div>
              <div class="entity-card__eyebrow">
                Checker run
              </div>
              <h2 class="entity-card__title">
                {{ run.run_key }}
              </h2>
              <p class="entity-card__subtitle">
                {{ formatDate(run.generated_at) }}
              </p>
            </div>

            <StatusBadge :status="run.overall_status" />
          </div>

          <div class="entity-card__stats">
            <div class="entity-stat">
              <span class="entity-stat__label">Hosts</span>
              <span class="entity-stat__value">{{ run.total_hosts }}</span>
            </div>
            <div class="entity-stat">
              <span class="entity-stat__label">Services</span>
              <span class="entity-stat__value">{{ run.total_services }}</span>
            </div>
            <div class="entity-stat">
              <span class="entity-stat__label">Service fail</span>
              <span class="entity-stat__value">{{ run.total_failed }}</span>
            </div>
            <div class="entity-stat">
              <span class="entity-stat__label">Web fail</span>
              <span class="entity-stat__value">{{ run.total_web_failed }}</span>
            </div>
          </div>

          <div class="entity-card__message">
            Services: {{ run.total_passed }} pass / {{ run.total_failed }} fail
            <br>
            Web: {{ run.total_web_passed }} pass / {{ run.total_web_failed }} fail
          </div>

          <div class="entity-card__footer">
            <div class="inline-actions">
              <a
                v-if="run.web_summary_report_path"
                :href="artifactUrl(run.web_summary_report_path)"
                target="_blank"
                class="link-button"
              >
                Web summary
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
