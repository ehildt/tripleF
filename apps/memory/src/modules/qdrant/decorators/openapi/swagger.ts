import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MemoryCognitionSnapshotDto } from '../../../memory-cognition/dtos/memory-cognition-snapshot.dto.js';
import { MemoryClusterDto } from '../../../memory-partition/dtos/memory-cluster.dto.js';
import { MemoryClusterResponseDto } from '../../../memory-partition/dtos/memory-cluster-response.dto.js';
import { MemoryConsolidateResponseDto } from '../../../memory-partition/dtos/memory-consolidate-response.dto.js';
import { MemoryConvictionResponseDto } from '../../../memory-partition/dtos/memory-conviction-response.dto.js';
import { MemoryDeleteResponseDto } from '../../../memory-partition/dtos/memory-delete-response.dto.js';
import { MemoryFrictionDto } from '../../../memory-partition/dtos/memory-friction.dto.js';
import { MemoryLinkDto } from '../../../memory-partition/dtos/memory-link.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../../../memory-partition/dtos/memory-links-recompute-response.dto.js';
import { MemoryPruneResponseDto } from '../../../memory-partition/dtos/memory-prune-response.dto.js';
import { MemoryReflectResponseDto } from '../../../memory-partition/dtos/memory-reflect-response.dto.js';
import { MemoryRelinkResponseDto } from '../../../memory-partition/dtos/memory-relink-response.dto.js';
import { MemorySearchClustersResponseDto } from '../../../memory-partition/dtos/memory-search-clusters-response.dto.js';
import { MemorySynopsisDto } from '../../../memory-partition/dtos/memory-synopsis.dto.js';
import { MemoryItemDto } from '../../dtos/memory-item.dto.js';
import { MemoryStatusResponseDto } from '../../dtos/memory-status.dto.js';

export const ApeTagsMemory = () => ApiTags('Memory');

export const ApeTagsMemoryCognition = () => ApiTags('Memory Cognition');

export const ApeTagsPartitionMaintenance = () =>
  ApiTags('Memory Partition Maintenance');

export const ApeTagsCognitionMaintenance = () =>
  ApiTags('Memory Cognition Maintenance');

export const ApeGetMemoryStatus = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryStatusResponseDto }),
    ApiOperation({
      summary: 'Memory storage status (feature flag, collections, indexes)',
    }),
  );

export const ApeGetMemoryCognition = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryCognitionSnapshotDto }),
    ApiOperation({
      summary:
        'The AI cognition snapshot of one space: the structured profile document (Postgres) plus derived insights (Qdrant)',
    }),
  );

export const ApeGetMemoryList = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({
      summary: 'List memory records; all params are optional tightenings',
    }),
  );

export const ApeGetMemoryLinks = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryLinkDto] }),
    ApiOperation({
      summary:
        'Semantic kNN link graph of one memory lane (cosine neighbors above the link threshold)',
    }),
  );

export const ApeGetMemoryFrictions = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryFrictionDto] }),
    ApiOperation({
      summary:
        'Friction records of one memory lane (contradictions/conflicts written by the reflection pass)',
    }),
  );

export const ApeGetMemoryClusters = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryClusterDto] }),
    ApiOperation({
      summary:
        'Detected clusters of one partition (clusters of related facts with LLM-written title + summary)',
    }),
  );

export const ApePostMemoryLinksRecompute = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryLinksRecomputeResponseDto }),
    ApiOperation({
      summary:
        "Recompute one memory lane's link graph with the current link threshold (purge + bounded backfill — the migration path after raising MEMORY_LINK_SCORE_THRESHOLD)",
    }),
  );

export const ApePostMemoryText = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'accepted:true with the stored point id; accepted:false when the feature is disabled or the store failed.',
    }),
    ApiOperation({
      summary: 'Store a text verbatim as one memory record (sync)',
    }),
  );

export const ApePostCognitionInsight = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'accepted:true with the stored point id; accepted:false when the feature is disabled or the store failed.',
    }),
    ApiOperation({
      summary: "Store one derived insight into the AI's cognition space (sync)",
    }),
  );

export const ApeDeleteMemoryText = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryDeleteResponseDto }),
    ApiOperation({
      summary:
        "Delete memory records by filters — or, with cognition=true, delete from the AI's cognition space: with text/path the targeted per-item delete, without matchers the whole-space wipe",
    }),
  );

export const ApePostMemorySearchText = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({
      summary: 'Search memory by text (embeds the query, then searches)',
    }),
  );

export const ApePostMemorySearchTextClusters = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemorySearchClustersResponseDto }),
    ApiOperation({
      summary:
        'Graph-augmented text search: the kNN hits plus the detected cluster summaries of the clusters those hits belong to',
    }),
  );

export const ApePostMemorySearchSynopses = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemorySynopsisDto, isArray: true }),
    ApiOperation({
      summary:
        "Raptor synopsis probe: semantic search over one scope's cluster synopses (all hierarchy levels, collapsed). Pass memoryPartition for the partition lane; omit for the global encyclopedia synopses.",
    }),
  );

export const ApePostMemorySearchVector = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({ summary: 'Search memory by a raw query vector' }),
  );

export const ApePostMemorySearchBridges = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({
      summary:
        "Search one partition's bridge records (synthesized gap-closers with evidence back-references) — the bridge read path, separate from fact recall",
    }),
  );

export const ApePostMemorySearchConvictions = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: [MemoryItemDto] }),
    ApiOperation({
      summary:
        "Search one cognition scope's conviction records (the AI's synthesized conclusions about the user/self model, with evidence back-references) — the conviction probe's read path",
    }),
  );

export const ApeDeleteMemory = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryPruneResponseDto }),
    ApiOperation({
      summary:
        'Prune the caller partition: its fact records only (or one conversation of it) — the AI cognition lane has its own wipe endpoint',
    }),
  );

export const ApePostPartitionConsolidate = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryConsolidateResponseDto }),
    ApiOperation({
      summary:
        '① Consolidate — 1st step of the partition maintenance pipeline: enqueue the consolidation sweep (LLM-judged keep/redundant/merge over pending inserts), per partition or all pending partitions',
    }),
  );

export const ApePostPartitionRelink = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryRelinkResponseDto }),
    ApiOperation({
      summary:
        '② Relink — 2nd step of the partition maintenance pipeline: collapse identical category variants, dedupe each category (converging LLM passes), write topical (suggested) link edges, optionally enrich tags. Runs after consolidate merges settle',
    }),
  );

export const ApePostPartitionReconcile = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryRelinkResponseDto }),
    ApiOperation({
      summary:
        '②b Taxonomy reconcile — optional label sweep of the partition pipeline: merges duplicate cluster/community/hub/tag labels (auto above the snap band with token overlap, LLM-verdict in the ambiguous band) with alias provenance. Best after relink settles',
    }),
  );

export const ApePostPartitionReflect = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryReflectResponseDto }),
    ApiOperation({
      summary:
        '③ Reflect — 3rd step of the partition maintenance pipeline: screen unreflected facts for contradictions, write friction records, supersede the loser when a winner is clear. Runs after consolidate/relink settle',
    }),
  );

export const ApePostPartitionConviction = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryConvictionResponseDto }),
    ApiOperation({
      summary:
        '④ Conviction synthesis — 4th step of the partition maintenance pipeline: synthesize higher-level convictions/bridges from reflected (curated) facts — convictions (cognition lane: the user/self model) and bridges (partition lane: gap-closing links between facts) — each carrying evidence_ids back-references. Runs after reflect settles',
    }),
  );

export const ApePostPartitionCluster = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryClusterResponseDto }),
    ApiOperation({
      summary:
        '⑤ Cluster detection — final step of the partition maintenance pipeline: cluster the link graph into clusters, absorb singletons (no lone facts), and summarize each changed cluster. Runs after the graph-mutating steps settle',
    }),
  );

export const ApePostCognitionReflect = () =>
  applyDecorators(
    ApiResponse({ status: 200, type: MemoryReflectResponseDto }),
    ApiOperation({
      summary:
        "① Reflect — the only manual cognition maintenance step: screen the AI's derived insights for contradictions, write friction records, supersede the loser when a winner is clear. The profile itself is write-driven (recomputed after every answered turn)",
    }),
  );

export const ApeTagsMemoryOverrides = () => ApiTags('Memory Overrides');

export const ApeTagsTaxonomy = () => ApiTags('Memory Taxonomy');

export const ApeGetTaxonomyTree = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        "The scope's taxonomy tree: per-tier nodes with leaf/linked/child counts, maintenance stamps, icons, summaries, and the alias audit trail.",
    }),
    ApiOperation({
      summary:
        'List the macro-taxonomy of one scope (cluster → community → hub, plus the tag vocabulary) with operational metadata',
    }),
  );

export const ApePatchTaxonomyNode = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Node updated — rename/icon propagated; the old name stays a permanent alias.',
    }),
    ApiOperation({
      summary:
        'Rename a taxonomy node and/or set its Lucide icon (AI read-only: user-managed mutations only)',
    }),
  );

export const ApePostTaxonomyMerge = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description:
        'Node merged into the target — payloads rewritten, aliases folded, children re-parented.',
    }),
    ApiOperation({
      summary:
        'Merge a taxonomy node into another node of the same scope and tier',
    }),
  );

export const ApeGetMemoryOverrides = () =>
  ApiOperation({
    summary:
      'Current memory system variables (settings → system): effective value, env baseline, override flag',
  });

export const ApePutMemoryOverrides = () =>
  ApiOperation({
    summary:
      'Update memory system variables — takes effect on the very next request',
  });

export const ApeDeleteMemoryOverrides = () =>
  ApiOperation({ summary: 'Reset memory system variables to env defaults' });
