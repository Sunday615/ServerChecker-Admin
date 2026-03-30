<script setup lang="ts">
const portalRoot = ref<HTMLElement | null>(null)
const route = useRoute()

const navigation = [
  {
    label: 'Dashboard',
    caption: 'Overview',
    to: '/',
    icon: 'i-lucide-house'
  },
  {
    label: 'Runs',
    caption: 'History',
    to: '/runs',
    icon: 'i-lucide-history'
  },
  {
    label: 'Services',
    caption: 'Hosts',
    to: '/services',
    icon: 'i-lucide-server'
  },
  {
    label: 'Web Checks',
    caption: 'Browser',
    to: '/web-checks',
    icon: 'i-lucide-globe'
  },
  {
    label: 'Reports',
    caption: 'Artifacts',
    to: '/reports',
    icon: 'i-lucide-file-text'
  }
]

const activeSection = computed(() => {
  return navigation.find(item => item.to === route.path) || {
    label: 'Dashboard',
    caption: 'Overview',
    to: '/',
    icon: 'i-lucide-house'
  }
})

const todayLabel = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date())
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
      <span class="layout-grid" />
      <span class="layout-beam layout-beam--one" />
      <span class="layout-beam layout-beam--two" />
      <span class="layout-orb layout-orb--one" />
      <span class="layout-orb layout-orb--two" />
      <span class="layout-capsule layout-capsule--one" />
      <span class="layout-capsule layout-capsule--two" />

      <div class="portal-surface">
        <aside class="portal-sidebar brand-block">
          <NuxtLink
            to="/"
            class="brand-block__logo"
            aria-label="Server Checker home"
          >
            <span class="brand-block__badge">SC</span>
            <span class="brand-block__wordmark">
              <small>server</small>
              <strong>checker</strong>
            </span>
          </NuxtLink>

          <nav class="sidebar-nav">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              :title="item.label"
              :aria-label="item.label"
              :class="['sidebar-nav__link', { 'is-active': route.path === item.to }]"
            >
              <span class="sidebar-nav__icon">
                <UIcon :name="item.icon" />
              </span>

              <span class="sidebar-nav__sr">{{ item.label }}</span>
            </NuxtLink>
          </nav>

          <div class="sidebar-profile" aria-hidden="true">
            <div class="sidebar-profile__avatar">
              PY
            </div>
            <span class="sidebar-profile__status" />
          </div>
        </aside>

        <section class="portal-main">
          <header class="topbar">
            <div>
              <span class="topbar__eyebrow">Server Check Portal</span>
              <p class="topbar__title">
                {{ activeSection.label }}
              </p>
            </div>

            <div class="topbar__actions">
              <span class="topbar__chip">{{ todayLabel }}</span>
              <span class="topbar__chip">Apache ECharts + GSAP</span>
              <PortalRunQuickButton />
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
