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
</script>

<template>
  <UApp>
    <div class="layout-shell">
      <aside class="layout-sidebar">
        <NuxtLink to="/" class="brand-block">
          <span class="brand-block__badge">SC</span>
          <div>
            <span class="section-kicker">Operations Portal</span>
            <h1 class="brand-block__title">
              Server Checker
            </h1>
            <p class="brand-block__text">
              Custom web portal for the Python monitoring project and MySQL-backed report history.
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
          <div>
            <span class="section-kicker">Monitoring Workspace</span>
            <h2 class="topbar__title">
              Control Center
            </h2>
          </div>

          <p class="topbar__text">
            Run checks, review failures, and open generated artifacts from one place.
          </p>
        </header>

        <main class="layout-content">
          <NuxtPage />
        </main>
      </div>
    </div>
  </UApp>
</template>
