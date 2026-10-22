import type { Component } from 'vue';

export interface PanelEmptyStateProps {
  /** Primary message (defaults to 'common.noRequestsYet'). */
  message?: string;
  /** Secondary hint under the message (defaults to 'common.sendRequestToSeeResults'). */
  submessage?: string;
  /** Icon component (defaults to PartyPopper). */
  icon?: Component;
}
