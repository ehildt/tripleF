import type { CommonMemoryMessages } from '../../../schemas/common/memory.schema';

export default {
  memorySynopsisTitle: 'Cluster-Synopsen',
  memorySynopsisDesc:
    'Die Raptor-Hierarchie — jeder Cluster Ebene für Ebene zusammengefasst; Zeilen starten eingeklappt, klappe eine auf, um ihre Zusammenfassung und Kindknoten zu lesen',
  memorySynopsisRefresh: 'Synopsen-Baum neu laden',
  memorySynopsisEmpty:
    'Noch keine Cluster-Synopsen — führe zuerst den Cluster-Job für diesen Space aus',
  memorySynopsisUnavailable:
    'Synopsen nicht verfügbar — der Gedächtnisdienst war nicht erreichbar',
  memorySynopsisScopeEncyclopedia: 'Enzyklopädie',
  memorySynopsisScopePartition: 'Partition',
  memorySynopsisLevelLabel: 'Ebene',
  memorySynopsisMembersLabel: 'Mitglieder',
  memoryPartition: 'Gedächtnis-Partition',
  memoryPartitionDesc:
    'Stabile ID, unter der deine Erinnerungen gespeichert werden — Standard ist "default", damit sie Browser/Sessions überleben (leer = aktuelle Session). Die KI führt in diesem Space außerdem eine separate, offenlegbare Kognition über dich',
  memoryCognition: 'Gedächtnis-Kognition',
  memoryCognitionKeyDesc:
    'Separater Schlüsselraum für das Verständnis der KI über dich — Standard ist "default" (leer = Kognition lebt in der Gedächtnis-Partition)',
  memoryCognitionDesc:
    'Das angesammelte Verständnis der KI über dich: ein strukturiertes Profil plus erprobte Erkenntnisse — frag sie im Chat, ob sie es offenlegen oder vergessen soll',
  memoryCognitionCap: 'Kognitions-Limit',
  memoryCognitionCapDesc:
    'Zeichenlimit für das Kognitions-Profildokument — eine Systemvariable (env-Basis MEMORY_COGNITION_LIMIT, Standard 5000, begrenzt auf 500–32000)',
  episodeRecencyWeight: 'Episoden-Aktualitätsgewicht',
  episodeRecencyWeightDesc:
    'Wie stark Aktualität thematische Gleichstände aufbricht, wenn Kurzzeit-Erinnerungen für jede Chat-Runde gerankt werden (0–1, Standard 0.3)',
  episodeRecencyScale: 'Episoden-Aktualitätshorizont',
  episodeRecencyScaleDesc:
    'Abklinghorizont in Sekunden für die Runden-Gedächtnisprobe — eine so alte Episode verliert die Hälfte ihres Aktualitätsbonus (Standard 604800 = 1 Woche)',
  episodeRecencyMidpoint: 'Episoden-Aktualitätsmitte',
  episodeRecencyMidpointDesc:
    'Abklingmitte der Runden-Gedächtnisprobe (0.01–0.99, Standard 0.5)',
  episodeProbeLimit: 'Episoden-Proben-Limit',
  episodeProbeLimitDesc:
    'Kurzzeit-Gesprächserinnerungen pro Runde (0 deaktiviert die Probe, Standard 3)',
  episodeScoreThreshold: 'Episoden-Score-Schwelle',
  episodeScoreThresholdDesc:
    'Mindest-Ähnlichkeit für die Kurzzeit-Gedächtnisprobe vor dem Aktualitäts-Ranking (0–1, Standard 0.1) — niedriger ruft mehr von dem ab, was du zuletzt getan hast',
  memoryCognitionUnavailable: 'Gedächtnis ist aus oder nicht erreichbar',
  memoryCognitionRefresh: 'Kognition neu laden',
  memoryCognitionWipe: 'Kognition löschen',
  memoryCognitionSpacesLabel: 'Kognitions-Spaces',
  memoryCognitionSpaceDefault: 'Gedächtnis-Partition (Standard)',
  memoryModelDefault: 'Standard',
  memoryCognitionSpaceSearch: 'Space suchen oder erstellen',
  memoryCognitionSpaceCreate: 'Space „{text}“ erstellen',
  memoryCognitionSpacesEmpty:
    'Noch keine gespeicherten Spaces — tippe einen Namen, um einen zu erstellen',
  memoryCognitionSpaceRemove: 'Space aus der Liste entfernen (Daten bleiben)',
  memoryPartitionFacts: 'Gedächtnis-Partition',
  memoryPartitionFactsDesc:
    'Deine gespeicherten Fakten-Einträge — Aussagen, die du gemacht hast oder die sich die KI merken sollte; die Kognitions-Lane ist separat und oben zu sehen',
  memoryPartitionRefresh: 'Fakten neu laden',
  memoryPartitionWipe: 'Partitions-Fakten löschen',
  memoryPartitionUnavailable: 'Gedächtnis ist aus oder nicht erreichbar',
  memoryEncyclopedia: 'Gedächtnis-Enzyklopädie',
  memoryEncyclopediaDesc:
    'Der gemeinsame Wissens-Cache — wörtliche Abschnitte abgerufener Webinhalte, nach Kategorie und Thema gruppiert',
  memoryEncyclopediaUnavailable: 'Gedächtnis ist aus oder nicht erreichbar',
  memoryEncyclopediaRefresh: 'Enzyklopädie neu laden',
  memoryToggleLabels: 'Labels ein-/ausblenden',
  memoryResetView: 'Ansicht zurücksetzen',
  memoryToggleRotation: 'Rotation ein-/ausschalten',
  memoryStrictView:
    'Strikte Ansicht — nur kuratierte, verlinkte und reflektierte Punkte',
  memoryRecommendedView: 'Empfohlene Ansicht — veraltete ausblenden',
  memoryExpandAll: 'Alle Themen ausklappen',
  memoryCollapseAll: 'Alle Themen einklappen',
  memoryTaxonomyManager: 'Gedächtnis-Taxonomie',
  memoryTaxonomyManagerDesc:
    'Die Makro-Taxonomie pro Lane — Labels umbenennen, mergen oder ihr Icon ändern; die KI übernimmt sie read-only und jede Änderung wirkt sofort im ganzen Graphen',
  memoryTaxonomyLane: 'Taxonomie-Lane',
  memoryTaxonomyRefresh: 'Taxonomie neu laden',
  memoryTaxonomyUnavailable:
    'Das Taxonomie-Register ist nicht erreichbar — prüfe den Gedächtnisdienst und versuche es erneut',
  memoryTaxonomyEmpty:
    'Noch keine Labels — die Taxonomie füllt sich, während Gedächtnis geschrieben wird',
  memoryTaxonomyClusters: 'Cluster',
  memoryTaxonomyClustersDesc:
    'Die pluralen Familienbuckets (Spiele, Aktien, Arbeit) — die Spitze der Hierarchie',
  memoryTaxonomyCommunities: 'Communities',
  memoryTaxonomyCommunitiesDesc:
    'Plurale Unterfamilien unter einem Cluster (survival-games unter games)',
  memoryTaxonomyHubs: 'Hubs',
  memoryTaxonomyHubsDesc:
    'Die singulären Subjekt-Entitäten, die den Graphen verankern (project zomboid, amd)',
  memoryTaxonomyNodes: 'Knoten',
  memoryTaxonomyNodesDesc:
    'Die benannten Aspekte unter einem Hub (base building unter project zomboid) — ihre Blätter sind die Fakten',
  memoryTaxonomyTags: 'Tags',
  memoryTaxonomyTagsDesc:
    'Das flache Abruf-Vokabular — enge Themenlabels für gefiltertes Recall',
  memoryTaxonomyAliases: '{count} Alias | {count} Aliase',
  memoryTaxonomyCluster: 'Cluster',
  memoryTaxonomyCommunity: 'Community',
  memoryTaxonomyHub: 'Hub',
  memoryTaxonomyNode: 'Knoten',
  memoryTaxonomyTag: 'Tag',
  memoryTaxonomyMetaLeaves: '{count} Blatt | {count} Blätter',
  memoryTaxonomyMetaLinked: '{count} verlinkt',
  memoryTaxonomyMetaChildren: '{count} Kinder',
  memoryTaxonomyStampReflected: 'reflektiert',
  memoryTaxonomyStampConsolidated: 'konsolidiert',
  memoryTaxonomyStampRelinked: 'neu verlinkt',
  memoryTaxonomyLeavesEmpty: 'Keine Blätter angehängt',
  memoryTaxonomyLeafLinked: 'In der Konstellation verlinkt',
  memoryTaxonomyLeafSource: 'Quellseite öffnen',
  memoryTaxonomyEdit: 'Label bearbeiten',
  memoryTaxonomyRename: 'Umbenennen',
  memoryTaxonomyRenameSave: 'Namen speichern',
  memoryTaxonomyMergeInto: 'Mergen in',
  memoryTaxonomyMergePlaceholder: 'Label wählen…',
  memoryTaxonomyMergeConfirm: 'Labels mergen (Payloads werden umgeschrieben)',
  memoryTaxonomyIcon: 'Icon',
  memoryTaxonomyIconClear: 'Icon entfernen',
  memoryConstellationHint:
    'Ziehen zum Drehen · Rechts ziehen zum Schwenken · Scrollen zum Zoomen · Punkt anklicken zum Inspizieren',
  memoryMetadataShow: 'Metadaten anzeigen',
  memoryMetadataHide: 'Metadaten ausblenden',
  memoryMetadataEmpty: 'Wähle einen Punkt, um Details zu sehen',
  memoryFrictionTag: '⚠ Umstritten — offener Konflikt',
  memoryEvidenceTag: 'Unterstützende Belege',
  memoryDownloadDocument: 'Dokument herunterladen',
  memoryToggleSuggested:
    'Schwache Verbindungen ein-/ausblenden — schwache Arcs zwischen Themen unterhalb der Schwellenrelation',
  memoryToggleHeat:
    'Heat-Halos ein-/ausblenden — Punkte glühen wärmer, je häufiger die Gedächtnissuche sie fand',
  memoryConstellationNodeLimit: 'Knotenlimit der Konstellation',
  memoryConstellationNodeLimitDesc:
    'Max. Fakten-Einträge pro Konstellationsdiagramm auf dem Gedächtnis-Tab (100–10000, Standard 5000)',
  memorySpacesSection: 'Gedächtnis-Spaces',
  memoryCognitionProfileSection: 'Kognitions-Profil',
  memoryEpisodeProbeSection: 'Kurzzeitgedächtnis-Probe',
  memoryDiagramSection: 'Konstellationsdiagramm',
  memoryMaintenanceModels: 'Wartungsmodelle',
  memoryConsolidateModel: 'Konsolidierungsmodell',
  memoryConsolidateModelDesc:
    'Chat-Modell für den Partitions-Konsolidierungslauf (env-Basis MEMORY_CONSOLIDATE_MODEL)',
  memoryClassifyModel: 'Klassifizierungsmodell',
  memoryClassifyModelDesc:
    'Chat-Modell für den Enzyklopädie-Klassifizierungsjob (env-Basis ENCYCLOPEDIA_CLASSIFY_MODEL)',
  memoryReflectModel: 'Reflexionsmodell',
  memoryReflectModelDesc:
    'Chat-Modell für die Reflexions-Friktionsurteile (env-Basis MEMORY_REFLECT_MODEL)',
  memoryConvictionModel: 'Überzeugungsmodell',
  memoryConvictionModelDesc:
    'Chat-Modell für die Überzeugungssynthese — leitet Überzeugungen (Kognitions-Lane) und lückenschließende Brücken (Partitions-Lane) aus reflektierten Belegen ab (env-Basis MEMORY_CONVICTION_MODEL)',
  memoryClusterModel: 'Cluster-Modell',
  memoryClusterModelDesc:
    'Chat-Modell für die Cluster-Zusammenfassung (env-Basis MEMORY_CLUSTER_MODEL)',
  memoryAutoTriggers: 'Auto-Trigger',
  memoryPartitionReflectAuto: 'Partition Reflexion auto',
  memoryPartitionReflectAutoDesc:
    'Reflexion nach einem Partitions-Konsolidierungslauf automatisch auslösen',
  memoryCognitionReflectAuto: 'Kognition Reflexion auto',
  memoryCognitionReflectAutoDesc:
    'Reflexion nach einem Kognitions-Profiljob automatisch auslösen',
  memoryEncyclopediaReflectAuto: 'Enzyklopädie Reflexion auto',
  memoryEncyclopediaReflectAutoDesc:
    'Reflexion nach dem Enzyklopädie-Klassifizierungsjob automatisch auslösen',
  memoryConvictionAuto: 'Überzeugung auto',
  memoryConvictionAutoDesc:
    'Überzeugungssynthese nach einem Partitions-Reflexionslauf automatisch auslösen',
  memoryClusterAuto: 'Cluster auto',
  memoryClusterAutoDesc:
    'Cluster-Erkennung nach einem graphenverändernden Job automatisch auslösen',
  memorySweepLimits: 'Lauf-Limits',
  memoryReflectBatchLimit: 'Reflexions-Batchlimit',
  memoryReflectBatchLimitDesc:
    'Max. nicht reflektierte Punkte pro Reflexionslauf (1–500)',
  memoryReflectMaxCandidates: 'Reflexions-Kandidaten',
  memoryReflectMaxCandidatesDesc:
    'Max. Nachbarkandidaten pro Punkt im Frikations-Screen (1–100)',
  memoryConvictionBatchLimit: 'Überzeugungs-Batchlimit',
  memoryConvictionBatchLimitDesc:
    'Max. Belegpunkte pro Überzeugungs-Syntheselauf (1–500)',
  memoryConvictionMaxPerCluster: 'Überzeugungen pro Cluster',
  memoryConvictionMaxPerClusterDesc:
    'Max. geschriebene Überzeugungen pro Cluster und Syntheselauf (1–1000)',
  memoryClusterMinMembers: 'Cluster Mindestmitglieder',
  memoryClusterMinMembersDesc:
    'Mindestanzahl Mitglieder für einen strukturellen Cluster (1–100)',
  memoryRaptorEnabled: 'Raptor aktiviert',
  memoryHeatTrackingEnabled: 'Heat-Tracking',
  memoryHeatTrackingEnabledDesc:
    'Jeden Suchtreffer der Gedächtnissuche auf dem Eintrag zählen (Heat-Menge + Zeitstempel des letzten Zugriffs) — steuert das warme Halo-Overlay der Konstellation über alle Lanes',
  memoryRaptorEnabledDesc:
    'Raptor-Synopsenschicht: jede Cluster-Zusammenfassung als durchsuchbaren Punkt einbetten und Cluster von Synopsen rekursiv eine Ebene höher fassen — übergreifende Fragen können die Community-Zusammenfassung direkt treffen',
  memoryRaptorMaxDepth: 'Raptor Max-Tiefe',
  memoryRaptorMaxDepthDesc:
    'Höchste Synopsenebene pro Scope (1–3) — Ebene 0 fasst Fakten-Cluster zusammen, höhere Ebenen fassen Cluster von Synopsen zusammen',
  memoryResearchSection: 'Lückenfüllende Recherche',
  memoryResearchEnabled: 'Recherche aktiviert',
  memoryResearchEnabledDesc:
    'Hauptschalter für den Hintergrund-Rechercheur, der Wissenslücken schließt, die die eigenen Suchen übrig ließen (standardmäßig aus)',
  memoryResearchSearchEnabled: 'Suche aktiviert',
  memoryResearchSearchEnabledDesc:
    'Der Rechercheur darf Websuchen für Folgethemen ausführen; aus = nur abrufen',
  memoryResearchProvider: 'Suchanbieter',
  memoryResearchProviderDesc:
    'Welche Such-API der Rechercheur nutzt (Serper oder Bright Data) — unabhängig vom Server-Anbieter',
  memoryResearchModel: 'Recherche-Modell',
  memoryResearchModelDesc:
    'Chat-Modell für die Recherche-Triage-Urteile (env-Basis RESEARCH_MODEL)',
  memoryResearchGapLimit: 'Lücken-Limit',
  memoryResearchGapLimitDesc: 'Max. triagierte Lücken pro Recherchelauf (1–50)',
  memoryResearchMaxDepth: 'Max-Tiefe',
  memoryResearchMaxDepthDesc:
    'Max. Vertiefungssprünge pro Recherchekette (1–3)',
  memoryResearchFetchBudget: 'Abruf-Budget',
  memoryResearchFetchBudgetDesc:
    'Max. abgerufene Seiten pro Recherchelauf (1–20)',
  memoryResearchFrictionLimit: 'Friktions-Limit',
  memoryResearchFrictionLimitDesc:
    'Max. umstrittene Gedächtnis-Friktionen pro Recherchelauf (1–20) — offene Widersprüche, die eine Websuche klären könnte, werden zu lösungssuchenden Vertiefungen',
} satisfies CommonMemoryMessages;
