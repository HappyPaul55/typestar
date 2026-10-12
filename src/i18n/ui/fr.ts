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
  "nav.home": "Accueil",
  "nav.play": "Jouer",
  "nav.privacy": "Confidentialité",
  "nav.challenge": "Défi",
  "nav.recent": "Récents",
  "nav.account": "Compte",
  "nav.language": "Langue",
  "nav.breadcrumb": "Fil d'Ariane",
  "footer.pages": "Pages",
  "footer.elsewhere": "Ailleurs",
  "footer.source": "Source",
  "footer.licence": "licence {licence}",
  "footer.private": "// pas de comptes, pas de cookies, pas de traqueurs",
  "footer.nav": "Pied de page",

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
  "home.heroAlt":
    "Une capture d'écran de TypeStar : une vidéo YouTube à côté de la piste des paroles, avec un mot mis en évidence et un score, un combo et une précision dans le HUD.",

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
  "style.type": "Saisie",
  "style.sing": "Chant",
  "style.helpType": "Tapez chaque mot avant qu'il ne passe.",
  "style.helpSingScored":
    "Attrapez les notes à leur arrivée — votre hauteur est notée.",
  "style.helpSingKaraoke":
    "Les mots s'allument à leur arrivée — chantez. Aucun score n'est compté.",

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
  "hud.syncShort": "synchro",
  "hud.songShort": "morceau",

  // Difficulty and run mode, shared by the game bar and the score pages
  "difficulty.easy": "Facile",
  "difficulty.normal": "Normale",
  "difficulty.hard": "Difficile",
  "run.normal": "Normale",
  "run.instant": "Instantané",
  "run.fun": "Détente",
  "run.practise": "Entraînement",
  "speed.normal": "Normale",

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
  "invalid.nonce": "jeton de partie invalide",
  "invalid.checksum": "enregistrement incohérent",
  "invalid.timeline": "enregistrement mal formé",
  "invalid.track": "morceau inconnu",
  "invalid.unscorable": "partie non notable",
  "results.signedOut": "Connectez-vous pour enregistrer vos scores au classement.",
  "results.saveError": "Impossible d'enregistrer au classement.",
  "results.failScore": "Votre score est passé en négatif.",
  "results.failMistake": "Vous avez fait une erreur.",
  "results.failStreak": "Vous avez manqué 20 mots d'affilée.",
  "results.ariaResults": "Résultats",
  "results.ariaRunOver": "Partie terminée",

  // The results metric grid. The engines emit these English labels and values;
  // `src/i18n/labels.ts` maps them back to keys.
  "metric.difficulty": "difficulté",
  "metric.runMode": "mode de jeu",
  "metric.speed": "vitesse",
  "metric.replays": "rejouées",
  "metric.song": "morceau",
  "metric.artist": "artiste",
  "metric.time": "durée",
  "metric.pitchAccuracy": "précision de la hauteur",
  "metric.notes": "notes",
  "metric.perfectNotes": "notes parfaites",
  "metric.bestCombo": "meilleur combo",
  "metric.accuracy": "précision",
  "metric.perfectHits": "coups parfaits",
  "metric.perfectLines": "lignes parfaites",
  "metric.words": "mots",
  "metric.wrongKeys": "touches erronées",
  "metric.wpm": "wpm",

  // Track picker
  "picker.pasteLabel": "Collez un lien YouTube ou une URL UltraStar",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  ou  …/song.txt",
  "picker.play": "Jouer",
  "picker.note":
    "Un lien YouTube est joué à partir de ses sous-titres ; un lien vers une charte UltraStar .txt est récupéré et son audio est diffusé depuis son propre hôte. Les liens blob GitHub sont convertis en raw automatiquement.",
  "picker.invalidInput":
    "Cela ne ressemble pas à un lien YouTube ni à une URL UltraStar .txt.",
  "picker.localHeading": "Sur cet appareil",
  "picker.localAria": "Fichiers locaux",
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
  "time.justNow": "à l'instant",
  "time.minutesAgo": "il y a {count} min",
  "time.hoursAgo": "il y a {count} h",
  "time.daysAgo": "il y a {count} j",
  "profile.comment": "profil",
  "profile.title": "Profil du joueur",
  "profile.lede": "Scores, records et parties récentes.",
  "profile.missing": "Aucun joueur avec ce pseudo.",
  "profile.player": "Joueur",
  "profile.anonymous": "joueur",
  "profile.joined": " · inscrit le {date}",
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

  // Local library
  "local.readFailed": "Ces dossiers n'ont pas pu être lus.",
  "local.unsupported": "Ce navigateur ne peut pas ouvrir de dossiers.",
  "local.openFailed": "Le dossier n'a pas pu être ouvert.",
  "local.reopenFailed": "Les dossiers n'ont pas pu être réouverts.",
  "local.videoDescription": "Vidéo locale — {name}",
  "local.ultrastarDescription": "UltraStar — {artist}",
  "local.noTimedLyrics":
    "Aucune parole synchronisée n'a été trouvée dans {file}.",
  "local.noLyrics": "Aucune parole n'a été trouvée dans {file}.",
  "local.videoLoadFailed":
    "Cette paire vidéo et sous-titres n'a pas pu être chargée.",
  "local.songLoadFailed": "Ce morceau UltraStar n'a pas pu être chargé.",
  "local.folderCount": "{count} dossiers",
  "local.foldersAria": "Dossiers : {names}",
  "local.noSongs": "aucun morceau",
  "local.oneSong": "1 morceau",
  "local.songCount": "{count} morceaux",
  "local.searchPlaceholder": "Rechercher des morceaux…",
  "local.searchAria": "Rechercher des morceaux locaux",
  "local.addFolder": "Ajouter un autre dossier",
  "local.reopenOne": "Réouvrir {name}",
  "local.reopenMany": "Réouvrir les dossiers",
  "local.missing":
    "Impossible de trouver {file} dans ces dossiers. Il a peut-être été déplacé, ou un dossier doit être réouvert.",
  "local.blockedOne":
    "« {name} » a besoin d'une autorisation avant que ses morceaux puissent être affichés.",
  "local.blockedMany":
    "{count} dossiers ont besoin d'une autorisation avant que leurs morceaux puissent être affichés.",
  "local.nothingFound":
    "Rien de jouable n'a été trouvé. TypeStar lit les chartes UltraStar (#MP3 et paroles synchronisées) et les vidéos accompagnées d'un sous-titre .vtt du même nom — par exemple song.mp4 et song.vtt.",
  "local.noMatch": "Aucun morceau ne correspond à « {query} ».",
  "local.badgeVideo": "Vidéo",
  "local.badgeLyrics": "Paroles",
  "local.groupVideo": "Vidéo + sous-titres",
  "local.footIntro": "Cette page se compose de",
  "local.footOutro": ". Pour retirer un dossier, cliquez sur son nom.",
  "local.listAnd": " et ",
  "local.removeFolder": "Retirer {name}",
  "local.youtubeDesc":
    "Choisissez un morceau à la une, ou collez un lien YouTube.",
  "local.chooseFolder": "Choisir un dossier",
  "local.chooseFolderDesc":
    "Jouez des morceaux UltraStar, ou des vidéos avec des sous-titres .vtt correspondants, depuis cet appareil. Rien n'est téléversé.",
  "local.scanning": "Analyse des dossiers…",
  "local.reading": "Lecture du morceau…",

  // Site copy
  "site.tagline": "Un jeu de musique au clavier, à la voix et bien plus",
  "site.description":
    "Un jeu de saisie rythmée. YouTube fournit la musique et les visuels, et vous tapez les paroles au fil des mots — un peu comme Guitar Hero pour votre clavier.",
  "common.skipToContent": "Aller au contenu",
  "seo.ogAlt":
    "{name} — une tuile « TS » jaune à côté du titre sur un fond de carnet sombre",
  "seo.requiresJs": "JavaScript requis",
  "seo.sitemap": "Plan du site",
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
  "trackError.network": "Impossible de joindre le service de morceaux.",
  "trackError.noCaptions": "Cette vidéo n'a pas de sous-titres, il n'y a donc rien à taper.",
  "trackError.badVideoId": "Cet identifiant de vidéo semble incorrect.",
  "trackError.badUrl": "Cette URL de morceau ne peut pas être utilisée.",
  "trackError.noLyrics": "Cette charte UltraStar n'a pas de paroles à jouer.",
  "trackError.noAudio": "Cette charte UltraStar ne nomme aucun fichier audio.",
  "trackError.notFound": "Ce fichier de morceau est introuvable.",
  "trackError.tooLarge": "Ce fichier de morceau est trop volumineux.",
  "trackError.humanCheck": "Termine la vérification rapide pour charger ce nouveau morceau.",
  "trackError.generic": "Impossible de charger ce morceau.",
  "trackError.unreadable": "Les données du morceau sont illisibles.",
  "game.embedNoSong": "Cette intégration a besoin d'un morceau dans son URL.",
  "game.paused": "En pause",
  "game.typeLyricsAria": "Tapez les paroles",
  "game.perfectLine": "Ligne parfaite !",
  "game.combo": "Combo de {count} !",
  "game.localTitle": "Jouer depuis cet appareil",
  "game.localSubtitle":
    "Indiquez à TypeStar un dossier de morceaux. Il lit les chartes UltraStar (.txt) et les vidéos accompagnées d'un sous-titre .vtt du même nom. Rien n'est téléversé, et le dossier reste sur votre machine.",
  "game.localMediaError":
    "Ce fichier n'a pas pu être lu. Le navigateur ne prend peut-être pas en charge son format.",
  "game.remoteMediaError":
    "Les médias de ce morceau n'ont pas pu être chargés depuis sa source.",

  // The media layer
  "player.loading": "chargement du lecteur",
  "player.unavailable": "Vidéo indisponible",
  "player.startFailed": "Le lecteur n'a pas pu démarrer cette vidéo.",
  "player.errInvalidId": "Cet identifiant de vidéo n'est pas valide.",
  "player.errEmbedded": "Cette vidéo ne peut pas être lue dans le lecteur intégré.",
  "player.errPrivate": "Cette vidéo est privée ou a été supprimée.",
  "player.errNotEmbeddable":
    "Le propriétaire n'autorise pas l'intégration de cette vidéo.",

  // The intro cue
  "cue.firstWord": "premier mot dans {seconds} s",
  "cue.nextWord": "mot suivant dans {seconds} s",
  "cue.skip": "Passer",

  // Microphone
  "mic.declined":
    "L'accès au microphone a été refusé, la justesse ne peut donc pas être notée.",
  "mic.failed": "Le microphone n'a pas pu être démarré.",
  "mic.live": "microphone actif",
  "mic.preparing": "préparation du microphone…",
  "mic.unavailable":
    "Microphone indisponible — chant sans notation.",

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
  "account.handlePlaceholder": "ex. type_star",
  "account.save": "Enregistrer",
  "account.saving": "Enregistrement…",
  "account.saved": "Pseudo enregistré.",
  "account.signOut": "Se déconnecter",
  "account.deleteAccount": "Supprimer le compte",
  "account.deleteConfirm": "Supprimer votre compte et toutes ses données ?",
  "account.deleteYes": "Oui, supprimer",
  "account.cancel": "Annuler",
  "account.handleInvalid": "Ce pseudo ne peut pas être utilisé.",
  "account.handleTaken": "Ce pseudo est déjà pris ou invalide. Veuillez réessayer.",
  "account.deleteFailed": "Impossible de supprimer le compte.",
  "handle.empty": "Choisissez un pseudo.",
  "handle.length": "Un pseudo fait {min}–{max} caractères.",
  "handle.charset":
    "Utilisez uniquement des lettres minuscules, des chiffres et des traits de soulignement, en commençant et en terminant par une lettre ou un chiffre.",
  "handle.reserved": "Ce pseudo est réservé.",

  // The magic-link sign-in email
  "email.subject": "Votre lien de connexion TypeStar",
  "email.comment": "connexion",
  "email.heading": "Connexion à TypeStar",
  "email.body":
    "Ouvrez le lien ci-dessous pour terminer la connexion. Il fonctionne une fois et expire dans {minutes} minutes.",
  "email.button": "Se connecter",
  "email.paste": "Ou collez ceci dans votre navigateur :",
  "email.ignore":
    "Si vous n'avez pas demandé à vous connecter, vous pouvez ignorer cet e-mail en toute sécurité.",
  "email.textBody": "Ouvrez ce lien pour terminer la connexion :",
  "email.textExpiry":
    "Le lien fonctionne une fois et expire dans {minutes} minutes.",
  "email.signoff": "— TypeStar",

  // Embed
  "embed.button": "Intégrer",
  "embed.copied": "Copié !",

  // Turnstile
  "turnstile.failed": "La vérification humaine a échoué. Veuillez réessayer.",
  "turnstile.expired": "La vérification humaine a expiré. Veuillez réessayer.",
  "turnstile.loadError": "Impossible de charger la vérification humaine.",
};
