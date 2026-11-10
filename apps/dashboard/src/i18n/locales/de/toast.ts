import type { ToastMessages } from '../../schemas/toast.schema';

export default {
  taxonomyRenamed: 'Label umbenannt',
  taxonomyRenameFailed: 'Label konnte nicht umbenannt werden',
  taxonomyLeavesFailed: 'Die Blätter konnten nicht geladen werden',
  taxonomyMerged: 'Labels gemergt',
  taxonomyMergeFailed: 'Labels konnten nicht gemergt werden',
  taxonomyIconUpdated: 'Icon aktualisiert',
  taxonomyIconFailed: 'Icon konnte nicht aktualisiert werden',
  requestError:
    'Die Anfrage ist fehlgeschlagen (Fehler {status}). Versuche es gleich noch einmal.',
  requestSent: 'Anfrage gesendet',
  requestSentSocketDisconnected:
    'Anfrage gesendet, aber die Verbindung ist abgerissen — die Antwort erscheint eventuell nicht.',
  serverUnreachable:
    'Der Server ist nicht erreichbar. Prüfe, ob er läuft, und versuche es erneut.',
  failedCancelRequest: 'Die Anfrage konnte nicht abgebrochen werden',
  requestCancelled: 'Anfrage abgebrochen',
  failedLoadModelsStatus:
    'Die Modellliste konnte nicht geladen werden (Fehler {status})',
  loadedModels: '{count} Modell geladen | {count} Modelle geladen',
  failedLoadModels: 'Die Modellliste konnte nicht geladen werden',
  failedLoadConfig: 'Die Konfiguration konnte nicht geladen werden',
  failedResetProviderConfig:
    'Die Provider-Konfiguration konnte nicht zurückgesetzt werden',
  apiKeySaved: 'API-Schlüssel gespeichert',
  failedSaveApiKey: 'Der API-Schlüssel konnte nicht gespeichert werden',
  retried: '{count} Job erneut versucht | {count} Jobs erneut versucht',
  retryFailed: 'Der Job konnte nicht erneut versucht werden',
  jobArchived: 'Job archiviert',
  archiveFailed: 'Der Job konnte nicht archiviert werden',
  markedForDeletion: 'Job zum Löschen markiert',
  deleteFailed: 'Der Job konnte nicht gelöscht werden',
  payloadUpdated: 'Payload gespeichert',
  payloadUpdateFailed: 'Der Payload konnte nicht gespeichert werden',
  failedRemoveFile: 'Die hochgeladene Datei konnte nicht entfernt werden',
  unsupportedFileType:
    '{name} konnte nicht verwendet werden — dieser Dateityp wird nicht unterstützt',
  failedReadFile: '{name} konnte nicht gelesen werden',
  failedUpdateSearchSource: 'Die Suchquelle konnte nicht aktualisiert werden',
  failedUpdateSearchEngine: 'Die Suchmaschine konnte nicht aktualisiert werden',
  createPlaylistFirst: 'Erstelle eine Playlist, bevor du Videos hinzufügst',
  playlistCreated: 'Playlist {name} erstellt',
  playlistDeleted: 'Playlist {name} gelöscht',
  playlistNameExists: 'Dieser Playlist-Name ist vergeben',
  playlistLoaded: 'Playlist {name} geladen',
  couldNotSavePlaylist: 'Playlist {name} konnte nicht gespeichert werden',
  couldNotRenamePlaylist: 'Playlist {name} konnte nicht umbenannt werden',
  couldNotDeletePlaylist: 'Playlist {name} konnte nicht gelöscht werden',
  modelNoThink: '{model} unterstützt kein Thinking. Es wurde ausgeschaltet.',
  contextClamped:
    '{model} unterstützt bis zu {max} Kontext, deshalb wurde es auf {value} gesetzt.',
  contextFull:
    'Der Kontext ist voll. Erhöhe die Kontextgröße, um fortzufahren.',
  modelNoImages:
    '{model} kann keine Bilder sehen — sie wurden aus der Anfrage weggelassen.',
  previewFailed: 'Die Vorschau konnte nicht erzeugt werden',
  serperBrightDataRedundant:
    'Serper und Bright Data durchsuchen beide Google — beide parallel verdoppeln die Kosten. Behalte beide und verteile die Tools auf sie.',
  modelRequired: 'Wähle ein Modell, um loszulegen',
} satisfies ToastMessages;
