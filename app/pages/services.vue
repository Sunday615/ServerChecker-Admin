<script setup lang="ts">
type ServicesResponse = {
  databaseOnline: boolean
  message: string
  items: Array<{
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
  }>
}

const { formatDate, artifactUrl } = usePortalUtils()

const { data, refresh } = await useFetch<ServicesResponse>('/api/services/latest', {
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
        eyebrow="Services"
        title="Service health"
        description="Latest result for every configured service check across all hosts and sites."
      />

      <div class="hero-inline-stats">
        <span>{{ data.items.length }} services</span>
        <span>{{ failingCount }} failing</span>
      </div>
    </section>

    <div v-if="!data.databaseOnline && data.message" class="message-banner message-banner--warning">
      {{ data.message }}
    </div>

    <section class="card-grid">
      <PortalCard v-for="item in data.items" :key="item.service_result_id">
        <div class="panel-card__header">
          <PortalSectionHeader
            level="section"
            :eyebrow="item.site_name"
            :title="item.service_name"
            :description="`${item.host_display_name || item.host_address} • ${formatDate(item.generated_at)}`"
          />

          <PortalStatusPill :status="item.status" />
        </div>

        <div class="kv-grid">
          <div class="kv-item">
            <span class="kv-item__label">Run key</span>
            <strong>{{ item.run_key }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Profile</span>
            <strong>{{ item.check_profile_name || '-' }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Passed steps</span>
            <strong>{{ item.passed_count }}</strong>
          </div>
          <div class="kv-item">
            <span class="kv-item__label">Failed steps</span>
            <strong>{{ item.failed_count }}</strong>
          </div>
        </div>

        <p v-if="item.connection_error" class="issue-card__message issue-card__message--error">
          {{ item.connection_error }}
        </p>

        <div class="action-row">
          <PortalActionButton
            v-if="item.service_report_html_path"
            :href="artifactUrl(item.service_report_html_path)"
            target="_blank"
            tone="secondary"
            size="sm"
            icon="i-fa6-solid-file-lines"
          >
            HTML
          </PortalActionButton>
          <PortalActionButton
            v-if="item.service_screenshot_file"
            :href="artifactUrl(item.service_screenshot_file)"
            target="_blank"
            tone="secondary"
            size="sm"
            icon="i-fa6-solid-image"
          >
            PNG
          </PortalActionButton>
        </div>
      </PortalCard>
    </section>
  </div>
</template>
