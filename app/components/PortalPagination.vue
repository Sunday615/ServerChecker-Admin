<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  pageCount: number
  totalItems: number
  pageSize: number
  itemLabel?: string
  compact?: boolean
}>(), {
  itemLabel: 'items',
  compact: false
})

const emit = defineEmits<{
  'update:page': [value: number]
}>()

const safePageCount = computed(() => Math.max(props.pageCount, 1))
const safePage = computed(() => Math.min(Math.max(props.page, 1), safePageCount.value))
const rangeStart = computed(() => {
  if (props.totalItems === 0) {
    return 0
  }

  return (safePage.value - 1) * props.pageSize + 1
})

const rangeEnd = computed(() => {
  if (props.totalItems === 0) {
    return 0
  }

  return Math.min(safePage.value * props.pageSize, props.totalItems)
})

const isPrevDisabled = computed(() => safePage.value <= 1)
const isNextDisabled = computed(() => safePage.value >= safePageCount.value || props.totalItems === 0)

const goPrev = () => {
  if (isPrevDisabled.value) {
    return
  }

  emit('update:page', safePage.value - 1)
}

const goNext = () => {
  if (isNextDisabled.value) {
    return
  }

  emit('update:page', safePage.value + 1)
}
</script>

<template>
  <div
    :class="[
      'pagination-bar',
      {
        'pagination-bar--compact': compact
      }
    ]"
  >
    <div class="pagination-bar__meta">
      <strong>
        {{ totalItems ? `${rangeStart}-${rangeEnd}` : '0' }}
      </strong>
      <span>of {{ totalItems }} {{ itemLabel }}</span>
    </div>

    <div class="pagination-bar__controls">
      <PortalActionButton
        tone="ghost"
        size="sm"
        icon="i-fa6-solid-chevron-left"
        :disabled="isPrevDisabled"
        @click="goPrev"
      >
        Prev
      </PortalActionButton>

      <span class="pagination-bar__page">
        Page {{ safePage }} / {{ safePageCount }}
      </span>

      <PortalActionButton
        tone="ghost"
        size="sm"
        trailing-icon="i-fa6-solid-chevron-right"
        :disabled="isNextDisabled"
        @click="goNext"
      >
        Next
      </PortalActionButton>
    </div>
  </div>
</template>
