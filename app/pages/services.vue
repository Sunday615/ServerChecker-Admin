<script setup lang="ts">
type ServiceItem = {
  service_result_id: number
  run_key: string
  generated_at: string
  site_name: string
  host_address: string
  host_display_name: string
  service_name: string
  check_profile_name: string
  status: string
  passed_count: number
  failed_count: number
  connection_error: string
  service_report_html_path: string
  service_screenshot_file: string
}

const { data, refresh } = await useFetch<{
  databaseOnline: boolean
  message: string
  items: ServiceItem[]
}>('/api/services/latest', {
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
            Latest service status
          </h1>
          <p class="panel__description">
            One row per service based on the latest available run in MySQL.
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
        No service results yet.
      </div>

      <div v-else class="entity-grid">
        <article
          v-for="item in data.items"
          :key="item.service_result_id"
          class="entity-card motion-card"
        >
          <div class="entity-card__header">
            <div>
              <div class="entity-card__eyebrow">
                {{ item.site_name }}
              </div>
              <h2 class="entity-card__title">
                {{ item.service_name }}
              </h2>
              <p class="entity-card__subtitle">
                {{ item.host_display_name || item.host_address }}
              </p>
              <p class="entity-card__subtitle">
                {{ item.check_profile_name }}
              </p>
            </div>

            <StatusBadge :status="item.status" />
          </div>

          <div class="entity-card__stats">
            <div class="entity-stat">
              <span class="entity-stat__label">Pass</span>
              <span class="entity-stat__value">{{ item.passed_count }}</span>
            </div>
            <div class="entity-stat">
              <span class="entity-stat__label">Fail</span>
              <span class="entity-stat__value">{{ item.failed_count }}</span>
            </div>
          </div>

          <div class="entity-card__message">
            Updated {{ formatDate(item.generated_at) }}
          </div>

          <div
            v-if="item.connection_error"
            class="entity-card__message entity-card__message--error"
          >
            {{ item.connection_error }}
          </div>

          <div class="entity-card__footer">
            <div class="inline-actions">
              <a
                v-if="item.service_report_html_path"
                :href="artifactUrl(item.service_report_html_path)"
                target="_blank"
                class="link-button"
              >
                HTML
              </a>
              <a
                v-if="item.service_screenshot_file"
                :href="artifactUrl(item.service_screenshot_file)"
                target="_blank"
                class="link-button"
              >
                PNG
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
