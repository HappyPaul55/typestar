import type { MessageKey } from "./en";

/** Spanish — machine-translated; pending human review. */
export const es: Partial<Record<MessageKey, string>> = {
  // Shared
  "common.loading": "Cargando…",
  "common.retry": "Reintentar",
  "common.close": "Cerrar",

  // Navigation and footer
  "nav.primary": "Principal",
  "nav.menu": "Menú",
  "nav.home": "Inicio",
  "nav.play": "Jugar",
  "nav.privacy": "Privacidad",
  "nav.challenge": "Desafío",
  "nav.recent": "Recientes",
  "nav.account": "Cuenta",
  "nav.language": "Idioma",
  "nav.breadcrumb": "Migas de pan",
  "footer.pages": "Páginas",
  "footer.elsewhere": "En otros sitios",
  "footer.source": "Código fuente",
  "footer.licence": "Licencia {licence}",
  "footer.private": "// sin cuentas, sin cookies, sin rastreadores",
  "footer.nav": "Pie de página",

  // Landing
  "home.comment": "ritmo y mecanografía",
  "home.titleBefore": "Escribe la letra",
  "home.titleMark": "a tiempo",
  "home.titleAfter": ".",
  "home.howComment": "cómo funciona",
  "home.step1Title": "Elige una canción",
  "home.step1Body":
    "Pega un enlace de YouTube o empieza por la lista destacada. TypeStar lee los subtítulos y sincroniza cada palabra.",
  "home.step2Title": "Escribe al ritmo",
  "home.step2Body":
    "Las palabras se iluminan cuando llegan. Escribe cada una antes de que pase su momento, como Guitar Hero, pero con tu teclado.",
  "home.step3Title": "Persigue la puntuación",
  "home.step3Body":
    "Las cadenas suben el multiplicador y las líneas perfectas dan bonus. Tres dificultades, cuatro modos de partida, partidas sin fin.",
  "home.heroAlt":
    "Una captura de pantalla de TypeStar: un vídeo de YouTube junto a la autopista de la letra, con una palabra resaltada y la puntuación, el combo y la precisión en el HUD.",

  // 404
  "notFound.comment": "404 · no encontrado",
  "notFound.titleBefore": "Esta canción no",
  "notFound.titleMark": "cargó",
  "notFound.titleAfter": ".",
  "notFound.body":
    "El enlace puede estar roto o la página se ha movido. Vuelve al inicio o entra directamente al juego.",
  "notFound.home": "Volver al inicio",
  "notFound.play": "Jugar una partida",

  // Play page
  "play.crumb": "jugar",
  "play.localCrumb": "local",
  "play.subtitle":
    "{tagline} — YouTube pone la música y las imágenes; tú escribes la letra según llegan las palabras.",
  "play.ratingComment": "valoración",
  "play.ratingTitle":
    "Lo difícil que es escribir la letra, valorado según las palabras por segundo de la canción",
  "play.embed": "Insertar",
  "play.embedCopied": "¡Copiado!",

  // Start screen
  "start.ready": "listo",
  "start.titleType": "Escribe las palabras a tiempo.",
  "start.titleSing": "Canta encima.",
  "start.start": "Empezar",
  "start.styleGroup": "Estilo de juego",
  "style.type": "Escribir",
  "style.sing": "Cantar",
  "style.helpType": "Escribe cada palabra antes de que pase su momento.",
  "style.helpSingScored": "Acierta las notas cuando llegan: se puntúa tu afinación.",
  "style.helpSingKaraoke":
    "Las palabras se iluminan cuando llegan: canta encima. No se guarda puntuación.",

  // HUD
  "hud.score": "puntos",
  "hud.combo": "combo",
  "hud.accuracy": "precisión",
  "hud.pause": "Pausa",
  "hud.resume": "Continuar",
  "hud.reset": "Reiniciar",
  "hud.difficulty": "Dificultad",
  "hud.runMode": "Modo de partida",
  "hud.speed": "Velocidad de reproducción",
  "hud.sync": "Ajuste de sincronía",
  "hud.fullscreen": "Pantalla completa",
  "hud.goFullscreen": "Ir a pantalla completa",
  "hud.changeSong": "Cambiar canción",
  "hud.syncShort": "sincro",
  "hud.songShort": "canción",

  // Difficulty and run mode, shared by the game bar and the score pages
  "difficulty.easy": "Fácil",
  "difficulty.normal": "Normal",
  "difficulty.hard": "Difícil",
  "run.normal": "Normal",
  "run.instant": "Instantáneo",
  "run.fun": "Diversión",
  "run.practise": "Práctica",
  "speed.normal": "Normal",

  // Calibration
  "calibration.comment": "sincronía",
  "calibration.help":
    "Si las palabras se adelantan a la música, retrásalas. Si van con retraso, adelántalas.",
  "calibration.offset": "desfase",
  "calibration.reset": "Reiniciar",
  "calibration.done": "Listo",

  // Results
  "results.results": "resultados",
  "results.runOver": "partida terminada",
  "results.karaoke": "karaoke",
  "results.score": "puntos",
  "results.best": "Mejor {score}",
  "results.newBest": "¡Nuevo récord!",
  "results.thanks": "¡Gracias por jugar!",
  "results.failed": "Fallaste",
  "results.rank": "Puesto {rank}",
  "results.through": "{percent}% completado",
  "results.tryAgain": "Reintentar",
  "results.share": "Compartir",
  "results.copied": "¡Copiado!",
  "results.changeSong": "Cambiar canción",
  "results.close": "Cerrar resultados",
  "results.saving": "Guardando en la clasificación…",
  "results.saved": "Guardado en la clasificación",
  "results.savedRank": "Guardado en la clasificación — n.º {rank}",
  "results.invalid": "Guardado como no verificado ({reason}).",
  "invalid.nonce": "token de partida inválido",
  "invalid.checksum": "grabación no coincidente",
  "invalid.timeline": "grabación mal formada",
  "invalid.track": "canción desconocida",
  "invalid.unscorable": "partida no puntuable",
  "results.signedOut": "Inicia sesión para guardar tus puntuaciones en la clasificación.",
  "results.saveError": "No se pudo guardar en la clasificación.",
  "results.failScore": "Tu puntuación se volvió negativa.",
  "results.failMistake": "Cometiste un error.",
  "results.failStreak": "Fallaste 20 seguidas.",
  "results.ariaResults": "Resultados",
  "results.ariaRunOver": "Partida terminada",

  // The results metric grid. The engines emit these English labels and values;
  // `src/i18n/labels.ts` maps them back to keys.
  "metric.difficulty": "dificultad",
  "metric.runMode": "modo",
  "metric.speed": "velocidad",
  "metric.replays": "repeticiones",
  "metric.song": "canción",
  "metric.artist": "artista",
  "metric.time": "tiempo",
  "metric.pitchAccuracy": "afinación",
  "metric.notes": "notas",
  "metric.perfectNotes": "notas perfectas",
  "metric.bestCombo": "mejor combo",
  "metric.accuracy": "precisión",
  "metric.perfectHits": "aciertos perfectos",
  "metric.perfectLines": "líneas perfectas",
  "metric.words": "palabras",
  "metric.wrongKeys": "teclas erróneas",
  "metric.wpm": "WPM",

  // Track picker
  "picker.pasteLabel": "Pega un enlace de YouTube o una URL de UltraStar",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  o  …/song.txt",
  "picker.play": "Jugar",
  "picker.note":
    "Un enlace de YouTube se reproduce desde sus subtítulos; un enlace a un gráfico UltraStar .txt se descarga y su audio se reproduce desde su propio servidor. Los enlaces blob de GitHub se convierten a raw automáticamente.",
  "picker.invalidInput":
    "Eso no parece un enlace de YouTube ni una URL de UltraStar .txt.",
  "picker.localHeading": "En este dispositivo",
  "picker.localAria": "Archivos locales",
  "picker.localNote":
    "Reproduce canciones que ya tienes. Elige una carpeta de gráficos UltraStar o de vídeos con subtítulos .vtt del mismo nombre: no se sube nada.",
  "picker.openLocal": "Abrir archivos locales",
  "picker.unsupported":
    "La reproducción local no está disponible en este navegador: necesita la File System Access API. Prueba Chrome, Edge o Brave para reproducir archivos locales.",
  "picker.checking": "Comprobando este navegador…",
  "picker.featured": "Destacadas",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "Jugador",
  "leaderboard.score": "Puntos",
  "leaderboard.accuracy": "Precisión",
  "leaderboard.combo": "Combo",
  "leaderboard.empty": "Aún no hay puntuaciones: sé el primero.",
  "leaderboard.emptySing": "Aún no hay canto puntuado.",
  "score.song": "Canción",
  "score.mode": "Modo",
  "score.when": "Cuándo",
  "time.justNow": "ahora mismo",
  "time.minutesAgo": "hace {count} min",
  "time.hoursAgo": "hace {count} h",
  "time.daysAgo": "hace {count} d",
  "profile.comment": "perfil",
  "profile.title": "Perfil del jugador",
  "profile.lede": "Puntuaciones, récords y partidas recientes.",
  "profile.missing": "No hay ningún jugador con ese nombre.",
  "profile.player": "Jugador",
  "profile.anonymous": "jugador",
  "profile.joined": " · se unió en {date}",
  "profile.plays": "partidas",
  "profile.songs": "canciones",
  "profile.best": "mejor",
  "profile.bestHeading": "Mejores puntuaciones",
  "profile.recentHeading": "Recientes",
  "profile.noBests": "Aún no hay puntuaciones verificadas.",
  "profile.nothing": "Nada todavía.",
  "recent.title": "Jugadas recientemente",
  "recent.lede":
    "Las últimas puntuaciones verificadas. Inicia sesión y juega para añadir las tuyas.",
  "recent.empty": "Aún no hay puntuaciones: juega una canción y sé el primero en la tabla.",
  "recent.loading": "Cargando puntuaciones recientes…",
  "challenge.title": "Desafío diario y semanal",
  "challenge.lede":
    "Una canción y un modificador por período, con sus propias tablas de escritura y canto. Igual para todos, y cambia solo.",
  "challenge.daily": "Diario",
  "challenge.weekly": "Semanal",
  "challenge.playTyping": "Jugar escribiendo",
  "challenge.playSinging": "Jugar cantando",
  "challenge.typingBoard": "Tabla de escritura",
  "challenge.singingBoard": "Tabla de canto",
  "challenge.loading": "Cargando desafíos…",
  "challenge.error": "No se pudo cargar el desafío.",

  // Local library
  "local.readFailed": "No se pudieron leer esas carpetas.",
  "local.unsupported": "Este navegador no puede abrir carpetas.",
  "local.openFailed": "No se pudo abrir la carpeta.",
  "local.reopenFailed": "No se pudieron volver a abrir las carpetas.",
  "local.videoDescription": "Vídeo local — {name}",
  "local.ultrastarDescription": "UltraStar — {artist}",
  "local.noTimedLyrics": "No se encontró letra sincronizada en {file}.",
  "local.noLyrics": "No se encontró letra en {file}.",
  "local.videoLoadFailed": "No se pudo cargar ese par de vídeo y subtítulos.",
  "local.songLoadFailed": "No se pudo cargar esa canción de UltraStar.",
  "local.folderCount": "{count} carpetas",
  "local.foldersAria": "Carpetas: {names}",
  "local.noSongs": "sin canciones",
  "local.oneSong": "1 canción",
  "local.songCount": "{count} canciones",
  "local.searchPlaceholder": "Buscar canciones…",
  "local.searchAria": "Buscar canciones locales",
  "local.addFolder": "Añadir otra carpeta",
  "local.reopenOne": "Volver a abrir {name}",
  "local.reopenMany": "Volver a abrir carpetas",
  "local.missing":
    "No se encontró {file} en estas carpetas. Puede que se haya movido o que haya que volver a abrir una carpeta.",
  "local.blockedOne":
    "«{name}» necesita permiso antes de que se puedan mostrar sus canciones.",
  "local.blockedMany":
    "{count} carpetas necesitan permiso antes de que se puedan mostrar sus canciones.",
  "local.nothingFound":
    "No se encontró nada reproducible. TypeStar lee gráficos UltraStar (#MP3 más letra sincronizada) y vídeos con un subtítulo .vtt del mismo nombre; por ejemplo, song.mp4 y song.vtt.",
  "local.noMatch": "Ninguna canción coincide con «{query}».",
  "local.badgeVideo": "Vídeo",
  "local.badgeLyrics": "Letra",
  "local.groupVideo": "Vídeo + subtítulos",
  "local.footIntro": "Esta página se compone de",
  "local.footOutro": ". Para quitar una carpeta, haz clic en su nombre.",
  "local.listAnd": " y ",
  "local.removeFolder": "Quitar {name}",
  "local.youtubeDesc": "Elige una canción destacada o pega un enlace de YouTube.",
  "local.chooseFolder": "Elige una carpeta",
  "local.chooseFolderDesc":
    "Reproduce canciones de UltraStar, o vídeos con subtítulos .vtt del mismo nombre, desde este dispositivo. No se sube nada.",
  "local.scanning": "Analizando carpetas…",
  "local.reading": "Leyendo canción…",

  // Site copy
  "site.tagline": "Un juego de música que se juega con el teclado, la voz y mucho más",
  "site.description":
    "Un juego de mecanografía rítmica. YouTube pone la música y las imágenes, y tú escribes la letra según llegan las palabras: algo así como Guitar Hero para tu teclado.",
  "common.skipToContent": "Ir al contenido",
  "seo.ogAlt": "{name} — una teja «TS» amarilla junto al título sobre un fondo oscuro de cuaderno",
  "seo.requiresJs": "Requiere JavaScript",
  "seo.sitemap": "Mapa del sitio",
  "privacy.updated": "Última actualización: {date}",
  "privacy.banner":
    "Esta política se ha traducido para tu comodidad. La versión en inglés es la fuente de referencia: si algo difiere, se aplica el texto en inglés.",
  "privacy.bannerLink": "Leer la política en inglés",

  // Game status (island)
  "game.loadingTrack": "Cargando canción…",
  "game.fetchingCaptions": "Obteniendo los subtítulos y sincronizando las palabras.",
  "game.noTrack": "No hay canción que reproducir",
  "game.tryAnother": "Probar otra canción",
  "game.humanCheckComment": "canción nueva",
  "game.humanCheckTitle": "Comprobación humana rápida",
  "game.humanCheckBody":
    "Esta canción aún no está en la biblioteca, así que solo necesitamos comprobar que eres humano antes de descargarla. Solo ocurre una vez por canción.",
  "game.humanCheckFailed":
    "No se pudo completar la comprobación humana. Vuelve a intentarlo más tarde.",
  "game.loadError": "Algo salió mal al cargar esta canción.",
  "trackError.network": "No se pudo contactar con el servicio de canciones.",
  "trackError.noCaptions": "Este vídeo no tiene subtítulos, así que no hay nada que escribir.",
  "trackError.badVideoId": "Ese id de vídeo parece incorrecto.",
  "trackError.badUrl": "Esa URL de canción no se puede usar.",
  "trackError.noLyrics": "Ese chart de UltraStar no tiene letras para jugar.",
  "trackError.noAudio": "Ese chart de UltraStar no indica ningún archivo de audio.",
  "trackError.notFound": "No se encontró ese archivo de canción.",
  "trackError.tooLarge": "Ese archivo de canción es demasiado grande.",
  "trackError.humanCheck": "Completa la comprobación rápida para cargar esta canción nueva.",
  "trackError.generic": "No se pudo cargar esta canción.",
  "trackError.unreadable": "Los datos de la canción no se pudieron leer.",
  "game.embedNoSong": "Este inserto necesita una canción en su URL.",
  "game.paused": "En pausa",
  "game.typeLyricsAria": "Escribe la letra",
  "game.perfectLine": "¡Línea perfecta!",
  "game.combo": "¡{count} de combo!",
  "game.localTitle": "Jugar desde este dispositivo",
  "game.localSubtitle":
    "Señala a TypeStar una carpeta de canciones. Lee gráficos UltraStar (.txt) y vídeos emparejados con un subtítulo .vtt del mismo nombre. No se sube nada y la carpeta se queda en tu equipo.",
  "game.localMediaError":
    "No se pudo reproducir este archivo. Puede que el navegador no admita su formato.",
  "game.remoteMediaError":
    "No se pudieron cargar los medios de esta canción desde su origen.",

  // The media layer
  "player.loading": "cargando reproductor",
  "player.unavailable": "Vídeo no disponible",
  "player.startFailed": "El reproductor no pudo iniciar este vídeo.",
  "player.errInvalidId": "Ese id de vídeo no es válido.",
  "player.errEmbedded": "Este vídeo no se puede reproducir en el reproductor insertado.",
  "player.errPrivate": "Este vídeo es privado o se ha eliminado.",
  "player.errNotEmbeddable": "El propietario no permite insertar este vídeo.",

  // The intro cue
  "cue.firstWord": "primera palabra en {seconds}s",
  "cue.nextWord": "siguiente palabra en {seconds}s",
  "cue.skip": "Saltar",

  // Microphone
  "mic.declined":
    "Se denegó el acceso al micrófono, así que no se puede puntuar la afinación.",
  "mic.failed": "No se pudo iniciar el micrófono.",
  "mic.live": "micrófono activo",
  "mic.preparing": "preparando el micrófono…",
  "mic.unavailable": "Micrófono no disponible: canta encima sin puntuación.",

  // Sign-in and account
  "signin.comment": "iniciar sesión",
  "signin.title": "Iniciar sesión",
  "signin.lede":
    "TypeStar usa un enlace de un solo uso en lugar de una contraseña. Escribe tu correo, abre el enlace que te enviamos y ya estás dentro.",
  "signin.formTitle": "Inicia sesión con un enlace",
  "signin.formBody":
    "Escribe tu correo y te enviaremos un enlace de inicio de sesión de un solo uso. Sin contraseñas que recordar, y no existe ninguna cuenta hasta que uses el enlace.",
  "signin.emailLabel": "Correo electrónico",
  "signin.submit": "Envíame un enlace de inicio de sesión",
  "signin.sending": "Enviando…",
  "signin.invalidEmail": "Escribe un correo electrónico válido.",
  "signin.needCheck": "Completa la comprobación humana.",
  "signin.sendFailed": "No se pudo enviar el enlace. Inténtalo de nuevo.",
  "signin.sentComment": "revisa tu bandeja de entrada",
  "signin.sentTitle": "Enlace enviado",
  "signin.sentBody":
    "Enviamos un enlace de inicio de sesión de un solo uso a {email}. Ábrelo en este navegador para terminar de iniciar sesión. El enlace caduca en 15 minutos y solo se puede usar una vez.",
  "signin.nothing": "¿No llegó nada? Revisa tu carpeta de spam o",
  "signin.tryAgain": "inténtalo de nuevo",
  "account.comment": "cuenta",
  "account.title": "Cuenta",
  "account.lede": "Tu correo, tu nombre público y tu sesión.",
  "account.loading": "Cargando tu cuenta…",
  "account.signedOutTitle": "No has iniciado sesión",
  "account.signedOutBody":
    "Inicia sesión con un enlace de correo de un solo uso para conservar tus puntuaciones y ajustes entre dispositivos.",
  "account.signIn": "Iniciar sesión",
  "account.signedInTitle": "Sesión iniciada",
  "account.email": "Correo electrónico",
  "account.memberSince": "Miembro desde",
  "account.handleLabel": "Nombre de usuario",
  "account.handleHint":
    "Tu nombre público en las clasificaciones. Letras minúsculas, números y guiones bajos, de 3 a 20 caracteres.",
  "account.handlePlaceholder": "p. ej., type_star",
  "account.save": "Guardar",
  "account.saving": "Guardando…",
  "account.saved": "Nombre guardado.",
  "account.signOut": "Cerrar sesión",
  "account.deleteAccount": "Eliminar cuenta",
  "account.deleteConfirm": "¿Eliminar tu cuenta y todos sus datos?",
  "account.deleteYes": "Sí, eliminar",
  "account.cancel": "Cancelar",
  "account.handleInvalid": "Ese nombre no se puede usar.",
  "account.handleTaken": "Ese nombre ya está en uso o no es válido. Inténtalo de nuevo.",
  "account.deleteFailed": "No se pudo eliminar la cuenta.",
  "handle.empty": "Elige un nombre de usuario.",
  "handle.length": "El nombre debe tener entre {min} y {max} caracteres.",
  "handle.charset":
    "Usa solo letras minúsculas, números y guiones bajos, empezando y terminando por una letra o un número.",
  "handle.reserved": "Ese nombre está reservado.",

  // The magic-link sign-in email
  "email.subject": "Tu enlace de inicio de sesión de TypeStar",
  "email.comment": "iniciar sesión",
  "email.heading": "Inicia sesión en TypeStar",
  "email.body":
    "Abre el enlace de abajo para terminar de iniciar sesión. Funciona una sola vez y caduca en {minutes} minutos.",
  "email.button": "Iniciar sesión",
  "email.paste": "O pega esto en tu navegador:",
  "email.ignore": "Si no has solicitado iniciar sesión, puedes ignorar este correo sin problema.",
  "email.textBody": "Abre este enlace para terminar de iniciar sesión:",
  "email.textExpiry": "El enlace funciona una sola vez y caduca en {minutes} minutos.",
  "email.signoff": "— TypeStar",

  // Embed
  "embed.button": "Insertar",
  "embed.copied": "¡Copiado!",

  // Turnstile
  "turnstile.failed": "La comprobación humana falló. Inténtalo de nuevo.",
  "turnstile.expired": "La comprobación humana caducó. Inténtalo de nuevo.",
  "turnstile.loadError": "No se pudo cargar la comprobación humana.",
};
