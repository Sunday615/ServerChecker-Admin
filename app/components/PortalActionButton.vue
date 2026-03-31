<script setup lang="ts">
import { resolveComponent, useAttrs } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(defineProps<{
  to?: RouteLocationRaw | string
  href?: string
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  trailingIcon?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
}>(), {
  to: undefined,
  href: '',
  target: undefined,
  rel: undefined,
  type: 'button',
  tone: 'secondary',
  size: 'md',
  icon: '',
  trailingIcon: '',
  loading: false,
  disabled: false,
  block: false
})

const attrs = useAttrs()

const isDisabled = computed(() => props.disabled || props.loading)

const componentTag = computed(() => {
  if (props.to && !isDisabled.value) {
    return resolveComponent('NuxtLink')
  }

  if (props.href && !isDisabled.value) {
    return 'a'
  }

  return 'button'
})

const componentAttrs = computed(() => {
  const baseAttrs = { ...attrs }

  if (props.to && !isDisabled.value) {
    return {
      ...baseAttrs,
      to: props.to
    }
  }

  if (props.href && !isDisabled.value) {
    return {
      ...baseAttrs,
      href: props.href,
      target: props.target,
      rel: props.rel || (props.target === '_blank' ? 'noopener noreferrer' : undefined)
    }
  }

  return {
    ...baseAttrs,
    type: props.type,
    disabled: isDisabled.value
  }
})

const leadingIcon = computed(() => {
  if (props.loading) {
    return 'i-lucide-loader-circle'
  }

  return props.icon
})
</script>

<template>
  <component
    :is="componentTag"
    v-bind="componentAttrs"
    :class="[
      'action-button',
      `action-button--${tone}`,
      `action-button--${size}`,
      {
        'action-button--block': block,
        'is-disabled': isDisabled,
        'is-loading': loading
      }
    ]"
    :aria-disabled="isDisabled"
  >
    <span
      v-if="leadingIcon"
      :class="['action-button__icon', { 'is-spinning': loading }]"
      aria-hidden="true"
    >
      <UIcon :name="leadingIcon" />
    </span>

    <span class="action-button__label">
      <slot />
    </span>

    <span
      v-if="trailingIcon"
      class="action-button__icon action-button__icon--trailing"
      aria-hidden="true"
    >
      <UIcon :name="trailingIcon" />
    </span>
  </component>
</template>
