<script setup lang="ts">
const props = defineProps<{
  status?: string
}>()

const normalized = computed(() => (props.status || 'UNKNOWN').toUpperCase())

const tone = computed(() => {
  if (normalized.value === 'PASS' || normalized.value === 'COMPLETED') {
    return 'pass'
  }

  if (normalized.value === 'RUNNING') {
    return 'running'
  }

  if (normalized.value === 'IDLE') {
    return 'idle'
  }

  if (
    normalized.value === 'FAIL'
    || normalized.value === 'FAILED'
    || normalized.value === 'CONNECTION_FAILED'
    || normalized.value === 'CONFIG_ERROR'
  ) {
    return 'fail'
  }

  return 'unknown'
})
</script>

<template>
  <span :class="['status-pill', `status-pill--${tone}`]">
    {{ normalized }}
  </span>
</template>
