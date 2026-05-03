---
"dashboard": minor
---
- Complete DLQ panel architectural redesign: replaced monolithic DlqPanel.List.vue, DlqPanel.Item.vue, and DlqPanel.Details.vue with composable sub-components
- Added 20+ new DLQ sub-components: DlqActionIconButton, DlqCheckbox, DlqDetailsBody, DlqFailureBlock, DlqFiltersPanel, DlqItemMetaRow, DlqItemRow, DlqListBody, DlqListHeader, DlqMetadataField, DlqMetadataSection, DlqPayloadEditor, DlqReinstateButton, DlqReloadButton, DlqRequestIdBadge, DlqSelectAllCheckbox, DlqSelectedCountBadge, DlqSourceToggle, DlqStatusBadge, DlqTopBar
- Added 7 new DLQ composables: use-dlq-action-availability, use-dlq-actions, use-dlq-details-state, use-dlq-failure-text, use-dlq-loading, use-dlq-payload-edit, use-dlq-status-color
- Added DLQ reinstate breathe animation CSS keyframes
- Added AbortSignal support to DLQ query fetch
- EventLog panel now max-h-[400px] when messages exist
- Added unit tests for all new DLQ components and composables
