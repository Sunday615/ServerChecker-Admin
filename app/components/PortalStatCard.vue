<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string
  hint?: string
  detail?: string
  detailTone?: 'success' | 'danger' | 'neutral'
  progress?: number
  icon?: string
  accent?: 'primary' | 'soft'
}>(), {
  hint: '',
  detail: '',
  detailTone: 'neutral',
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
    <div class="stat-card__top">
      <span class="stat-card__icon">
        <UIcon :name="icon" />
      </span>

      <span class="stat-card__menu">
        <UIcon name="i-lucide-more-horizontal" />
      </span>
    </div>

    <span class="stat-card__label">{{ label }}</span>
    <strong class="stat-card__value">{{ value }}</strong>

    <p v-if="hint" class="stat-card__hint">
      {{ hint }}
    </p>

    <div class="stat-card__footer">
      <span
        v-if="detail"
        :class="['stat-card__detail', `stat-card__detail--${detailTone}`]"
      >
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
