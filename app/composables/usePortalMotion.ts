import { gsap } from 'gsap'

export const usePortalMotion = (root: Ref<HTMLElement | null>) => {
  const route = useRoute()

  const runMotion = async () => {
    if (!import.meta.client) {
      return
    }

    await nextTick()

    const shell = root.value
    if (!shell) {
      return
    }

    const select = (selector: string) => Array.from(shell.querySelectorAll<HTMLElement>(selector))
    const hero = select('.page-hero, .section-heading')
    const topbar = select('.topbar, .topbar__headline')
    const stats = select('.stat-card')
    const panels = select('.panel-card, .issue-card, .info-card, .timeline-item, .tab-chip, .action-card, .table-card, .chart-card, .watchlist-card, .watchlist-item, .legend-item')
    const nav = select('.sidebar-nav__link')
    const runPanel = select('.run-panel, .topbar-run')
    const brand = select('.brand-block, .sidebar-store, .sidebar-profile')

    gsap.killTweensOf([...hero, ...topbar, ...stats, ...panels, ...nav, ...runPanel, ...brand])

    gsap.set([...hero, ...topbar, ...runPanel], {
      y: 18,
      opacity: 0
    })

    gsap.set(stats, {
      y: 24,
      opacity: 0,
      scale: 0.98
    })

    gsap.set(panels, {
      y: 28,
      opacity: 0
    })

    gsap.set(nav, {
      x: -12,
      opacity: 0
    })

    gsap.set(brand, {
      y: 16,
      opacity: 0
    })

    const timeline = gsap.timeline({
      defaults: {
        duration: 0.68,
        ease: 'power3.out'
      }
    })

    timeline
      .to(brand, {
        y: 0,
        opacity: 1,
        stagger: 0.06
      }, 0.02)
      .to(runPanel, {
        y: 0,
        opacity: 1
      }, 0.08)
      .to(nav, {
        x: 0,
        opacity: 1,
        stagger: 0.04,
        duration: 0.4
      }, 0.12)
      .to(topbar, {
        y: 0,
        opacity: 1,
        stagger: 0.04
      }, 0.16)
      .to(hero, {
        y: 0,
        opacity: 1,
        stagger: 0.06
      }, 0.2)
      .to(stats, {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.05,
        duration: 0.46
      }, 0.24)
      .to(panels, {
        y: 0,
        opacity: 1,
        stagger: 0.04,
        duration: 0.48
      }, 0.28)
  }

  onMounted(runMotion)

  watch(() => route.fullPath, () => {
    runMotion()
  })
}
