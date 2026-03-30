import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

type GsapContext = {
  revert: () => void
}

export const usePortalMotion = (rootRef: Ref<HTMLElement | null>) => {
  const route = useRoute()
  let context: GsapContext | null = null
  let headerAnimated = false

  const animate = async () => {
    if (!import.meta.client || !rootRef.value) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      context?.revert()
      context = null
      return
    }

    const { gsap } = await import('gsap')
    context?.revert()

    context = gsap.context(() => {
      const has = (selector: string) => rootRef.value?.querySelector(selector)

      if (!headerAnimated) {
        const headerTimeline = gsap.timeline({
          defaults: {
            ease: 'power3.out'
          }
        })

        if (has('.motion-brand')) {
          headerTimeline.from('.motion-brand', {
            autoAlpha: 0,
            y: -18,
            duration: 0.7
          })
        }

        if (has('.motion-nav-item')) {
          headerTimeline.from('.motion-nav-item', {
            autoAlpha: 0,
            y: -12,
            duration: 0.5,
            stagger: 0.06
          }, '-=0.4')
        }

        if (has('.motion-header-action')) {
          headerTimeline.from('.motion-header-action', {
            autoAlpha: 0,
            x: 18,
            duration: 0.45,
            stagger: 0.08
          }, '-=0.35')
        }

        if (has('.motion-brand-mark')) {
          gsap.from('.motion-brand-mark', {
            rotate: -16,
            scale: 0.86,
            duration: 0.8,
            ease: 'back.out(1.8)'
          })
        }

        headerAnimated = true
      }

      const pageTimeline = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      })

      if (has('.motion-hero')) {
        pageTimeline.from('.motion-hero', {
          autoAlpha: 0,
          y: 32,
          duration: 0.85
        })
      }

      if (has('.motion-card')) {
        pageTimeline.from('.motion-card', {
          autoAlpha: 0,
          y: 30,
          scale: 0.97,
          duration: 0.7,
          stagger: 0.08
        }, '-=0.55')
      }

      if (has('.motion-panel')) {
        pageTimeline.from('.motion-panel', {
          autoAlpha: 0,
          y: 26,
          duration: 0.65,
          stagger: 0.1
        }, '-=0.45')
      }

      if (has('.motion-row')) {
        pageTimeline.from('.motion-row', {
          autoAlpha: 0,
          y: 16,
          duration: 0.45,
          stagger: 0.04
        }, '-=0.35')
      }

      if (has('.motion-media')) {
        pageTimeline.from('.motion-media', {
          autoAlpha: 0,
          scale: 0.985,
          duration: 0.7,
          stagger: 0.08
        }, '-=0.35')
      }
    }, rootRef.value)
  }

  onMounted(async () => {
    await nextTick()
    await animate()
  })

  watch(() => route.fullPath, async () => {
    await nextTick()
    await animate()
  })

  onBeforeUnmount(() => {
    context?.revert()
  })
}
