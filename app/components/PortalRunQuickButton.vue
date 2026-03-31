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
const isStopping = ref(false)
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

const isRunActive = computed(() => {
  return state.value?.status === 'RUNNING' || state.value?.status === 'STOPPING'
})

const syncPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }

  if (isRunActive.value) {
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
  if (state.value?.status === 'STOPPING') {
    return 'Stopping...'
  }

  if (state.value?.status === 'RUNNING') {
    return 'Stop Run'
  }

  return 'Run Check'
})

const buttonTone = computed(() => {
  return isRunActive.value ? 'danger' : 'primary'
})

const buttonIcon = computed(() => {
  return isRunActive.value ? 'i-fa6-solid-stop' : 'i-fa6-solid-play'
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

const stopRun = async () => {
  errorMessage.value = ''
  isStopping.value = true

  try {
    await $fetch('/api/runs/stop', {
      method: 'POST'
    })
    await refresh()
  }
  catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || 'Unable to stop checker run.'
  }
  finally {
    isStopping.value = false
  }
}

const handleClick = async () => {
  if (isRunActive.value) {
    await stopRun()
    return
  }

  await triggerRun()
}
</script>

<template>
  <div class="topbar-run">
    <PortalActionButton
      :icon="buttonIcon"
      :tone="buttonTone"
      size="md"
      :loading="isSubmitting || isStopping || state.status === 'STOPPING'"
      :disabled="isSubmitting || isStopping"
      class="topbar-run__button"
      @click="handleClick"
    >
      {{ buttonLabel }}
    </PortalActionButton>

    <p v-if="errorMessage" class="topbar-run__error">
      {{ errorMessage }}
    </p>
  </div>
</template>
