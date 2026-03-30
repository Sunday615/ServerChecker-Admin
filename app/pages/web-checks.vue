<script setup lang="ts">
type WebChecksResponse = {
  databaseOnline: boolean
  message: string
  items: Array<{
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
  }>
}

const { formatDate, artifactUrl } = usePortalUtils()

const { data, refresh } = await useFetch<WebChecksResponse>('/api/web-checks/latest', {
  default: () => ({
    databaseOnline: true,
    message: '',
    items: []
  })
})

const failingCount = computed(() => data.value.items.filter(item => item.status !== 'PASS').length)
</script>

<template>
  <div class="page-stack">
    <section class="page-hero">
      <div>
        <span class="section-kicker">Web Monitor</span>
        <h1 class="page-title">
          Web checks
        </h1>
        <p class="page-copy">
          Latest screenshot and browser-check results for each configured web target.
        </p>
      </div>

      <div class="hero-inline-stats">
        <span>{{ data.items.length }} targets</span>
        <span>{{ failingCount }} failing</span>
      </div>
    </section>

    <div v-if="!data.databaseOnline && data.message" class="message-banner message-banner--warning">
      {{ data.message }}
    </div>

    <section class="card-grid">
      <article v-for="item in data.items" :key="item.web_result_id" class="panel-card">
        <div class="panel-card__header">
          <div>
            <span class="section-kicker">{{ item.site_name }}</span>
            <h2 class="panel-card__title">
              {{ item.target_name }}
            </h2>
            <p class="panel-card__subtext">
              {{ formatDate(item.generated_at) }}
            </p>
          </div>

          <PortalStatusPill :status="item.status" />
        </div>

        <div class="kv-grid">
          <div class="kv-item">
            <span class="kv-item__label">Run key</span>
            <strong>{{ item.run_key }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Target URL</span>
            <strong>{{ item.target_url }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Final URL</span>
            <strong>{{ item.final_url || '-' }}</strong>
          </div>
        </div>

        <p class="issue-card__message">
          {{ item.message || 'No message' }}
        </p>

        <div class="action-row">
          <UButton
            v-if="item.web_report_html_path"
            :to="artifactUrl(item.web_report_html_path)"
            target="_blank"
            variant="soft"
            color="neutral"
            icon="i-lucide-file-text"
          >
            HTML
          </UButton>
          <UButton
            v-if="item.screenshot_file"
            :to="artifactUrl(item.screenshot_file)"
            target="_blank"
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
