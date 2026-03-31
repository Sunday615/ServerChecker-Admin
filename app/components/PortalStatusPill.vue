<script setup lang="ts">
const props = defineProps<{
  status?: string
}>()

const normalized = computed(() => (props.status || 'UNKNOWN').toUpperCase())

const tone = computed(() => {
  if (normalized.value === 'PASS' || normalized.value === 'COMPLETED') {
    return 'ok'
  }

  if (normalized.value === 'RUNNING' || normalized.value === 'STOPPING') {
    return 'running'
  }

  if (normalized.value === 'STOPPED') {
    return 'warning'
  }

  if (
    normalized.value === 'FAIL'
    || normalized.value === 'FAILED'
    || normalized.value === 'CONNECTION_FAILED'
    || normalized.value === 'CONFIG_ERROR'
  ) {
    return 'fail'
  }

  if (normalized.value === 'IDLE') {
    return 'idle'
  }

  return 'unknown'
})
</script>

<template>
  <span :class="['status-token', `status-token--${tone}`]">
    {{ normalized }}
  </span>
</template>
