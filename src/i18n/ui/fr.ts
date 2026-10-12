import type { MessageKey } from "./en";

/** French — machine-translated; pending human review. */
export const fr: Partial<Record<MessageKey, string>> = {
  // Shared
  "common.loading": "Chargement…",
  "common.retry": "Réessayer",
  "common.close": "Fermer",

  // Navigation and footer
  "nav.primary": "Principal",
  "nav.menu": "Menu",
  "nav.play": "Jouer",
  "nav.privacy": "Confidentialité",
  "nav.challenge": "Défi",
  "nav.recent": "Récents",
  "nav.account": "Compte",
  "nav.language": "Langue",
  "footer.pages": "Pages",
  "footer.elsewhere": "Ailleurs",
  "footer.source": "Source",
  "footer.licence": "licence {licence}",
  "footer.private": "// pas de comptes, pas de cookies, pas de traqueurs",

  // Landing
  "home.comment": "saisie rythmée",
  "home.titleBefore": "Tapez les paroles",
  "home.titleMark": "en rythme",
  "home.titleAfter": ".",
  "home.howComment": "comment ça marche",
  "home.step1Title": "Choisissez un morceau",
  "home.step1Body":
    "Collez un lien YouTube ou partez de la sélection. TypeStar lit les sous-titres et cale chaque mot.",
  "home.step2Title": "Tapez en mesure",
  "home.step2Body":
    "Les mots s'allument à leur arrivée. Tapez chacun avant qu'il ne passe — comme Guitar Hero, pour votre clavier.",
  "home.step3Title": "Visez le score",
  "home.step3Body":
    "Les enchaînements font monter le multiplicateur et les lignes propres rapportent un bonus. Trois difficultés, quatre modes de jeu, des rejouées sans fin.",

  // 404
  "notFound.comment": "404 · introuvable",
  "notFound.titleBefore": "Ce morceau n'a pas",
  "notFound.titleMark": "chargé",
  "notFound.titleAfter": ".",
  "notFound.body":
    "Le lien est peut-être cassé, ou la page a déménagé. Revenez à l'accueil, ou lancez directement le jeu.",
  "notFound.home": "Retour à l'accueil",
  "notFound.play": "Lancer une partie",

  // Play page
  "play.crumb": "jouer",
  "play.localCrumb": "local",
  "play.subtitle":
    "{tagline} — YouTube fournit la musique et les visuels ; vous tapez les paroles au fil des mots.",
  "play.ratingComment": "difficulté",
  "play.ratingTitle":
    "La difficulté des paroles à taper, évaluée d'après les mots par seconde du morceau",
  "play.embed": "Intégrer",
  "play.embedCopied": "Copié !",

  // Start screen
  "start.ready": "prêt",
  "start.titleType": "Tapez les mots en rythme.",
  "start.titleSing": "Chantez.",
  "start.start": "Démarrer",
  "start.styleGroup": "Style de jeu",

  // HUD
  "hud.score": "score",
  "hud.combo": "combo",
  "hud.accuracy": "précision",
  "hud.pause": "Pause",
  "hud.resume": "Reprendre",
  "hud.reset": "Réinitialiser",
  "hud.difficulty": "Difficulté",
  "hud.runMode": "Mode de jeu",
  "hud.speed": "Vitesse de lecture",
  "hud.sync": "Décalage de synchro",
  "hud.fullscreen": "Plein écran",
  "hud.goFullscreen": "Passer en plein écran",
  "hud.changeSong": "Changer de morceau",

  // Calibration
  "calibration.comment": "synchro",
  "calibration.help":
    "Si les mots précèdent la musique, décalez-les plus tard. S'ils sont en retard, décalez-les plus tôt.",
  "calibration.offset": "décalage",
  "calibration.reset": "Réinitialiser",
  "calibration.done": "Terminé",

  // Results
  "results.results": "résultats",
  "results.runOver": "partie terminée",
  "results.karaoke": "karaoké",
  "results.score": "score",
  "results.best": "Record {score}",
  "results.newBest": "Nouveau record !",
  "results.thanks": "Merci d'avoir joué !",
  "results.failed": "Échec",
  "results.through": "{percent} % du morceau",
  "results.tryAgain": "Réessayer",
  "results.share": "Partager",
  "results.copied": "Copié !",
  "results.changeSong": "Changer de morceau",
  "results.close": "Fermer les résultats",
  "results.saving": "Enregistrement au classement…",
  "results.saved": "Enregistré au classement",
  "results.savedRank": "Enregistré au classement — n°{rank}",
  "results.invalid": "Enregistré comme non vérifié ({reason}).",
  "results.signedOut": "Connectez-vous pour enregistrer vos scores au classement.",
  "results.saveError": "Impossible d'enregistrer au classement.",

  // Track picker
  "picker.pasteLabel": "Collez un lien YouTube ou une URL UltraStar",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  ou  …/song.txt",
  "picker.play": "Jouer",
  "picker.note":
    "Un lien YouTube est joué à partir de ses sous-titres ; un lien vers une charte UltraStar .txt est récupéré et son audio est diffusé depuis son propre hôte. Les liens blob GitHub sont convertis en raw automatiquement.",
  "picker.localHeading": "Sur cet appareil",
  "picker.localNote":
    "Jouez les morceaux que vous avez déjà. Choisissez un dossier de chartes UltraStar ou de vidéos avec des sous-titres .vtt correspondants — rien n'est téléversé.",
  "picker.openLocal": "Ouvrir des fichiers locaux",
  "picker.unsupported":
    "La lecture locale n'est pas disponible dans ce navigateur — elle nécessite la File System Access API. Essayez Chrome, Edge ou Brave pour jouer des fichiers locaux.",
  "picker.checking": "Vérification de ce navigateur…",
  "picker.featured": "À la une",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "Joueur",
  "leaderboard.score": "Score",
  "leaderboard.accuracy": "Précision",
  "leaderboard.combo": "Combo",
  "leaderboard.empty": "Aucun score pour l'instant — soyez le premier.",
  "leaderboard.emptySing": "Aucun chant noté pour l'instant.",
  "score.song": "Morceau",
  "score.mode": "Mode",
  "score.when": "Quand",
  "profile.comment": "profil",
  "profile.title": "Profil du joueur",
  "profile.lede": "Scores, records et parties récentes.",
  "profile.missing": "Aucun joueur avec ce pseudo.",
  "profile.plays": "parties",
  "profile.songs": "morceaux",
  "profile.best": "record",
  "profile.bestHeading": "Meilleurs scores",
  "profile.recentHeading": "Récents",
  "profile.noBests": "Aucun score vérifié pour l'instant.",
  "profile.nothing": "Rien pour l'instant.",
  "recent.title": "Joués récemment",
  "recent.lede": "Les derniers scores vérifiés. Connectez-vous et jouez pour ajouter les vôtres.",
  "recent.empty": "Aucun score pour l'instant — jouez un morceau et soyez le premier au classement.",
  "recent.loading": "Chargement des scores récents…",
  "challenge.title": "Défi quotidien et hebdomadaire",
  "challenge.lede":
    "Un morceau et un modificateur par période, avec ses propres classements de saisie et de chant. Le même pour tous, et il change tout seul.",
  "challenge.daily": "Quotidien",
  "challenge.weekly": "Hebdomadaire",
  "challenge.playTyping": "Jouer en saisie",
  "challenge.playSinging": "Jouer en chant",
  "challenge.typingBoard": "Classement de saisie",
  "challenge.singingBoard": "Classement de chant",
  "challenge.loading": "Chargement des défis…",
  "challenge.error": "Le défi n'a pas pu être chargé.",
};
