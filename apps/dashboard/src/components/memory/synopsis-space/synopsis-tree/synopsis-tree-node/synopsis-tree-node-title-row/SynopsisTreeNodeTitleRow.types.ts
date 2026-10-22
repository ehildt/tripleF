export interface SynopsisTreeNodeTitleRowProps {
  /** The synopsis title shown in the head. */
  title: string;
  /** Hierarchy level (Raptor): 0 = leaf cluster; 1+ = cluster of synopses. */
  level: number;
  /** How many members the cluster contains. */
  memberCount: number;
}
