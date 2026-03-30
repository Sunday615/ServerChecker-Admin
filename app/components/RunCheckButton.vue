<script setup lang="ts">
type TriggerState = {
  status: string
  startedAt: string | null
  finishedAt: string | null
  exitCode: number | null
  pid: number | null
  stdoutTail: string
  stderrTail: string
  command: string
  checkerRoot: string
}

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false
})

const errorMessage = ref('')
const isSubmitting = ref(false)

const { data: state, refresh } = await useFetch<TriggerState>('/api/runs/active', {
  default: () => ({
    status: 'IDLE',
    startedAt: null,
    finishedAt: null,
    exitCode: null,
    pid: null,
    stdoutTail: '',
    stderrTail: '',
    command: '',
    checkerRoot: ''
  })
})

let pollingTimer: ReturnType<typeof setInterval> | null = null

const schedulePolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }

  if (state.value?.status === 'RUNNING') {
    pollingTimer = setInterval(() => {
      refresh()
    }, 3000)
  }
}

watch(() => state.value?.status, () => {
  if (import.meta.client) {
    schedulePolling()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})

const hint = computed(() => {
  if (state.value?.status === 'RUNNING') {
    return 'Checker is running from the existing Python project.'
  }

  if (state.value?.finishedAt) {
    return `Last finished at ${new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(state.value.finishedAt))}`
  }

  return 'Trigger the same run flow as scripts/run_once.sh'
})

const failureHint = computed(() => {
  if (state.value?.status !== 'FAILED' || !state.value.stderrTail) {
    return ''
  }

  return state.value.stderrTail
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(-3)
    .join(' | ')
})

const triggerRun = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch('/api/runs/trigger', {
      method: 'POST'
    })
    await refresh()
  }
  catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to trigger checker run.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div :class="['run-widget', compact && 'run-widget--compact']">
    <div class="run-widget__meta">
      <span class="run-widget__label">Checker status</span>
      <StatusBadge :status="state.status" />
    </div>

    <p
      v-if="!compact"
      class="run-widget__hint"
    >
      {{ hint }}
    </p>

    <UButton
      icon="i-lucide-play"
      :loading="isSubmitting || state.status === 'RUNNING'"
      :disabled="isSubmitting || state.status === 'RUNNING'"
      color="primary"
      @click="triggerRun"
    >
      {{ state.status === 'RUNNING' ? 'Running check...' : 'Run Check' }}
    </UButton>

    <p
      v-if="errorMessage"
      class="run-widget__error"
    >
      {{ errorMessage }}
    </p>

    <p
      v-else-if="failureHint"
      class="run-widget__error"
    >
      {{ failureHint }}
    </p>
  </div>
</template>
