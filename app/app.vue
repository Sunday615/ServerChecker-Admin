<script setup lang="ts">
const portalRoot = ref<HTMLElement | null>(null)
const route = useRoute()

const navigationGroups = [
  {
    label: 'General',
    items: [
      {
        label: 'Overview',
        caption: 'Threat posture',
        to: '/',
        icon: 'i-fa6-solid-table-cells-large'
      },
      {
        label: 'Issues',
        caption: 'Service alerts',
        to: '/services',
        icon: 'i-fa6-solid-triangle-exclamation'
      },
      {
        label: 'Runs',
        caption: 'Execution log',
        to: '/runs',
        icon: 'i-fa6-solid-chart-line'
      }
    ]
  },
  {
    label: 'Reports',
    items: [
      {
        label: 'Web Threats',
        caption: 'Browser targets',
        to: '/web-checks',
        icon: 'i-fa6-solid-shield-halved'
      },
      {
        label: 'Gallery',
        caption: 'PNG room',
        to: '/gallery',
        icon: 'i-fa6-solid-images'
      },
      {
        label: 'Files',
        caption: 'Artifacts',
        to: '/reports',
        icon: 'i-fa6-solid-folder-open'
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

const topbarTitle = computed(() => {
  return route.path === '/'
    ? 'Welcome back, security team'
    : activeSection.value.label
})

const topbarSubtitle = computed(() => {
  return route.path === '/'
    ? 'Security is a process, not a product.'
    : activeSection.value.caption
})

const searchPlaceholder = computed(() => {
  return `Search issues, hosts, files, or ${activeSection.value.label.toLowerCase()}...`
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
              aria-label="Server Guard home"
            >
              <span class="brand-block__mark">
                <span class="brand-block__mark-dot" />
                <span class="brand-block__mark-dot" />
                <span class="brand-block__mark-dot" />
                <span class="brand-block__mark-dot" />
              </span>

              <span class="brand-block__wordmark">
                <strong>ServerGuard</strong>
                <small>security console</small>
              </span>
            </NuxtLink>

            <button
              type="button"
              class="sidebar-toggle"
              aria-label="Sidebar options"
            >
              <UIcon name="i-fa6-solid-bars" />
            </button>
          </div>

          <div class="sidebar-store">
            <span class="sidebar-meta-label">Cluster</span>

            <div class="sidebar-store__card">
              <span class="sidebar-store__badge">SG</span>

              <div class="sidebar-store__content">
                <strong>Primary Cluster</strong>
                <span>live threat monitoring</span>
              </div>

              <UIcon name="i-fa6-solid-up-down" />
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
              OP
            </div>

            <div class="sidebar-profile__content">
              <strong>Threat Ops</strong>
              <span>dark response mode</span>
            </div>

            <UIcon name="i-fa6-solid-up-down" />
          </div>
        </aside>

        <section class="portal-main">
          <header class="topbar">
            <div class="topbar__context">
              <span class="topbar__eyebrow">Threat operations workspace</span>

              <h1 class="topbar__headline">
                {{ topbarTitle }}
              </h1>

              <p class="topbar__subcopy">
                {{ topbarSubtitle }}
              </p>
            </div>

            <div class="topbar__actions">
              <label class="topbar-search">
                <UIcon name="i-fa6-solid-magnifying-glass" />
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
                <UIcon name="i-fa6-solid-bell" />
              </button>

              <button
                type="button"
                class="topbar-icon"
                aria-label="Settings"
              >
                <UIcon name="i-fa6-solid-sliders" />
              </button>

              <button
                type="button"
                class="topbar-icon"
                aria-label="Account"
              >
                <UIcon name="i-fa6-solid-circle-user" />
              </button>

              <PortalRunQuickButton />

              <div
                class="topbar-avatar"
                aria-hidden="true"
              >
                SG
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
