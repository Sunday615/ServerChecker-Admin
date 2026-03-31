<script setup lang="ts">
const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description?: string
  level?: 'page' | 'section' | 'card'
  titleTag?: 'h1' | 'h2' | 'h3'
}>(), {
  eyebrow: '',
  description: '',
  level: 'section',
  titleTag: undefined
})

const slots = useSlots()

const resolvedTitleTag = computed(() => {
  if (props.titleTag) {
    return props.titleTag
  }

  if (props.level === 'page') {
    return 'h1'
  }

  if (props.level === 'card') {
    return 'h3'
  }

  return 'h2'
})

const hasActions = computed(() => Boolean(slots.actions))
</script>

<template>
  <div
    :class="[
      'section-header',
      `section-header--${level}`,
      {
        'section-header--with-actions': hasActions
      }
    ]"
  >
    <div class="section-header__copy">
      <span
        v-if="eyebrow"
        class="section-kicker"
      >
        {{ eyebrow }}
      </span>

      <component
        :is="resolvedTitleTag"
        class="section-header__title"
      >
        {{ title }}
      </component>

      <p
        v-if="description"
        class="section-header__description"
      >
        {{ description }}
      </p>
    </div>

    <div
      v-if="hasActions"
      class="section-header__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
