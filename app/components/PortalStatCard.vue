<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string
  hint?: string
  detail?: string
  progress?: number
  icon?: string
  accent?: 'primary' | 'soft'
}>(), {
  hint: '',
  detail: '',
  progress: 0,
  icon: 'i-lucide-arrow-up-right',
  accent: 'soft'
})

const progressValue = computed(() => {
  const parsed = Number(props.progress || 0)
  return Math.min(Math.max(parsed, 0), 100)
})
</script>

<template>
  <article :class="['stat-card', `stat-card--${accent}`]">
    <span class="stat-card__beam" />

    <div class="stat-card__top">
      <div>
        <span class="stat-card__label">{{ label }}</span>
        <strong class="stat-card__value">{{ value }}</strong>
      </div>

      <span class="stat-card__icon">
        <UIcon :name="icon" />
      </span>
    </div>

    <div class="stat-card__meta">
      <p v-if="hint" class="stat-card__hint">
        {{ hint }}
      </p>

      <span v-if="detail" class="stat-card__detail">
        {{ detail }}
      </span>
    </div>

    <div class="stat-card__track">
      <span
        class="stat-card__fill"
        :style="{ width: `${progressValue}%` }"
      />
    </div>
  </article>
</template>
