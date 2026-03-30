<script setup lang="ts">
type WebCheckItem = {
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
}

const { data, refresh } = await useFetch<{
  databaseOnline: boolean
  message: string
  items: WebCheckItem[]
}>('/api/web-checks/latest', {
  default: () => ({
    databaseOnline: true,
    message: '',
    items: []
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
            Latest web checks
          </h1>
          <p class="panel__description">
            Screenshot-based health checks captured by the Python Playwright worker.
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
        No web checks yet.
      </div>

      <div v-else class="entity-grid entity-grid--wide">
        <article
          v-for="item in data.items"
          :key="item.web_result_id"
          class="entity-card entity-card--media motion-card"
        >
          <div class="entity-card__header">
            <div>
              <div class="entity-card__eyebrow">
                {{ item.site_name }}
              </div>
              <h2 class="entity-card__title">
                {{ item.target_name }}
              </h2>
              <p class="entity-card__subtitle entity-card__subtitle--wrap">
                {{ item.target_url }}
              </p>
              <p class="entity-card__subtitle">
                Updated {{ formatDate(item.generated_at) }}
              </p>
            </div>

            <StatusBadge :status="item.status" />
          </div>

          <div class="entity-card__message">
            Final URL: {{ item.final_url || '-' }}
          </div>

          <div class="entity-card__message">
            {{ item.message || '-' }}
          </div>

          <img
            v-if="item.screenshot_file"
            :src="artifactUrl(item.screenshot_file)"
            :alt="item.target_name"
            class="thumbnail motion-media"
          >

          <div class="entity-card__footer">
            <div class="inline-actions">
              <a
                v-if="item.web_report_html_path"
                :href="artifactUrl(item.web_report_html_path)"
                target="_blank"
                class="link-button"
              >
                HTML report
              </a>
              <a
                v-if="item.screenshot_file"
                :href="artifactUrl(item.screenshot_file)"
                target="_blank"
                class="link-button"
              >
                Open screenshot
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
