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
      <PortalSectionHeader
        level="page"
        eyebrow="Web Monitor"
        title="Web checks"
        description="Latest screenshot and browser-check results for each configured web target."
      />

      <div class="hero-inline-stats">
        <span>{{ data.items.length }} targets</span>
        <span>{{ failingCount }} failing</span>
      </div>
    </section>

    <div v-if="!data.databaseOnline && data.message" class="message-banner message-banner--warning">
      {{ data.message }}
    </div>

    <section class="card-grid">
      <PortalCard v-for="item in data.items" :key="item.web_result_id">
        <div class="panel-card__header">
          <PortalSectionHeader
            level="section"
            :eyebrow="item.site_name"
            :title="item.target_name"
            :description="formatDate(item.generated_at)"
          />

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
          <PortalActionButton
            v-if="item.web_report_html_path"
            :href="artifactUrl(item.web_report_html_path)"
            target="_blank"
            tone="secondary"
            size="sm"
            icon="i-lucide-file-text"
          >
            HTML
          </PortalActionButton>
          <PortalActionButton
            v-if="item.screenshot_file"
            :href="artifactUrl(item.screenshot_file)"
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
