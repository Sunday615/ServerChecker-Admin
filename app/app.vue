<script setup lang="ts">
const portalRoot = ref<HTMLElement | null>(null)
const route = useRoute()

const navigationGroups = [
  {
    label: 'General',
    items: [
      {
        label: 'Dashboard',
        caption: 'Overview',
        to: '/',
        icon: 'i-lucide-layout-dashboard'
      },
      {
        label: 'Runs',
        caption: 'Execution history',
        to: '/runs',
        icon: 'i-lucide-history'
      }
    ]
  },
  {
    label: 'Monitoring',
    items: [
      {
        label: 'Services',
        caption: 'Service health',
        to: '/services',
        icon: 'i-lucide-server'
      },
      {
        label: 'Web Checks',
        caption: 'Browser targets',
        to: '/web-checks',
        icon: 'i-lucide-monitor-check'
      },
      {
        label: 'Reports',
        caption: 'Artifacts',
        to: '/reports',
        icon: 'i-lucide-files'
      }
    ]
  }
] as const

const navigation = navigationGroups.flatMap(group =>
  group.items.map(item => ({
    ...item,
    group: group.label
  }))
)

const fallbackSection = navigation[0]!

const activeSection = computed<(typeof navigation)[number]>(() => {
  return navigation.find(item => {
    if (item.to === '/') {
      return route.path === '/'
    }

    return route.path.startsWith(item.to)
  }) || fallbackSection
})

const searchPlaceholder = computed(() => {
  return `Search ${activeSection.value.label.toLowerCase()}, reports, or runs...`
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  titleTemplate: title => title ? `${title} | Server Check Portal` : 'Server Check Portal',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  title: 'Dashboard',
  description: 'Operations dashboard for Python server-checker runs, service health, web monitoring, and report artifacts.'
})

usePortalMotion(portalRoot)
</script>

<template>
  <UApp>
    <div
      ref="portalRoot"
      class="portal-shell"
    >
      <div class="portal-layout">
        <aside class="portal-sidebar brand-block">
          <div class="brand-block__header">
            <NuxtLink
              to="/"
              class="brand-block__logo"
              aria-label="Server Checker home"
            >
              <span class="brand-block__mark">
                <span class="brand-block__mark-dot" />
                <span class="brand-block__mark-dot" />
                <span class="brand-block__mark-dot" />
                <span class="brand-block__mark-dot" />
              </span>

              <span class="brand-block__wordmark">
                <strong>Server Portal</strong>
                <small>checker workspace</small>
              </span>
            </NuxtLink>

            <button
              type="button"
              class="sidebar-toggle"
              aria-label="Sidebar options"
            >
              <UIcon name="i-lucide-panel-left-close" />
            </button>
          </div>

          <div class="sidebar-store">
            <span class="sidebar-meta-label">Workspace</span>

            <div class="sidebar-store__card">
              <span class="sidebar-store__badge">SC</span>

              <div class="sidebar-store__content">
                <strong>Server Checker</strong>
                <span>Production portal</span>
              </div>

              <UIcon name="i-lucide-chevrons-up-down" />
            </div>
          </div>

          <div
            v-for="group in navigationGroups"
            :key="group.label"
            class="sidebar-group"
          >
            <span class="sidebar-group__label">{{ group.label }}</span>

            <nav class="sidebar-nav">
              <NuxtLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                :class="['sidebar-nav__link', { 'is-active': activeSection.to === item.to }]"
              >
                <span class="sidebar-nav__icon">
                  <UIcon :name="item.icon" />
                </span>

                <span class="sidebar-nav__content">
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.caption }}</small>
                </span>
              </NuxtLink>
            </nav>
          </div>

          <div class="sidebar-spacer" />

          <div class="sidebar-profile">
            <div class="sidebar-profile__avatar">
              SC
            </div>

            <div class="sidebar-profile__content">
              <strong>Ops Console</strong>
              <span>mysql + python runner</span>
            </div>

            <UIcon name="i-lucide-chevrons-up-down" />
          </div>
        </aside>

        <section class="portal-main">
          <header class="topbar">
            <div class="topbar__context">
              <div class="topbar__crumbs-row">
                <button
                  type="button"
                  class="topbar-icon topbar-icon--ghost"
                  aria-label="Previous"
                >
                  <UIcon name="i-lucide-chevron-left" />
                </button>

                <button
                  type="button"
                  class="topbar-icon topbar-icon--ghost"
                  aria-label="Next"
                >
                  <UIcon name="i-lucide-chevron-right" />
                </button>

                <p class="topbar__crumbs">
                  <span>Pages</span>
                  <UIcon name="i-lucide-chevron-right" />
                  <strong>{{ activeSection.label }}</strong>
                </p>
              </div>

              <p class="topbar__subcopy">
                {{ activeSection.caption }}
              </p>
            </div>

            <div class="topbar__actions">
              <label class="topbar-search">
                <UIcon name="i-lucide-search" />
                <input
                  type="text"
                  :placeholder="searchPlaceholder"
                >
              </label>

              <button
                type="button"
                class="topbar-icon"
                aria-label="Notifications"
              >
                <UIcon name="i-lucide-bell" />
              </button>

              <button
                type="button"
                class="topbar-icon"
                aria-label="Settings"
              >
                <UIcon name="i-lucide-settings-2" />
              </button>

              <button
                type="button"
                class="topbar-icon"
                aria-label="Help"
              >
                <UIcon name="i-lucide-circle-help" />
              </button>

              <PortalRunQuickButton />

              <div
                class="topbar-avatar"
                aria-hidden="true"
              >
                SC
              </div>
            </div>
          </header>

          <div class="portal-main__body">
            <NuxtPage />
          </div>
        </section>
      </div>
    </div>
  </UApp>
</template>
