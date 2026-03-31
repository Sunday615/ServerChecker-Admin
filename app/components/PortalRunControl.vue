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

const emit = defineEmits<{
  completed: []
  triggered: []
}>()

const errorMessage = ref('')
const isSubmitting = ref(false)
const { formatDate } = usePortalUtils()

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

let pollTimer: ReturnType<typeof setInterval> | null = null

const syncPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }

  if (state.value?.status === 'RUNNING') {
    pollTimer = setInterval(() => {
      refresh()
    }, 3000)
  }
}

watch(() => state.value?.status, () => {
  if (import.meta.client) {
    syncPolling()
  }
}, { immediate: true })

watch(() => state.value?.status, (status, previous) => {
  if (previous === 'RUNNING' && status && status !== 'RUNNING') {
    emit('completed')
  }
})

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

const detailText = computed(() => {
  if (state.value?.status === 'RUNNING') {
    return state.value.startedAt
      ? `Started ${formatDate(state.value.startedAt)}`
      : 'Run is active'
  }

  if (state.value?.finishedAt) {
    return `Last finished ${formatDate(state.value.finishedAt)}`
  }

  return 'Ready to trigger the Python checker'
})

const failureText = computed(() => {
  if (state.value?.status !== 'FAILED') {
    return ''
  }

  const raw = state.value.stderrTail || state.value.stdoutTail || ''
  if (!raw) {
    return 'Run ended with an error.'
  }

  return raw
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
    emit('triggered')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to start checker run.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PortalCard as="section" class="run-panel">
    <div class="run-panel__header">
      <PortalSectionHeader
        level="card"
        eyebrow="Manual Run"
        title="Trigger Checker"
      />

      <PortalStatusPill :status="state.status" />
    </div>

    <p class="run-panel__text">
      {{ detailText }}
    </p>

    <div class="run-panel__meta">
      <div class="run-panel__meta-chip">
        <span>Command</span>
        <strong>{{ state.command || 'python run.py' }}</strong>
      </div>
      <div class="run-panel__meta-chip">
        <span>Status</span>
        <strong>{{ state.status }}</strong>
      </div>
    </div>

    <PortalActionButton
      icon="i-lucide-play"
      tone="primary"
      size="md"
      :loading="isSubmitting || state.status === 'RUNNING'"
      :disabled="isSubmitting || state.status === 'RUNNING'"
      class="run-panel__button"
      @click="triggerRun"
    >
      {{ state.status === 'RUNNING' ? 'Running check...' : 'Run Check' }}
    </PortalActionButton>

    <p v-if="errorMessage" class="run-panel__error">
      {{ errorMessage }}
    </p>

    <p v-else-if="failureText" class="run-panel__error">
      {{ failureText }}
    </p>
  </PortalCard>
</template>
