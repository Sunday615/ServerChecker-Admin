<script setup lang="ts">
const shellRef = ref<HTMLElement | null>(null)

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Server Checker Control Center'
const description = 'Operations portal for run history, service health, web monitoring, reports, and manual checker execution.'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Run History', to: '/runs' },
  { label: 'Service Health', to: '/services' },
  { label: 'Web Monitor', to: '/web-checks' },
  { label: 'Reports', to: '/reports' }
]

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/favicon.ico',
  twitterImage: '/favicon.ico',
  twitterCard: 'summary_large_image'
})

usePortalMotion(shellRef)
</script>

<template>
  <UApp>
    <div
      ref="shellRef"
      class="portal-shell"
    >
      <div class="portal-statusbar">
        <div class="portal-statusbar__inner">
          <div class="portal-statusbar__meta">
            <span class="portal-chip">Custom Portal</span>
            <span class="portal-statusbar__text">Nuxt portal linked to Python checker and MySQL history</span>
          </div>
          <span class="portal-statusbar__text">Manual run, report review, and live status in one place</span>
        </div>
      </div>

      <header class="portal-header">
        <div class="portal-header__inner">
          <NuxtLink
            to="/"
            class="portal-brand motion-brand"
          >
            <span class="portal-brand__mark motion-brand-mark">SC</span>
            <span class="portal-stack">
              <span class="portal-kicker">Monitoring workspace</span>
              <span class="portal-brand__title">Server Checker Control Center</span>
              <span class="portal-brand__subtitle">Custom operations dashboard for service checks, web checks, and report artifacts</span>
            </span>
          </NuxtLink>

          <nav class="portal-nav">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="portal-nav__link motion-nav-item"
              active-class="portal-nav__link--active"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <div class="portal-actions">
            <span class="motion-header-action">
              <RunCheckButton compact />
            </span>
          </div>
        </div>
      </header>

      <main class="portal-main">
        <NuxtPage />
      </main>
    </div>

    <UToaster />
  </UApp>
</template>
