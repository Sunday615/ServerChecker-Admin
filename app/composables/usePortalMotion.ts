import { gsap } from 'gsap'

export const usePortalMotion = (root: Ref<HTMLElement | null>) => {
  const route = useRoute()
  let floatingTween: gsap.core.Tween | null = null

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
    const hero = select('.page-hero')
    const topbar = select('.topbar')
    const stats = select('.stat-card')
    const panels = select('.panel-card, .issue-card, .info-card, .timeline-item, .rail-tag, .coverage-segment, .action-card')
    const nav = select('.sidebar-nav__link')
    const runPanel = select('.run-panel, .topbar-run')
    const brand = select('.brand-block')
    const ornaments = select('.layout-orb, .layout-beam, .layout-grid, .layout-capsule')

    gsap.killTweensOf([...hero, ...topbar, ...stats, ...panels, ...nav, ...runPanel, ...brand, ...ornaments])
    floatingTween?.kill()

    gsap.set([...hero, ...topbar, ...runPanel, ...brand], {
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

    gsap.set(ornaments, {
      opacity: 0
    })

    const timeline = gsap.timeline({
      defaults: {
        duration: 0.68,
        ease: 'power3.out'
      }
    })

    timeline
      .to(ornaments, {
        opacity: 1,
        duration: 1.1,
        stagger: 0.08
      }, 0)
      .to(brand, {
        y: 0,
        opacity: 1
      }, 0.02)
      .to(runPanel, {
        y: 0,
        opacity: 1
      }, 0.08)
      .to(nav, {
        x: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 0.42
      }, 0.12)
      .to(topbar, {
        y: 0,
        opacity: 1
      }, 0.16)
      .to(hero, {
        y: 0,
        opacity: 1
      }, 0.2)
      .to(stats, {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.06,
        duration: 0.48
      }, 0.24)
      .to(panels, {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 0.52
      }, 0.28)

    const floatingCapsules = select('.layout-capsule')

    if (floatingCapsules.length > 0) {
      floatingTween = gsap.to(floatingCapsules, {
        y: '-=18',
        x: '+=10',
        rotation: 7,
        duration: 3.4,
        ease: 'sine.inOut',
        stagger: 0.16,
        repeat: -1,
        yoyo: true
      })
    }
  }

  onMounted(runMotion)

  watch(() => route.fullPath, () => {
    runMotion()
  })

  onBeforeUnmount(() => {
    floatingTween?.kill()
  })
}
