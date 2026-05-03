<script setup lang="ts">
import {
  Brain,
  CaseUpper,
  Clock,
  MessageSquareText,
  MessagesSquare,
  Network,
  Radio,
  RadioTower,
  Save,
  Tag,
  Type,
} from '@lucide/vue';
</script>

<template>
  <div class="exchange-empty-state">
    <div class="exchange-empty-state__inner">
      <p class="exchange-empty-state__title">📡 Toolbar Controls</p>
      <div class="exchange-empty-state__list">
        <div class="exchange-empty-state__row">
          <Brain class="exchange-empty-state__icon" />
          <span>— select the AI model for responses</span>
        </div>
        <div class="exchange-empty-state__row">
          <MessagesSquare class="exchange-empty-state__icon" />
          <span>— manage conversations (create, rename, pin, delete)</span>
        </div>
        <div class="exchange-empty-state__row">
          <MessageSquareText class="exchange-empty-state__icon" />
          <span
            >— conversation type: temporary (auto-expires) or persistent</span
          >
        </div>
        <div class="exchange-empty-state__row">
          <Clock class="exchange-empty-state__icon" />
          <span>— temporary conversations expire after 7 days</span>
        </div>
        <div class="exchange-empty-state__row">
          <Save class="exchange-empty-state__icon" />
          <span>— persistent conversations are saved indefinitely</span>
        </div>
        <div class="exchange-empty-state__row">
          <Network class="exchange-empty-state__icon" />
          <span>— open socket/subscription settings</span>
        </div>
        <div class="exchange-empty-state__row">
          <RadioTower class="exchange-empty-state__icon" />
          <span>— event &amp; room configuration for real-time streaming</span>
        </div>
        <div class="exchange-empty-state__row">
          <Radio class="exchange-empty-state__icon" />
          <span>— toggle subscription active/inactive</span>
        </div>
        <div class="exchange-empty-state__row">
          <Tag class="exchange-empty-state__icon" />
          <span>— channel/room identifier</span>
        </div>
        <div class="exchange-empty-state__row">
          <CaseUpper class="exchange-empty-state__icon" />
          <span>— per-subscription streaming mode</span>
        </div>
        <div class="exchange-empty-state__row">
          <Type class="exchange-empty-state__icon" />
          <span>— per-subscription streaming mode</span>
        </div>
      </div>
      <div class="exchange-empty-state__hint">
        <p>Send a message or subscribe to a socket to see content here.</p>
        <p>
          <span class="exchange-empty-state__kbd">Enter</span>
          sends ·
          <span class="exchange-empty-state__kbd">Ctrl+Enter</span>
          new line
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exchange-empty-state {
  height: 25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}

.exchange-empty-state__inner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  max-width: 28rem;
}

.exchange-empty-state__title {
  color: var(--color-fg-secondary);
  font-weight: 600;
}

.exchange-empty-state__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.exchange-empty-state__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.exchange-empty-state__icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.exchange-empty-state__hint {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  color: color-mix(in srgb, var(--color-fg-muted) 60%, transparent);
  font-style: italic;
  margin-top: var(--spacing-2);
}

.exchange-empty-state__kbd {
  color: var(--color-fg-secondary);
  font-weight: 600;
  font-style: normal;
}
</style>
