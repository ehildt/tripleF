---
'@triplef/dashboard': patch
---

Rework the chat toolbar's conversation-creation menu: rename `NewConversationMenu` to `ConversationMenu`, split it into an orchestrator, a `ConversationMenuTrigger`, and presentational leaves backed by a co-located `useConversationMenu` composable, removing the form-state prop drilling from `ChatToolbar`.
