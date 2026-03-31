<script setup lang="ts">
const props = withDefaults(defineProps<{
  as?: string
  tone?: 'default' | 'primary' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  flush?: boolean
}>(), {
  as: 'article',
  tone: 'default',
  size: 'md',
  flush: false
})
</script>

<template>
  <component
    :is="props.as"
    :class="[
      'portal-card',
      `portal-card--${props.tone}`,
      `portal-card--${props.size}`,
      {
        'portal-card--flush': props.flush
      }
    ]"
  >
    <slot />
  </component>
</template>
