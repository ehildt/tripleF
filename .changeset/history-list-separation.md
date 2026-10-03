---
'@triplef/dashboard': patch
---

Separate the chat history panel from the shared `ExpandableMessageList`.

The history panel now renders its own `HistoryList` component group (`HistoryList` orchestrator + `HistoryListItem` rows), owned by the expanded `useHistoryPanel` composable — the list rows, the active-exchange marquee, merge availability/arming, and the per-row copy/include/merge/branch/delete actions all live next to the history panel that consumes them.

The shared `ExpandableMessageList` is slimmed back to its read-only dlq/debug purpose (`items`/`renderHtml`/`onClick`/`expandAll`), dropping the history-only action buttons, the dead copy button, and the `MessageListItem` merge/context fields. Its consumers (`DlqPromptSection`, `RequestDetails`) are unchanged.

`useChatConversation` is reduced to the chat orchestrator's slice (`conversationId`, `conversation`, `selectedModelObj`), and `mapExchangeToListItem` moves into the history group's `helpers/` folder.
