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
  "results.rank": "Rang {rank}",
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
  "results.failScore": "Votre score est passé en négatif.",
  "results.failMistake": "Vous avez fait une erreur.",
  "results.failStreak": "Vous avez manqué 20 mots d'affilée.",

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
  "recent.lede":
    "Les derniers scores vérifiés. Connectez-vous et jouez pour ajouter les vôtres.",
  "recent.empty":
    "Aucun score pour l'instant — jouez un morceau et soyez le premier au classement.",
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

  // Site copy
  "site.tagline": "Tapez les paroles en rythme",
  "site.description":
    "Un jeu de saisie rythmée. YouTube fournit la musique et les visuels, et vous tapez les paroles au fil des mots — un peu comme Guitar Hero pour votre clavier.",
  "common.skipToContent": "Aller au contenu",
  "seo.ogAlt":
    "{name} — une tuile « TS » jaune à côté du titre sur un fond de carnet sombre",
  "seo.requiresJs": "JavaScript requis",
  "privacy.updated": "Dernière mise à jour le {date}",
  "privacy.banner":
    "Cette politique a été traduite pour votre commodité. La version anglaise fait foi — en cas de divergence, c'est le texte anglais qui s'applique.",
  "privacy.bannerLink": "Lire la politique en anglais",

  // Game status (island)
  "game.loadingTrack": "Chargement du morceau…",
  "game.fetchingCaptions": "Récupération des sous-titres et calage des mots.",
  "game.noTrack": "Aucun morceau à jouer",
  "game.tryAnother": "Essayer un autre morceau",
  "game.humanCheckComment": "nouveau morceau",
  "game.humanCheckTitle": "Vérification humaine rapide",
  "game.humanCheckBody":
    "Ce morceau n'est pas encore dans la bibliothèque, nous devons donc simplement vérifier que vous êtes humain avant de le récupérer. Cela n'arrive qu'une fois par morceau.",
  "game.humanCheckFailed":
    "La vérification humaine n'a pas pu être effectuée. Veuillez réessayer plus tard.",
  "game.loadError": "Une erreur est survenue lors du chargement de ce morceau.",
  "game.embedNoSong": "Cette intégration a besoin d'un morceau dans son URL.",

  // Sign-in and account
  "signin.comment": "connexion",
  "signin.title": "Se connecter",
  "signin.lede":
    "TypeStar utilise un lien à usage unique plutôt qu'un mot de passe. Saisissez votre e-mail, ouvrez le lien que nous envoyons, et vous êtes connecté.",
  "signin.formTitle": "Se connecter avec un lien",
  "signin.formBody":
    "Saisissez votre e-mail et nous vous enverrons un lien de connexion à usage unique. Aucun mot de passe à retenir, et aucun compte n'existe tant que vous n'utilisez pas le lien.",
  "signin.emailLabel": "Adresse e-mail",
  "signin.submit": "Envoyez-moi un lien de connexion",
  "signin.sending": "Envoi…",
  "signin.invalidEmail": "Saisissez une adresse e-mail valide.",
  "signin.needCheck": "Veuillez effectuer la vérification humaine.",
  "signin.sendFailed": "Impossible d'envoyer le lien. Veuillez réessayer.",
  "signin.sentComment": "vérifiez votre boîte de réception",
  "signin.sentTitle": "Lien envoyé",
  "signin.sentBody":
    "Nous avons envoyé un lien de connexion à usage unique à {email}. Ouvrez-le dans ce navigateur pour terminer la connexion. Le lien expire dans 15 minutes et ne peut être utilisé qu'une fois.",
  "signin.nothing": "Rien reçu ? Vérifiez vos spams, ou",
  "signin.tryAgain": "réessayez",
  "account.comment": "compte",
  "account.title": "Compte",
  "account.lede": "Votre e-mail, votre pseudo public et votre session.",
  "account.loading": "Chargement de votre compte…",
  "account.signedOutTitle": "Vous n'êtes pas connecté",
  "account.signedOutBody":
    "Connectez-vous avec un lien e-mail à usage unique pour conserver vos scores et réglages sur tous vos appareils.",
  "account.signIn": "Se connecter",
  "account.signedInTitle": "Connecté",
  "account.email": "E-mail",
  "account.memberSince": "Membre depuis",
  "account.handleLabel": "Pseudo",
  "account.handleHint":
    "Votre nom public dans les classements. Lettres minuscules, chiffres et traits de soulignement, 3 à 20 caractères.",
  "account.save": "Enregistrer",
  "account.saving": "Enregistrement…",
  "account.saved": "Pseudo enregistré.",
  "account.signOut": "Se déconnecter",
  "account.deleteAccount": "Supprimer le compte",
  "account.deleteConfirm": "Supprimer votre compte et toutes ses données ?",
  "account.deleteYes": "Oui, supprimer",
  "account.cancel": "Annuler",

  // Embed
  "embed.button": "Intégrer",
  "embed.copied": "Copié !",

  // Turnstile
  "turnstile.failed": "La vérification humaine a échoué. Veuillez réessayer.",
  "turnstile.expired": "La vérification humaine a expiré. Veuillez réessayer.",
  "turnstile.loadError": "Impossible de charger la vérification humaine.",
};
