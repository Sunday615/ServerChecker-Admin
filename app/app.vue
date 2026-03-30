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

const title = 'Server Check Portal'
const description = 'Unified monitoring portal for service checks, web checks, reports, and manual checker runs.'

const navItems = [
  { label: 'Overview', to: '/' },
  { label: 'Runs', to: '/runs' },
  { label: 'Services', to: '/services' },
  { label: 'Web Checks', to: '/web-checks' },
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
      <header class="portal-header">
        <div class="portal-header__inner">
          <NuxtLink
            to="/"
            class="portal-brand motion-brand"
          >
            <span class="portal-brand__mark motion-brand-mark">SC</span>
            <span>
              <span class="portal-brand__title">Server Check Portal</span>
              <span class="portal-brand__subtitle">Nuxt dashboard for service and web reports</span>
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
