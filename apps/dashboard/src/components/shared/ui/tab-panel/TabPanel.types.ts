export interface TabPanelTab {
  id: string;
  label: string;
}

export interface TabPanelProps {
  tabs: TabPanelTab[];
  activeTab: string | null;
  copyable?: boolean;
  copied?: boolean;
}
