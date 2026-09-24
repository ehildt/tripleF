import type { RightToolbarView } from '@/components/chat/chat-right-toolbar/right-toolbar-view.type';

export interface TabsProps {
  /** The currently selected section. */
  activeView: RightToolbarView;
  /** Whether the Files section has content and should render its tab. */
  hasAttachments: boolean;
  /** Whether the Playlist section has content and should render its tab. */
  hasPlaylist: boolean;
  /** Whether the History section has content and should render its tab. */
  hasHistory: boolean;
}
