<script setup lang="ts">
import PracticeCard from './card/PracticeCard.vue'
import { usePracticeQueue } from './queue/usePracticeQueue'

const { loading, emptyReason, candidate, rate } = usePracticeQueue()
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-8">
    <span
      v-if="loading"
      class="loading loading-spinner loading-lg"
    />
    <PracticeCard
      v-else-if="candidate"
      :candidate="candidate"
      @rate="rate"
    />
    <template v-else-if="emptyReason === 'noTopics'">
      <p class="text-base-content/70">
        No topics selected.
      </p>
      <router-link
        :to="{ name: 'topics' }"
        class="btn btn-primary"
      >
        Select topics
      </router-link>
    </template>
    <p
      v-else
      class="text-base-content/70"
    >
      Nothing due.
    </p>
  </div>
</template>
