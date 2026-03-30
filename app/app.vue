<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  title: 'Server Checker Control Center',
  description: 'Custom operations portal for checker runs, service health, web monitoring, and report artifacts.'
})

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Run History', to: '/runs' },
  { label: 'Service Health', to: '/services' },
  { label: 'Web Monitor', to: '/web-checks' },
  { label: 'Reports', to: '/reports' }
]

const route = useRoute()
const shellRef = ref<HTMLElement | null>(null)

usePortalMotion(shellRef)
</script>

<template>
  <UApp>
    <div ref="shellRef" class="layout-shell">
      <div class="layout-grid" />
      <div class="layout-orb layout-orb--cyan" />
      <div class="layout-orb layout-orb--blue" />
      <div class="layout-beam" />

      <aside class="layout-sidebar">
        <NuxtLink to="/" class="brand-block">
          <div class="brand-block__badge-wrap">
            <span class="brand-block__badge">SC</span>
            <span class="brand-block__pulse" />
          </div>
          <div>
            <span class="section-kicker">Operations Portal</span>
            <h1 class="brand-block__title">
              Server Checker
            </h1>
            <p class="brand-block__text">
              Futuristic control surface for Python checks, MySQL snapshots, and artifact review.
            </p>
          </div>
        </NuxtLink>

        <PortalRunControl />

        <nav class="sidebar-nav">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="sidebar-nav__link"
            active-class="sidebar-nav__link--active"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </aside>

      <div class="layout-main">
        <header class="topbar">
          <div class="topbar__copy">
            <span class="section-kicker">Monitoring Workspace</span>
            <h2 class="topbar__title">
              Control Center
            </h2>
            <p class="topbar__text">
              Watch live health, review failures, and open artifacts from a single operational deck.
            </p>
          </div>

          <div class="topbar__signal">
            <span class="topbar__signal-label">Route</span>
            <strong class="topbar__signal-value">{{ route.path }}</strong>
          </div>
        </header>

        <main class="layout-content">
          <NuxtPage />
        </main>
      </div>
    </div>
  </UApp>
</template>
