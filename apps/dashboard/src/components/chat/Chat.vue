<script setup lang="ts">
import ChatLeftToolbar from './chat-left-toolbar/ChatLeftToolbar.vue';
import ChatPromptActionBar from './chat-prompt-action-bar/ChatPromptActionBar.vue';
import ChatRightToolbar from './chat-right-toolbar/ChatRightToolbar.vue';
import ChatViewPanel from './chat-view-panel/ChatViewPanel.vue';
import { useChatModelSync } from './composables/use-chat-model-sync';

// Chat-wide model↔conversation sync (image selection snapshot/restore and
// numCtx inheritance) must live for the whole chat view's lifetime, above any
// single widget. The prompt action bar owns its own state; Chat only lays out
// the grid and keeps this cross-cutting watcher alive.
useChatModelSync();
</script>

<template>
  <ChatLeftToolbar class="chat__left-toolbar" />

  <div class="chat__main">
    <ChatViewPanel :compact="true" />
    <ChatPromptActionBar />
  </div>

  <ChatRightToolbar class="chat__right-toolbar" />
</template>

<style scoped>
.chat__left-toolbar,
.chat__main,
.chat__right-toolbar {
  min-width: 0;
  height: fit-content;
}

.chat__left-toolbar,
.chat__right-toolbar {
  z-index: 50;
}

@media (min-width: 1024px) {
  .chat__left-toolbar {
    grid-column: span 2 / span 2;
    grid-column-start: 1;
    position: sticky;
    top: 3rem;
  }

  .chat__main {
    grid-column: span 8 / span 8;
    grid-column-start: 3;
    position: sticky;
    top: 3rem;
  }

  .chat__right-toolbar {
    grid-column: span 2 / span 2;
    grid-column-start: 11;
    position: sticky;
    top: 3rem;
  }
}
</style>
