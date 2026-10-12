import type { MessageKey } from "./en";

/** German — machine-translated; pending human review. */
export const de: Partial<Record<MessageKey, string>> = {
  // Shared
  "common.loading": "Lädt…",
  "common.retry": "Erneut versuchen",
  "common.close": "Schließen",

  // Navigation and footer
  "nav.primary": "Primär",
  "nav.menu": "Menü",
  "nav.play": "Spielen",
  "nav.privacy": "Datenschutz",
  "nav.challenge": "Herausforderung",
  "nav.recent": "Neueste",
  "nav.account": "Konto",
  "nav.language": "Sprache",
  "footer.pages": "Seiten",
  "footer.elsewhere": "Anderswo",
  "footer.source": "Quellcode",
  "footer.licence": "{licence}-Lizenz",
  "footer.private": "// keine Konten, keine Cookies, kein Tracking",

  // Landing
  "home.comment": "Rhythmus-Tippen",
  "home.titleBefore": "Tippe die Lyrics",
  "home.titleMark": "im Takt",
  "home.titleAfter": ".",
  "home.howComment": "so funktioniert's",
  "home.step1Title": "Wähle einen Song",
  "home.step1Body":
    "Füge einen YouTube-Link ein oder starte mit der Empfehlungsliste. TypeStar liest die Untertitel und taktet jedes Wort.",
  "home.step2Title": "Tippe im Takt",
  "home.step2Body":
    "Wörter leuchten auf, wenn sie kommen. Tippe jedes, bevor sein Moment vorbei ist — wie Guitar Hero, nur für die Tastatur.",
  "home.step3Title": "Jage die Punktzahl",
  "home.step3Body":
    "Ketten bauen einen Multiplikator auf und fehlerfreie Zeilen geben Bonus. Drei Schwierigkeiten, vier Spielmodi, endlose Wiederholungen.",

  // 404
  "notFound.comment": "404 · nicht gefunden",
  "notFound.titleBefore": "Dieser Song konnte nicht",
  "notFound.titleMark": "geladen werden",
  "notFound.titleAfter": ".",
  "notFound.body":
    "Der Link ist vielleicht defekt oder die Seite wurde verschoben. Zurück zur Startseite oder direkt ins Spiel.",
  "notFound.home": "Zurück zur Startseite",
  "notFound.play": "Ein Spiel starten",

  // Play page
  "play.crumb": "spielen",
  "play.localCrumb": "lokal",
  "play.subtitle":
    "{tagline} — YouTube liefert Musik und Bilder; du tippst die Lyrics, wenn die Wörter kommen.",
  "play.ratingComment": "Bewertung",
  "play.ratingTitle":
    "Wie schwer die Lyrics zu tippen sind, bewertet nach den Wörtern pro Sekunde des Songs",
  "play.embed": "Einbetten",
  "play.embedCopied": "Kopiert!",

  // Start screen
  "start.ready": "bereit",
  "start.titleType": "Tippe die Wörter im Takt.",
  "start.titleSing": "Sing mit.",
  "start.start": "Start",
  "start.styleGroup": "Spielstil",

  // HUD
  "hud.score": "Punkte",
  "hud.combo": "Combo",
  "hud.accuracy": "Genauigkeit",
  "hud.pause": "Pause",
  "hud.resume": "Fortsetzen",
  "hud.reset": "Zurücksetzen",
  "hud.difficulty": "Schwierigkeit",
  "hud.runMode": "Spielmodus",
  "hud.speed": "Wiedergabegeschwindigkeit",
  "hud.sync": "Sync-Versatz",
  "hud.fullscreen": "Vollbild",
  "hud.goFullscreen": "Vollbild aktivieren",
  "hud.changeSong": "Song wechseln",

  // Calibration
  "calibration.comment": "Sync",
  "calibration.help":
    "Wenn die Wörter der Musik vorauslaufen, verschiebe sie nach hinten. Wenn sie hinterherhinken, verschiebe sie nach vorne.",
  "calibration.offset": "Versatz",
  "calibration.reset": "Zurücksetzen",
  "calibration.done": "Fertig",

  // Results
  "results.results": "Ergebnisse",
  "results.runOver": "Lauf beendet",
  "results.karaoke": "Karaoke",
  "results.score": "Punkte",
  "results.best": "Bestwert {score}",
  "results.newBest": "Neuer Bestwert!",
  "results.thanks": "Danke fürs Spielen!",
  "results.failed": "Fehlgeschlagen",
  "results.through": "{percent}% geschafft",
  "results.tryAgain": "Nochmal versuchen",
  "results.share": "Teilen",
  "results.copied": "Kopiert!",
  "results.changeSong": "Song wechseln",
  "results.close": "Ergebnisse schließen",
  "results.saving": "Wird in der Rangliste gespeichert…",
  "results.saved": "In der Rangliste gespeichert",
  "results.savedRank": "In der Rangliste gespeichert — #{rank}",
  "results.invalid": "Als ungeprüft gespeichert ({reason}).",
  "results.signedOut": "Melde dich an, um deine Punkte in der Rangliste zu speichern.",
  "results.saveError": "Speichern in der Rangliste nicht möglich.",

  // Track picker
  "picker.pasteLabel": "Füge einen YouTube-Link oder eine UltraStar-URL ein",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  oder  …/song.txt",
  "picker.play": "Spielen",
  "picker.note":
    "Ein YouTube-Link wird aus seinen Untertiteln abgespielt; ein Link zu einem UltraStar-.txt-Chart wird geladen und sein Audio vom eigenen Host gestreamt. GitHub-Blob-Links werden automatisch in Raw-Links umgewandelt.",
  "picker.localHeading": "Auf diesem Gerät",
  "picker.localNote":
    "Spiele Songs, die du schon hast. Wähle einen Ordner mit UltraStar-Charts oder Videos mit passenden .vtt-Untertiteln — nichts wird hochgeladen.",
  "picker.openLocal": "Lokale Dateien öffnen",
  "picker.unsupported":
    "Lokale Wiedergabe ist in diesem Browser nicht verfügbar — sie benötigt die File System Access API. Versuche Chrome, Edge oder Brave, um lokale Dateien abzuspielen.",
  "picker.checking": "Browser wird geprüft…",
  "picker.featured": "Empfohlen",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "Spieler",
  "leaderboard.score": "Punkte",
  "leaderboard.accuracy": "Genauigkeit",
  "leaderboard.combo": "Combo",
  "leaderboard.empty": "Noch keine Punkte — sei der Erste.",
  "leaderboard.emptySing": "Noch kein gewerteter Gesang.",
  "score.song": "Song",
  "score.mode": "Modus",
  "score.when": "Wann",
  "profile.comment": "Profil",
  "profile.title": "Spielerprofil",
  "profile.lede": "Punkte, Bestwerte und letzte Läufe.",
  "profile.missing": "Kein Spieler mit diesem Namen.",
  "profile.plays": "Läufe",
  "profile.songs": "Songs",
  "profile.best": "Bestwert",
  "profile.bestHeading": "Beste Punkte",
  "profile.recentHeading": "Neueste",
  "profile.noBests": "Noch keine geprüften Punkte.",
  "profile.nothing": "Noch nichts.",
  "recent.title": "Zuletzt gespielt",
  "recent.lede": "Die neuesten geprüften Punkte. Melde dich an und spiele, um deine hinzuzufügen.",
  "recent.empty": "Noch keine Punkte — spiele einen Song und sei der Erste in der Rangliste.",
  "recent.loading": "Neueste Punkte werden geladen…",
  "challenge.title": "Tages- und Wochenherausforderung",
  "challenge.lede":
    "Ein Song und ein Modifikator pro Zeitraum, mit eigenen Ranglisten für Tippen und Singen. Für alle gleich, und es ändert sich von selbst.",
  "challenge.daily": "Täglich",
  "challenge.weekly": "Wöchentlich",
  "challenge.playTyping": "Tippen spielen",
  "challenge.playSinging": "Singen spielen",
  "challenge.typingBoard": "Tipp-Rangliste",
  "challenge.singingBoard": "Gesangs-Rangliste",
  "challenge.loading": "Herausforderungen werden geladen…",
  "challenge.error": "Die Herausforderung konnte nicht geladen werden.",
};
