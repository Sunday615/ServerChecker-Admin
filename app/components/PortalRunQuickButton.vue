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

const isSubmitting = ref(false)
const errorMessage = ref('')

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

onBeforeUnmount(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

const buttonLabel = computed(() => {
  return state.value?.status === 'RUNNING' ? 'Running...' : 'Run Check'
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
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to start checker run.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="topbar-run">
    <UButton
      icon="i-lucide-play"
      color="primary"
      :loading="isSubmitting || state.status === 'RUNNING'"
      :disabled="isSubmitting || state.status === 'RUNNING'"
      class="topbar-run__button"
      @click="triggerRun"
    >
      {{ buttonLabel }}
    </UButton>

    <p v-if="errorMessage" class="topbar-run__error">
      {{ errorMessage }}
    </p>
  </div>
</template>
