import type { CommonMemoryMessages } from '../../../schemas/common/memory.schema';

export default {
  memorySynopsisTitle: 'Cluster synopses',
  memorySynopsisDesc:
    'The Raptor hierarchy — every cluster summarized level by level; rows start collapsed, expand one to read its summary and children',
  memorySynopsisRefresh: 'Refresh the synopsis tree',
  memorySynopsisEmpty:
    'No cluster synopses yet — run the cluster job for this space first',
  memorySynopsisUnavailable:
    'Synopses unavailable — the memory service could not be reached',
  memorySynopsisScopeEncyclopedia: 'Encyclopedia',
  memorySynopsisScopePartition: 'Partition',
  memorySynopsisLevelLabel: 'Level',
  memorySynopsisMembersLabel: 'Members',
  memoryPartition: 'Memory partition',
  memoryPartitionDesc:
    'Stable id your memories are stored under — defaults to "default" so they survive browsers/sessions (empty = current session). The AI also keeps a separate, disclosable cognition of you in this space',
  memoryCognition: 'Memory cognition',
  memoryCognitionKeyDesc:
    'Separate key space for the AI\'s understanding of you — defaults to "default" (empty = cognition lives in the memory partition)',
  memoryCognitionDesc:
    "The AI's accumulated understanding of you: a structured profile plus probed insights — ask it in chat to disclose or forget this anytime",
  memoryCognitionCap: 'Cognition limit',
  memoryCognitionCapDesc:
    'Character cap for the AI cognition profile document — a system variable (env baseline MEMORY_COGNITION_LIMIT, default 5000, clamped 500–32000)',
  episodeRecencyWeight: 'Episode recency weight',
  episodeRecencyWeightDesc:
    'How much recency may break topical ties when short-term memories are ranked for injection into each chat turn (0–1, default 0.3)',
  episodeRecencyScale: 'Episode recency horizon',
  episodeRecencyScaleDesc:
    'Decay horizon in seconds for the per-turn memory probe — an episode this old loses half its recency bonus (default 604800 = 1 week)',
  episodeRecencyMidpoint: 'Episode recency midpoint',
  episodeRecencyMidpointDesc:
    'Decay midpoint of the per-turn memory probe (0.01–0.99, default 0.5)',
  episodeProbeLimit: 'Episode probe limit',
  episodeProbeLimitDesc:
    'Short-term conversation-memory records injected per turn (0 disables the probe, default 3)',
  episodeScoreThreshold: 'Episode score threshold',
  episodeScoreThresholdDesc:
    'Minimum similarity for the short-term memory probe before recency ranking (0–1, default 0.1) — lower recalls more of what you were recently doing',
  memoryCognitionUnavailable: 'Memory is off or unreachable',
  memoryCognitionRefresh: 'Reload cognition',
  memoryCognitionWipe: 'Wipe cognition',
  memoryCognitionSpacesLabel: 'Cognition spaces',
  memoryCognitionSpaceDefault: 'Memory partition (default)',
  memoryModelDefault: 'Default',
  memoryCognitionSpaceSearch: 'Search or create a space',
  memoryCognitionSpaceCreate: 'Create space "{text}"',
  memoryCognitionSpacesEmpty: 'No saved spaces yet — type a name to create one',
  memoryCognitionSpaceRemove: 'Remove space from list (data is kept)',
  memoryPartitionFacts: 'Memory partition',
  memoryPartitionFactsDesc:
    'Your stored fact records — statements you made or asked the AI to remember; the cognition lane is separate and shown above',
  memoryPartitionRefresh: 'Reload facts',
  memoryPartitionWipe: 'Wipe partition facts',
  memoryPartitionUnavailable: 'Memory is off or unreachable',
  memoryEncyclopedia: 'Memory encyclopedia',
  memoryEncyclopediaDesc:
    'The shared knowledge cache — verbatim chunks of fetched web content, grouped by category and topic',
  memoryEncyclopediaUnavailable: 'Memory is off or unreachable',
  memoryEncyclopediaRefresh: 'Reload encyclopedia',
  memoryToggleLabels: 'Toggle labels',
  memoryResetView: 'Reset view',
  memoryToggleRotation: 'Toggle rotation',
  memoryStrictView: 'Strict view — only curated, linked and reflected points',
  memoryRecommendedView: 'Recommended view — hide superseded',
  memoryExpandAll: 'Expand all topics',
  memoryCollapseAll: 'Collapse all topics',
  memoryTaxonomyManager: 'Memory taxonomy',
  memoryTaxonomyManagerDesc:
    'The macro-taxonomy per lane — rename, merge, or re-icon labels; the AI adopts these read-only and every edit propagates across the graph instantly',
  memoryTaxonomyLane: 'Taxonomy lane',
  memoryTaxonomyRefresh: 'Refresh taxonomy',
  memoryTaxonomyUnavailable:
    'The taxonomy registry is unreachable — check the memory service and try again',
  memoryTaxonomyEmpty:
    'No labels yet — the taxonomy fills in as memory is written',
  memoryTaxonomyTagsEmpty: 'No tags in this partition yet',
  memoryTaxonomyClusters: 'Clusters',
  memoryTaxonomyClustersDesc:
    'The plural family buckets (games, stocks, work) — the top of the hierarchy',
  memoryTaxonomyCommunities: 'Communities',
  memoryTaxonomyCommunitiesDesc:
    'Plural sub-families under a cluster (survival-games under games)',
  memoryTaxonomyHubs: 'Hubs',
  memoryTaxonomyHubsDesc:
    'The singular subject entities anchoring the graph (project zomboid, amd)',
  memoryTaxonomyNodes: 'Nodes',
  memoryTaxonomyNodesDesc:
    'The named aspects under a hub (base building under project zomboid) — their leaves are the facts',
  memoryTaxonomyTags: 'Tags',
  memoryTaxonomyTagsDesc:
    'The flat recall vocabulary — narrow topic labels used by filtered recall',
  memoryTaxonomyAliases: '{count} alias | {count} aliases',
  memoryTaxonomyCluster: 'Cluster',
  memoryTaxonomyCommunity: 'Community',
  memoryTaxonomyHub: 'Hub',
  memoryTaxonomyNode: 'Node',
  memoryTaxonomyTag: 'Tag',
  memoryTaxonomyMetaLeaves: '{count} leaf | {count} leaves',
  memoryTaxonomyMetaLinked: '{count} linked',
  memoryTaxonomyMetaChildren: '{count} children',
  memoryTaxonomyStampReflected: 'reflected',
  memoryTaxonomyStampConsolidated: 'consolidated',
  memoryTaxonomyStampRelinked: 'relinked',
  memoryTaxonomyLeavesEmpty: 'No leaves attached',
  memoryTaxonomyLeafLinked: 'Linked in the constellation',
  memoryTaxonomyLeafSource: 'Open the source page',
  memoryTaxonomyEdit: 'Edit label',
  memoryTaxonomyRename: 'Rename',
  memoryTaxonomyRenameSave: 'Save name',
  memoryTaxonomyMergeInto: 'Merge into',
  memoryTaxonomyMergePlaceholder: 'Pick a label…',
  memoryTaxonomyMergeConfirm: 'Merge labels (payloads rewrite)',
  memoryTaxonomyIcon: 'Icon',
  memoryTaxonomyIconClear: 'Clear icon',
  memoryConstellationHint:
    'Drag to rotate · Right-drag to pan · Scroll to zoom',
  memoryFrictionTag: '⚠ Contested — open conflict',
  memoryEvidenceTag: 'Supporting evidence',
  memoryDownloadDocument: 'Download document',
  memoryToggleSuggested:
    'Toggle weak links — faint inter-topic arcs below the strong-relation threshold',
  memoryToggleHeat:
    'Toggle heat halos — dots glow warmer the more often memory search surfaced them',
  memoryConstellationNodeLimit: 'Constellation node limit',
  memoryConstellationNodeLimitDesc:
    'Max fact records drawn per constellation diagram on the Memory tab (100–10000, default 5000)',
  memorySpacesSection: 'Memory spaces',
  memoryCognitionProfileSection: 'Cognition profile',
  memoryEpisodeProbeSection: 'Short-term memory probe',
  memoryDiagramSection: 'Constellation diagram',
  memoryMaintenanceModels: 'Maintenance models',
  memoryConsolidateModel: 'Consolidate model',
  memoryConsolidateModelDesc:
    'Chat model for the partition consolidation sweep (env baseline MEMORY_CONSOLIDATE_MODEL)',
  memoryClassifyModel: 'Classify model',
  memoryClassifyModelDesc:
    'Chat model for the encyclopedia classification job (env baseline ENCYCLOPEDIA_CLASSIFY_MODEL)',
  memoryReflectModel: 'Reflect model',
  memoryReflectModelDesc:
    'Chat model for the reflection friction verdicts (env baseline MEMORY_REFLECT_MODEL)',
  memoryConvictionModel: 'Conviction model',
  memoryConvictionModelDesc:
    'Chat model for conviction synthesis — derives convictions (cognition lane) and gap-closing bridges (partition lane) from reflected evidence (env baseline MEMORY_CONVICTION_MODEL)',
  memoryClusterModel: 'Cluster model',
  memoryClusterModelDesc:
    'Chat model for cluster summarization (env baseline MEMORY_CLUSTER_MODEL)',
  memoryAutoTriggers: 'Auto-triggers',
  memoryPartitionReflectAuto: 'Partition reflect auto',
  memoryPartitionReflectAutoDesc:
    'Auto-trigger reflection after a partition consolidation sweep',
  memoryCognitionReflectAuto: 'Cognition reflect auto',
  memoryCognitionReflectAutoDesc:
    'Auto-trigger reflection after a cognition profile job',
  memoryEncyclopediaReflectAuto: 'Encyclopedia reflect auto',
  memoryEncyclopediaReflectAutoDesc:
    'Auto-trigger reflection after the encyclopedia classification job',
  memoryConvictionAuto: 'Conviction auto',
  memoryConvictionAutoDesc:
    'Auto-trigger conviction synthesis after a partition reflection sweep',
  memoryClusterAuto: 'Cluster auto',
  memoryClusterAutoDesc:
    'Auto-trigger cluster detection after a graph-mutating job',
  memorySweepLimits: 'Sweep limits',
  memoryReflectBatchLimit: 'Reflect batch limit',
  memoryReflectBatchLimitDesc:
    'Max unreflected points screened per reflection run (1–500)',
  memoryReflectMaxCandidates: 'Reflect candidates',
  memoryReflectMaxCandidatesDesc:
    'Max near-neighbor candidates reviewed per point in the friction screen (1–100)',
  memoryConvictionBatchLimit: 'Conviction batch limit',
  memoryConvictionBatchLimitDesc:
    'Max evidence points offered per conviction-synthesis run (1–500)',
  memoryConvictionMaxPerCluster: 'Convictions per cluster',
  memoryConvictionMaxPerClusterDesc:
    'Max convictions written per cluster per synthesis run (1–1000)',
  memoryClusterMinMembers: 'Cluster min members',
  memoryClusterMinMembersDesc:
    'Minimum members for a structural cluster (1–100)',
  memoryRaptorEnabled: 'Raptor enabled',
  memoryHeatTrackingEnabled: 'Heat tracking',
  memoryHeatTrackingEnabledDesc:
    'Count every memory-search hit on the record (heat amount + last-access timestamp) — drives the constellation\u2019s warm halo overlay across every lane',
  memoryRaptorEnabledDesc:
    'Raptor synopsis layer: embed each cluster\u2019s summary as a searchable point and recurse clusters of synopses one level up — cross-cutting questions can match the community summary directly',
  memoryRaptorMaxDepth: 'Raptor max depth',
  memoryRaptorMaxDepthDesc:
    'Highest synopsis level per scope (1–3) — level 0 summarizes fact clusters, higher levels summarize clusters of synopses',
  memoryResearchSection: 'Gap-filling research',
  memoryResearchEnabled: 'Research enabled',
  memoryResearchEnabledDesc:
    'Master switch for the background researcher that closes knowledge-base gaps the user\u2019s own searches left behind (off by default)',
  memoryResearchSearchEnabled: 'Search enabled',
  memoryResearchSearchEnabledDesc:
    'Let the researcher run web searches for follow-up topics; off = fetch-only',
  memoryResearchProvider: 'Search provider',
  memoryResearchProviderDesc:
    'Which search API the researcher uses (Serper or Bright Data) — independent of the server\u2019s provider',
  memoryResearchModel: 'Research model',
  memoryResearchModelDesc:
    'Chat model for the research triage verdicts (env baseline RESEARCH_MODEL)',
  memoryResearchGapLimit: 'Gap limit',
  memoryResearchGapLimitDesc: 'Max gaps triaged per research run (1–50)',
  memoryResearchMaxDepth: 'Max depth',
  memoryResearchMaxDepthDesc: 'Max deep-dive hops per research chain (1–3)',
  memoryResearchFetchBudget: 'Fetch budget',
  memoryResearchFetchBudgetDesc: 'Max pages fetched per research run (1–20)',
  memoryResearchFrictionLimit: 'Friction limit',
  memoryResearchFrictionLimitDesc:
    'Max contested-memory frictions screened per research run (1–20) — open contradictions a web search could settle become resolution-seeking deep-dives',
} satisfies CommonMemoryMessages;
