<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getSelectedTopicIds, setTopicSelected } from '@/entities/topic/topic'
import { fetchTopicCatalog, type TopicSummary } from './topicCatalog'

const topics = ref<TopicSummary[]>([])
const selectedIds = ref(new Set<string>())
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [catalog, selected] = await Promise.all([fetchTopicCatalog(), getSelectedTopicIds()])
    topics.value = catalog
    selectedIds.value = new Set(selected)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  } finally {
    loading.value = false
  }
})

async function toggle(id: string, event: Event): Promise<void> {
  const selected = (event.target as HTMLInputElement).checked
  await setTopicSelected(id, selected)
  if (selected) selectedIds.value.add(id)
  else selectedIds.value.delete(id)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
    <h1 class="text-xl font-semibold">
      Topics
    </h1>
    <span
      v-if="loading"
      class="loading loading-spinner loading-lg self-center"
    />
    <div
      v-else-if="error"
      role="alert"
      class="alert alert-error"
    >
      {{ error }}
    </div>
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <label
        v-for="topic in topics"
        :key="topic.id"
        class="label gap-3 text-base-content"
      >
        <input
          type="checkbox"
          class="checkbox"
          :checked="selectedIds.has(topic.id)"
          @change="toggle(topic.id, $event)"
        >
        {{ topic.title }}
      </label>
    </div>
  </div>
</template>
