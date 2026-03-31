<script setup lang="ts">
type GalleryItem = {
  id: string
  zone: 'DC' | 'DR' | 'OTHER'
  source: 'service' | 'web' | 'summary'
  sourceLabel: string
  siteName: string
  title: string
  subtitle: string
  status: string
  generatedAt: string
  runKey: string
  imagePath: string
  reportPath: string
  meta: string
  targetUrl: string
  note: string
}

type GalleryResponse = {
  databaseOnline: boolean
  message: string
  items: GalleryItem[]
}

type GallerySection = {
  id: 'DC' | 'DR' | 'OTHER'
  zone: 'DC' | 'DR' | 'OTHER'
  title: string
  description: string
  items: GalleryItem[]
}

type ZoneTab = 'ALL' | 'DC' | 'DR' | 'OTHER'
type SourceTab = 'ALL' | 'service' | 'web' | 'summary'
type StatusTab = 'ALL' | 'attention' | 'healthy' | 'stopped'
type SortMode = 'newest' | 'oldest' | 'site' | 'source'
type DensityMode = 'comfortable' | 'compact'

const { formatDate, artifactUrl } = usePortalUtils()

useSeoMeta({
  title: 'Gallery',
  description: 'Gallery room for PNG screenshots captured by the monitoring backend, grouped by DC and DR.'
})

const { data, refresh } = await useFetch<GalleryResponse>('/api/gallery/items', {
  default: () => ({
    databaseOnline: true,
    message: '',
    items: []
  })
})

const searchText = ref('')
const activeZone = ref<ZoneTab>('ALL')
const activeSource = ref<SourceTab>('ALL')
const activeStatus = ref<StatusTab>('ALL')
const sortBy = ref<SortMode>('newest')
const density = ref<DensityMode>('comfortable')
const onlyWithHtml = ref(false)
const currentPage = ref(1)

const items = computed(() => data.value.items || [])

const normalize = (value: string | null | undefined) => {
  return String(value || '').trim().toLowerCase()
}

const isHealthyStatus = (status: string) => {
  const normalized = status.toUpperCase()
  return normalized === 'PASS' || normalized === 'COMPLETED'
}

const isStoppedStatus = (status: string) => {
  return status.toUpperCase() === 'STOPPED'
}

const matchesSearch = (item: GalleryItem, query: string) => {
  if (!query) {
    return true
  }

  const haystack = [
    item.title,
    item.subtitle,
    item.siteName,
    item.sourceLabel,
    item.status,
    item.runKey,
    item.meta,
    item.note,
    item.targetUrl
  ].join(' ').toLowerCase()

  return haystack.includes(query)
}

const zoneTabs = computed(() => {
  const counts = {
    ALL: items.value.length,
    DC: items.value.filter(item => item.zone === 'DC').length,
    DR: items.value.filter(item => item.zone === 'DR').length,
    OTHER: items.value.filter(item => item.zone === 'OTHER').length
  }

  return [
    { id: 'ALL' as const, label: 'All rooms', count: counts.ALL },
    { id: 'DC' as const, label: 'DC room', count: counts.DC },
    { id: 'DR' as const, label: 'DR room', count: counts.DR },
    { id: 'OTHER' as const, label: 'Other', count: counts.OTHER }
  ]
})

const sourceTabs = computed(() => {
  const counts = {
    ALL: items.value.length,
    service: items.value.filter(item => item.source === 'service').length,
    web: items.value.filter(item => item.source === 'web').length,
    summary: items.value.filter(item => item.source === 'summary').length
  }

  return [
    { id: 'ALL' as const, label: 'All sources', count: counts.ALL },
    { id: 'service' as const, label: 'Service', count: counts.service },
    { id: 'web' as const, label: 'Web', count: counts.web },
    { id: 'summary' as const, label: 'Summary', count: counts.summary }
  ]
})

const statusTabs = computed(() => {
  const counts = {
    ALL: items.value.length,
    attention: items.value.filter(item => !isHealthyStatus(item.status) && !isStoppedStatus(item.status)).length,
    healthy: items.value.filter(item => isHealthyStatus(item.status)).length,
    stopped: items.value.filter(item => isStoppedStatus(item.status)).length
  }

  return [
    { id: 'ALL' as const, label: 'All status', count: counts.ALL },
    { id: 'attention' as const, label: 'Attention', count: counts.attention },
    { id: 'healthy' as const, label: 'Healthy', count: counts.healthy },
    { id: 'stopped' as const, label: 'Stopped', count: counts.stopped }
  ]
})

const filteredItems = computed(() => {
  const query = normalize(searchText.value)

  const filtered = items.value.filter((item) => {
    if (activeZone.value !== 'ALL' && item.zone !== activeZone.value) {
      return false
    }

    if (activeSource.value !== 'ALL' && item.source !== activeSource.value) {
      return false
    }

    if (activeStatus.value === 'attention' && (isHealthyStatus(item.status) || isStoppedStatus(item.status))) {
      return false
    }

    if (activeStatus.value === 'healthy' && !isHealthyStatus(item.status)) {
      return false
    }

    if (activeStatus.value === 'stopped' && !isStoppedStatus(item.status)) {
      return false
    }

    if (onlyWithHtml.value && !item.reportPath) {
      return false
    }

    return matchesSearch(item, query)
  })

  return filtered.sort((left, right) => {
    if (sortBy.value === 'oldest') {
      return new Date(left.generatedAt).getTime() - new Date(right.generatedAt).getTime()
    }

    if (sortBy.value === 'site') {
      return left.siteName.localeCompare(right.siteName) || left.title.localeCompare(right.title)
    }

    if (sortBy.value === 'source') {
      return left.sourceLabel.localeCompare(right.sourceLabel) || left.siteName.localeCompare(right.siteName)
    }

    return new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime()
  })
})

const pageSize = computed(() => {
  return density.value === 'compact' ? 12 : 8
})

const pageCount = computed(() => {
  return Math.max(Math.ceil(filteredItems.value.length / pageSize.value), 1)
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const pagedSections = computed<GallerySection[]>(() => {
  const orderedZones = activeZone.value === 'ALL'
    ? ['DC', 'DR', 'OTHER'] as const
    : [activeZone.value]
  const sections: GallerySection[] = []

  for (const zone of orderedZones) {
    const sectionItems = paginatedItems.value.filter(item => item.zone === zone)

    if (!sectionItems.length) {
      continue
    }

    sections.push({
      id: zone,
      zone,
      title: zone === 'OTHER' ? 'Other gallery' : `${zone} gallery`,
      description: zone === 'OTHER'
        ? 'Assets on this page that are not mapped to DC or DR.'
        : `${sectionItems.length} screenshot${sectionItems.length === 1 ? '' : 's'} on this page in the ${zone} room.`,
      items: sectionItems
    })
  }

  return sections
})

const totalImages = computed(() => items.value.length)
const dcCount = computed(() => items.value.filter(item => item.zone === 'DC').length)
const drCount = computed(() => items.value.filter(item => item.zone === 'DR').length)
const attentionCount = computed(() => items.value.filter(item => !isHealthyStatus(item.status) && !isStoppedStatus(item.status)).length)

const activeFilterTags = computed(() => {
  return [
    activeZone.value !== 'ALL' ? activeZone.value : '',
    activeSource.value !== 'ALL' ? activeSource.value.toUpperCase() : '',
    activeStatus.value !== 'ALL' ? activeStatus.value.toUpperCase() : '',
    onlyWithHtml.value ? 'HAS HTML' : '',
    searchText.value.trim() ? `SEARCH: ${searchText.value.trim()}` : ''
  ].filter(Boolean)
})

const clearFilters = () => {
  searchText.value = ''
  activeZone.value = 'ALL'
  activeSource.value = 'ALL'
  activeStatus.value = 'ALL'
  sortBy.value = 'newest'
  density.value = 'comfortable'
  onlyWithHtml.value = false
  currentPage.value = 1
}

watch([searchText, activeZone, activeSource, activeStatus, sortBy, density, onlyWithHtml], () => {
  currentPage.value = 1
})

watch([() => filteredItems.value.length, pageCount], () => {
  currentPage.value = Math.min(currentPage.value, pageCount.value) || 1
})
</script>

<template>
  <div class="page-stack gallery-page">
    <section class="page-hero gallery-hero">
      <PortalSectionHeader
        level="page"
        eyebrow="Gallery Room"
        title="PNG screenshot gallery for service, web, and summary captures."
        description="Browse screenshots in one room, split DC and DR clearly, and refine with full-option search, tabs, and sort controls."
      />

      <div class="gallery-hero__actions">
        <PortalActionButton
          icon="i-fa6-solid-rotate-right"
          tone="secondary"
          size="md"
          @click="refresh()"
        >
          Refresh
        </PortalActionButton>

        <PortalActionButton
          icon="i-fa6-solid-filter"
          tone="ghost"
          size="md"
          @click="clearFilters"
        >
          Clear filters
        </PortalActionButton>
      </div>
    </section>

    <div
      v-if="!data.databaseOnline && data.message"
      class="message-banner message-banner--warning"
    >
      {{ data.message }}
    </div>

    <section class="dashboard-stat-grid gallery-stat-grid">
      <PortalStatCard
        label="All PNG"
        :value="String(totalImages)"
        hint="Combined screenshots across every source."
        detail="Gallery room"
        detail-tone="neutral"
        :progress="100"
        icon="i-fa6-solid-images"
        accent="primary"
      />
      <PortalStatCard
        label="DC Room"
        :value="String(dcCount)"
        hint="Production-side gallery cluster."
        detail="DC segmented"
        detail-tone="neutral"
        :progress="totalImages ? Math.round((dcCount / totalImages) * 100) : 0"
        icon="i-fa6-solid-server"
        accent="soft"
      />
      <PortalStatCard
        label="DR Room"
        :value="String(drCount)"
        hint="Recovery-side gallery cluster."
        detail="DR segmented"
        detail-tone="neutral"
        :progress="totalImages ? Math.round((drCount / totalImages) * 100) : 0"
        icon="i-fa6-solid-network-wired"
        accent="soft"
      />
      <PortalStatCard
        label="Attention"
        :value="String(attentionCount)"
        hint="Screenshots tied to failing or risky status."
        detail="Needs review"
        detail-tone="danger"
        :progress="totalImages ? Math.round((attentionCount / totalImages) * 100) : 0"
        icon="i-fa6-solid-triangle-exclamation"
        accent="soft"
      />
    </section>

    <section class="gallery-layout">
      <PortalCard class="gallery-sidebar">
        <div class="panel-card__header">
          <PortalSectionHeader
            level="section"
            eyebrow="Filter Lab"
            title="Full option search"
            description="Slice the gallery by room, source, health state, search query, and sort order."
          />
        </div>

        <label class="gallery-search">
          <span class="gallery-search__icon">
            <UIcon name="i-fa6-solid-magnifying-glass" />
          </span>

          <input
            v-model="searchText"
            type="text"
            placeholder="Search site, service, target, run key, status..."
          >
        </label>

        <div class="gallery-filter-block">
          <span class="gallery-filter-label">Room tabs</span>

          <div class="gallery-tab-list">
            <button
              v-for="tab in zoneTabs"
              :key="tab.id"
              type="button"
              :class="['gallery-tab', { 'is-active': activeZone === tab.id }]"
              @click="activeZone = tab.id"
            >
              <span>{{ tab.label }}</span>
              <small>{{ tab.count }}</small>
            </button>
          </div>
        </div>

        <div class="gallery-filter-block">
          <span class="gallery-filter-label">Source tabs</span>

          <div class="gallery-tab-list">
            <button
              v-for="tab in sourceTabs"
              :key="tab.id"
              type="button"
              :class="['gallery-tab', { 'is-active': activeSource === tab.id }]"
              @click="activeSource = tab.id"
            >
              <span>{{ tab.label }}</span>
              <small>{{ tab.count }}</small>
            </button>
          </div>
        </div>

        <div class="gallery-filter-block">
          <span class="gallery-filter-label">Status tabs</span>

          <div class="gallery-tab-list">
            <button
              v-for="tab in statusTabs"
              :key="tab.id"
              type="button"
              :class="['gallery-tab', { 'is-active': activeStatus === tab.id }]"
              @click="activeStatus = tab.id"
            >
              <span>{{ tab.label }}</span>
              <small>{{ tab.count }}</small>
            </button>
          </div>
        </div>

        <div class="gallery-control-grid">
          <label class="gallery-select">
            <span>Sort order</span>
            <select v-model="sortBy">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="site">Site A-Z</option>
              <option value="source">Source A-Z</option>
            </select>
          </label>

          <label class="gallery-select">
            <span>Density</span>
            <select v-model="density">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
        </div>

        <label class="gallery-toggle">
          <input
            v-model="onlyWithHtml"
            type="checkbox"
          >
          <span>Show only items with matching HTML report</span>
        </label>

        <div class="gallery-filter-block">
          <div class="gallery-filter-row">
            <span class="gallery-filter-label">Active filters</span>

            <PortalActionButton
              icon="i-fa6-solid-filter-circle-xmark"
              tone="ghost"
              size="sm"
              @click="clearFilters"
            >
              Reset
            </PortalActionButton>
          </div>

          <div class="gallery-chip-list">
            <span
              v-for="tag in activeFilterTags"
              :key="tag"
              class="gallery-chip"
            >
              {{ tag }}
            </span>

            <span
              v-if="activeFilterTags.length === 0"
              class="gallery-chip gallery-chip--muted"
            >
              No extra filters applied
            </span>
          </div>
        </div>
      </PortalCard>

      <div class="gallery-main">
        <PortalCard class="gallery-toolbar">
          <div class="gallery-toolbar__summary">
            <strong>{{ filteredItems.length }} screenshots</strong>
            <span>DC and DR rooms are grouped below with live PNG preview cards.</span>
          </div>

          <div class="gallery-chip-list">
            <span class="gallery-chip">{{ dcCount }} DC</span>
            <span class="gallery-chip">{{ drCount }} DR</span>
            <span class="gallery-chip">{{ attentionCount }} attention</span>
          </div>
        </PortalCard>

        <PortalPagination
          v-if="filteredItems.length"
          v-model:page="currentPage"
          class="page-pagination"
          :page-count="pageCount"
          :total-items="filteredItems.length"
          :page-size="pageSize"
          item-label="screenshots"
          compact
        />

        <template v-if="pagedSections.length">
          <section
            v-for="section in pagedSections"
            :key="section.id"
            class="gallery-section"
          >
            <div class="gallery-section__header">
              <PortalSectionHeader
                level="section"
                :eyebrow="section.zone"
                :title="section.title"
                :description="section.description"
              />
            </div>

            <div :class="['gallery-grid', `gallery-grid--${density}`]">
              <PortalCard
                v-for="item in section.items"
                :key="item.id"
                class="gallery-card"
              >
                <div class="gallery-card__media">
                  <img
                    :src="artifactUrl(item.imagePath)"
                    :alt="item.title"
                    loading="lazy"
                  >

                  <div class="gallery-card__badges">
                    <span class="gallery-badge gallery-badge--zone">{{ item.zone }}</span>
                    <span class="gallery-badge gallery-badge--source">{{ item.sourceLabel }}</span>
                    <PortalStatusPill :status="item.status" />
                  </div>
                </div>

                <div class="gallery-card__body">
                  <div class="gallery-card__copy">
                    <span class="gallery-card__eyebrow">{{ item.siteName }} • {{ item.runKey }}</span>
                    <h3 class="gallery-card__title">{{ item.title }}</h3>
                    <p class="gallery-card__subtitle">{{ item.subtitle }}</p>
                  </div>

                  <div class="gallery-card__meta">
                    <span>{{ formatDate(item.generatedAt) }}</span>
                    <span>{{ item.meta }}</span>
                  </div>

                  <p class="gallery-card__note">
                    {{ item.note }}
                  </p>

                  <div class="action-row">
                    <PortalActionButton
                      :href="artifactUrl(item.imagePath)"
                      target="_blank"
                      tone="primary"
                      size="sm"
                      icon="i-fa6-solid-image"
                    >
                      Open PNG
                    </PortalActionButton>

                    <PortalActionButton
                      v-if="item.reportPath"
                      :href="artifactUrl(item.reportPath)"
                      target="_blank"
                      tone="secondary"
                      size="sm"
                      icon="i-fa6-solid-file-lines"
                    >
                      Open HTML
                    </PortalActionButton>
                  </div>
                </div>
              </PortalCard>
            </div>
          </section>

          <PortalPagination
            v-model:page="currentPage"
            class="page-pagination"
            :page-count="pageCount"
            :total-items="filteredItems.length"
            :page-size="pageSize"
            item-label="screenshots"
          />
        </template>

        <PortalCard
          v-else
          class="gallery-empty"
        >
          <strong>No screenshots matched this filter set.</strong>
          <span>Try switching tabs, clearing filters, or broadening the search query.</span>
        </PortalCard>
      </div>
    </section>
  </div>
</template>
