import type { MessageKey } from "./en";

/** Brazilian Portuguese — machine-translated; pending human review. */
export const ptBR: Partial<Record<MessageKey, string>> = {
  // Shared
  "common.loading": "Carregando…",
  "common.retry": "Tentar novamente",
  "common.close": "Fechar",

  // Navigation and footer
  "nav.primary": "Principal",
  "nav.menu": "Menu",
  "nav.home": "Início",
  "nav.play": "Jogar",
  "nav.privacy": "Privacidade",
  "nav.challenge": "Desafio",
  "nav.recent": "Recentes",
  "nav.account": "Conta",
  "nav.language": "Idioma",
  "nav.breadcrumb": "Trilha de navegação",
  "footer.pages": "Páginas",
  "footer.elsewhere": "Em outros lugares",
  "footer.source": "Código-fonte",
  "footer.licence": "licença {licence}",
  "footer.private": "// sem contas, sem cookies, sem rastreadores",
  "footer.nav": "Rodapé",

  // Landing
  "home.comment": "digitação rítmica",
  "home.titleBefore": "Digite a letra",
  "home.titleMark": "no tempo",
  "home.titleAfter": ".",
  "home.howComment": "como funciona",
  "home.step1Title": "Escolha uma música",
  "home.step1Body":
    "Cole um link do YouTube ou comece pela lista de destaques. O TypeStar lê as legendas e marca o tempo de cada palavra.",
  "home.step2Title": "Digite no ritmo",
  "home.step2Body":
    "As palavras se acendem conforme chegam. Digite cada uma antes que o momento passe — como no Guitar Hero, mas para o seu teclado.",
  "home.step3Title": "Persiga a pontuação",
  "home.step3Body":
    "Sequências aumentam o multiplicador e linhas perfeitas rendem bônus. Três dificuldades, quatro modos de partida, jogadas infinitas.",
  "home.heroAlt":
    "Uma captura de tela do TypeStar: um vídeo do YouTube ao lado da pista de letras, com uma palavra destacada e pontuação, combo e precisão no HUD.",

  // 404
  "notFound.comment": "404 · não encontrado",
  "notFound.titleBefore": "Esta música não",
  "notFound.titleMark": "carregou",
  "notFound.titleAfter": ".",
  "notFound.body":
    "O link pode estar quebrado ou a página pode ter mudado de lugar. Volte para a página inicial ou entre direto no jogo.",
  "notFound.home": "Voltar ao início",
  "notFound.play": "Jogar uma partida",

  // Play page
  "play.crumb": "jogar",
  "play.localCrumb": "local",
  "play.subtitle":
    "{tagline} — o YouTube fornece a música e as imagens; você digita a letra conforme as palavras chegam.",
  "play.ratingComment": "avaliação",
  "play.ratingTitle":
    "O quão difícil é digitar a letra, avaliado pelas palavras por segundo da música",
  "play.embed": "Incorporar",
  "play.embedCopied": "Copiado!",

  // Start screen
  "start.ready": "pronto",
  "start.titleType": "Digite as palavras no tempo.",
  "start.titleSing": "Cante junto.",
  "start.start": "Começar",
  "start.styleGroup": "Estilo de jogo",
  "style.type": "Digitar",
  "style.sing": "Cantar",
  "style.helpType": "Digite cada palavra antes que o momento passe.",
  "style.helpSingScored": "Acerte as notas conforme chegam — sua afinação é pontuada.",
  "style.helpSingKaraoke":
    "As palavras se acendem conforme chegam — cante junto. Nenhuma pontuação é registrada.",

  // HUD
  "hud.score": "pontuação",
  "hud.combo": "combo",
  "hud.accuracy": "precisão",
  "hud.pause": "Pausar",
  "hud.resume": "Continuar",
  "hud.reset": "Reiniciar",
  "hud.difficulty": "Dificuldade",
  "hud.runMode": "Modo de partida",
  "hud.speed": "Velocidade de reprodução",
  "hud.sync": "Ajuste de sincronia",
  "hud.fullscreen": "Tela cheia",
  "hud.goFullscreen": "Entrar em tela cheia",
  "hud.changeSong": "Trocar de música",
  "hud.syncShort": "sinc",
  "hud.songShort": "música",

  // Difficulty and run mode, shared by the game bar and the score pages
  "difficulty.easy": "Fácil",
  "difficulty.normal": "Normal",
  "difficulty.hard": "Difícil",
  "run.normal": "Normal",
  "run.instant": "Instantâneo",
  "run.fun": "Diversão",
  "run.practise": "Treino",
  "speed.normal": "Normal",

  // Calibration
  "calibration.comment": "sincronia",
  "calibration.help":
    "Se as palavras aparecem antes da música, atrase-as. Se ficam para trás, adiante-as.",
  "calibration.offset": "ajuste",
  "calibration.reset": "Reiniciar",
  "calibration.done": "Pronto",

  // Results
  "results.results": "resultados",
  "results.runOver": "fim da partida",
  "results.karaoke": "karaokê",
  "results.score": "pontuação",
  "results.best": "Melhor: {score}",
  "results.newBest": "Novo recorde!",
  "results.thanks": "Obrigado por jogar!",
  "results.failed": "Falhou",
  "results.rank": "Posição {rank}",
  "results.through": "{percent}% concluído",
  "results.tryAgain": "Tentar novamente",
  "results.share": "Compartilhar",
  "results.copied": "Copiado!",
  "results.changeSong": "Trocar de música",
  "results.close": "Fechar resultados",
  "results.saving": "Salvando no placar…",
  "results.saved": "Salvo no placar",
  "results.savedRank": "Salvo no placar — #{rank}",
  "results.invalid": "Salvo como não verificado ({reason}).",
  "invalid.nonce": "token de partida inválido",
  "invalid.checksum": "gravação inconsistente",
  "invalid.timeline": "gravação malformada",
  "invalid.track": "música desconhecida",
  "invalid.unscorable": "partida não pontuável",
  "results.signedOut": "Entre para salvar suas pontuações no placar.",
  "results.saveError": "Não foi possível salvar no placar.",
  "results.failScore": "Sua pontuação ficou negativa.",
  "results.failMistake": "Você cometeu um erro.",
  "results.failStreak": "Você errou 20 seguidos.",
  "results.ariaResults": "Resultados",
  "results.ariaRunOver": "Fim da partida",

  // The results metric grid. The engines emit these English labels and values;
  // `src/i18n/labels.ts` maps them back to keys.
  "metric.difficulty": "dificuldade",
  "metric.runMode": "modo de partida",
  "metric.speed": "velocidade",
  "metric.replays": "repetições",
  "metric.song": "música",
  "metric.artist": "artista",
  "metric.time": "tempo",
  "metric.pitchAccuracy": "precisão de afinação",
  "metric.notes": "notas",
  "metric.perfectNotes": "notas perfeitas",
  "metric.bestCombo": "melhor combo",
  "metric.accuracy": "precisão",
  "metric.perfectHits": "acertos perfeitos",
  "metric.perfectLines": "linhas perfeitas",
  "metric.words": "palavras",
  "metric.wrongKeys": "teclas erradas",
  "metric.wpm": "wpm",

  // Track picker
  "picker.pasteLabel": "Cole um link do YouTube ou uma URL do UltraStar",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  ou  …/song.txt",
  "picker.play": "Jogar",
  "picker.note":
    "Um link do YouTube é tocado a partir das legendas; um link para um gráfico .txt do UltraStar é buscado e seu áudio é transmitido do próprio servidor de origem. Links de blob do GitHub são convertidos para raw automaticamente.",
  "picker.invalidInput":
    "Isso não parece um link do YouTube nem uma URL de .txt do UltraStar.",
  "picker.localHeading": "Neste dispositivo",
  "picker.localAria": "Arquivos locais",
  "picker.localNote":
    "Jogue músicas que você já tem. Escolha uma pasta de gráficos do UltraStar ou vídeos com legendas .vtt correspondentes — nada é enviado.",
  "picker.openLocal": "Abrir arquivos locais",
  "picker.unsupported":
    "A reprodução local não está disponível neste navegador — ela precisa da File System Access API. Tente Chrome, Edge ou Brave para jogar arquivos locais.",
  "picker.checking": "Verificando este navegador…",
  "picker.featured": "Destaques",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "Jogador",
  "leaderboard.score": "Pontuação",
  "leaderboard.accuracy": "Precisão",
  "leaderboard.combo": "Combo",
  "leaderboard.empty": "Ainda não há pontuações — seja o primeiro.",
  "leaderboard.emptySing": "Ainda não há canto pontuado.",
  "score.song": "Música",
  "score.mode": "Modo",
  "score.when": "Quando",
  "time.justNow": "agora mesmo",
  "time.minutesAgo": "há {count} min",
  "time.hoursAgo": "há {count} h",
  "time.daysAgo": "há {count} d",
  "profile.comment": "perfil",
  "profile.title": "Perfil do jogador",
  "profile.lede": "Pontuações, recordes e partidas recentes.",
  "profile.missing": "Nenhum jogador com esse nome de usuário.",
  "profile.player": "Jogador",
  "profile.anonymous": "jogador",
  "profile.joined": " · entrou em {date}",
  "profile.plays": "partidas",
  "profile.songs": "músicas",
  "profile.best": "melhor",
  "profile.bestHeading": "Melhores pontuações",
  "profile.recentHeading": "Recentes",
  "profile.noBests": "Ainda não há pontuações verificadas.",
  "profile.nothing": "Nada ainda.",
  "recent.title": "Jogadas recentemente",
  "recent.lede": "As últimas pontuações verificadas. Entre e jogue para adicionar a sua.",
  "recent.empty": "Ainda não há pontuações — jogue uma música e seja o primeiro do placar.",
  "recent.loading": "Carregando pontuações recentes…",
  "challenge.title": "Desafio diário e semanal",
  "challenge.lede":
    "Uma música por período, com placares próprios de digitação e de canto. Igual para todos, e muda sozinho.",
  "challenge.daily": "Diário",
  "challenge.weekly": "Semanal",
  "challenge.playTyping": "Jogar digitando",
  "challenge.playSinging": "Jogar cantando",
  "challenge.typingBoard": "Placar de digitação",
  "challenge.singingBoard": "Placar de canto",
  "challenge.loading": "Carregando desafios…",
  "challenge.error": "Não foi possível carregar o desafio.",
  "challenge.previousHeading": "Período anterior",
  "challenge.finished": "Encerrado",
  "challenge.periodRange": "{start} – {end}",
  "challenge.pastEmpty": "Nenhuma pontuação neste período.",

  // Local library
  "local.readFailed": "Não foi possível ler essas pastas.",
  "local.unsupported": "Este navegador não consegue abrir pastas.",
  "local.openFailed": "Não foi possível abrir a pasta.",
  "local.reopenFailed": "Não foi possível reabrir as pastas.",
  "local.videoDescription": "Vídeo local — {name}",
  "local.ultrastarDescription": "UltraStar — {artist}",
  "local.noTimedLyrics": "Nenhuma letra sincronizada foi encontrada em {file}.",
  "local.noLyrics": "Nenhuma letra foi encontrada em {file}.",
  "local.videoLoadFailed": "Não foi possível carregar esse par de vídeo e legenda.",
  "local.songLoadFailed": "Não foi possível carregar essa música do UltraStar.",
  "local.folderCount": "{count} pastas",
  "local.foldersAria": "Pastas: {names}",
  "local.noSongs": "nenhuma música",
  "local.oneSong": "1 música",
  "local.songCount": "{count} músicas",
  "local.searchPlaceholder": "Buscar músicas…",
  "local.searchAria": "Buscar músicas locais",
  "local.addFolder": "Adicionar outra pasta",
  "local.reopenOne": "Reabrir {name}",
  "local.reopenMany": "Reabrir pastas",
  "local.missing":
    "Não foi possível encontrar {file} nessas pastas. Pode ter sido movido, ou uma pasta precisa ser reaberta.",
  "local.blockedOne":
    "“{name}” precisa de permissão antes que suas músicas possam ser exibidas.",
  "local.blockedMany":
    "{count} pastas precisam de permissão antes que suas músicas possam ser exibidas.",
  "local.nothingFound":
    "Nada jogável foi encontrado. O TypeStar lê gráficos do UltraStar (#MP3 mais letra sincronizada) e vídeos com uma legenda .vtt de mesmo nome — por exemplo, song.mp4 e song.vtt.",
  "local.noMatch": "Nenhuma música corresponde a “{query}”.",
  "local.badgeVideo": "Vídeo",
  "local.badgeLyrics": "Letra",
  "local.groupVideo": "Vídeo + legendas",
  "local.footIntro": "Esta página é composta por",
  "local.footOutro": ". Para remover uma pasta, clique no nome dela.",
  "local.listAnd": " e ",
  "local.removeFolder": "Remover {name}",
  "local.youtubeDesc": "Escolha uma música em destaque ou cole um link do YouTube.",
  "local.chooseFolder": "Escolher uma pasta",
  "local.chooseFolderDesc":
    "Jogue músicas do UltraStar, ou vídeos com legendas .vtt correspondentes, deste dispositivo. Nada é enviado.",
  "local.scanning": "Escaneando pastas…",
  "local.reading": "Lendo música…",

  // Site copy
  "site.tagline": "Um jogo de música que você joga com o teclado, a voz e muito mais",
  "site.description":
    "Um jogo de digitação rítmica. O YouTube fornece a música e as imagens, e você digita a letra conforme as palavras chegam — um pouco como o Guitar Hero para o seu teclado.",
  "common.skipToContent": "Pular para o conteúdo",
  "seo.ogAlt": "{name} — um bloco amarelo “TS” ao lado do título sobre um fundo escuro de caderno",
  "seo.requiresJs": "Requer JavaScript",
  "seo.sitemap": "Mapa do site",
  "privacy.updated": "Atualizado pela última vez em {date}",
  "privacy.banner":
    "Esta política foi traduzida para sua conveniência. A versão em inglês é a fonte oficial — se houver qualquer divergência, vale o texto em inglês.",
  "privacy.bannerLink": "Ler a política em inglês",

  // Game status (island)
  "game.loadingTrack": "Carregando música…",
  "game.fetchingCaptions": "Buscando as legendas e marcando o tempo das palavras.",
  "game.noTrack": "Nenhuma música para jogar",
  "game.tryAnother": "Tentar outra música",
  "game.humanCheckComment": "música nova",
  "game.humanCheckTitle": "Verificação humana rápida",
  "game.humanCheckBody":
    "Esta música ainda não está na biblioteca, então só precisamos confirmar que você é humano antes de buscá-la. Isso só acontece uma vez por música.",
  "game.humanCheckFailed":
    "Não foi possível concluir a verificação humana. Tente novamente mais tarde.",
  "game.loadError": "Algo deu errado ao carregar esta música.",
  "trackError.network": "Não foi possível alcançar o serviço de músicas.",
  "trackError.noCaptions": "Este vídeo não tem legendas, então não há nada para digitar.",
  "trackError.badVideoId": "Esse id de vídeo parece errado.",
  "trackError.badUrl": "Essa URL de música não pode ser usada.",
  "trackError.noLyrics": "Esse chart do UltraStar não tem letras para jogar.",
  "trackError.noAudio": "Esse chart do UltraStar não indica nenhum arquivo de áudio.",
  "trackError.notFound": "Esse arquivo de música não foi encontrado.",
  "trackError.tooLarge": "Esse arquivo de música é grande demais.",
  "trackError.humanCheck": "Conclua a verificação rápida para carregar esta música nova.",
  "trackError.generic": "Não foi possível carregar esta música.",
  "trackError.unreadable": "Os dados da música não puderam ser lidos.",
  "game.embedNoSong": "Esta incorporação precisa de uma música na URL.",
  "game.paused": "Pausado",
  "game.typeLyricsAria": "Digite a letra",
  "game.perfectLine": "Linha perfeita!",
  "game.combo": "Combo de {count}!",
  "game.localTitle": "Jogar deste dispositivo",
  "game.localSubtitle":
    "Aponte o TypeStar para uma pasta de músicas. Ele lê gráficos do UltraStar (.txt) e vídeos com uma legenda .vtt de mesmo nome. Nada é enviado, e a pasta permanece na sua máquina.",
  "game.localMediaError":
    "Não foi possível reproduzir este arquivo. Talvez o navegador não ofereça suporte ao formato.",
  "game.remoteMediaError":
    "Não foi possível carregar a mídia desta música a partir da origem.",

  // The media layer
  "player.loading": "carregando o player",
  "player.unavailable": "Vídeo indisponível",
  "player.startFailed": "O player não conseguiu iniciar este vídeo.",
  "player.errInvalidId": "Esse id de vídeo não é válido.",
  "player.errEmbedded": "Este vídeo não pode ser reproduzido no player incorporado.",
  "player.errPrivate": "Este vídeo é privado ou foi removido.",
  "player.errNotEmbeddable": "O proprietário não permite que este vídeo seja incorporado.",

  // The intro cue
  "cue.firstWord": "primeira palavra em {seconds}s",
  "cue.nextWord": "próxima palavra em {seconds}s",
  "cue.skip": "Pular",

  // Microphone
  "mic.declined":
    "O acesso ao microfone foi negado, então a afinação não pode ser pontuada.",
  "mic.failed": "Não foi possível iniciar o microfone.",
  "mic.live": "microfone ativo",
  "mic.preparing": "preparando o microfone…",
  "mic.unavailable": "Microfone indisponível — cantando junto sem pontuação.",

  // Sign-in and account
  "signin.comment": "entrar",
  "signin.title": "Entrar",
  "signin.lede":
    "O TypeStar usa um link de uso único em vez de senha. Informe seu e-mail, abra o link que enviarmos e você estará dentro.",
  "signin.formTitle": "Entrar com um link",
  "signin.formBody":
    "Informe seu e-mail e enviaremos um link de acesso de uso único. Nada de senha para lembrar, e nenhuma conta existe até você usar o link.",
  "signin.emailLabel": "Endereço de e-mail",
  "signin.submit": "Enviar um link de acesso por e-mail",
  "signin.sending": "Enviando…",
  "signin.invalidEmail": "Informe um endereço de e-mail válido.",
  "signin.needCheck": "Conclua a verificação humana.",
  "signin.sendFailed": "Não foi possível enviar o link. Tente novamente.",
  "signin.sentComment": "verifique sua caixa de entrada",
  "signin.sentTitle": "Link enviado",
  "signin.sentBody":
    "Enviamos um link de acesso de uso único para {email}. Abra-o neste navegador para concluir a entrada. O link expira em 15 minutos e só pode ser usado uma vez.",
  "signin.nothing": "Não chegou nada? Verifique a pasta de spam ou",
  "signin.tryAgain": "tente novamente",
  "account.comment": "conta",
  "account.title": "Conta",
  "account.lede": "Seu e-mail, seu nome público e sua sessão.",
  "account.loading": "Carregando sua conta…",
  "account.signedOutTitle": "Você não está conectado",
  "account.signedOutBody":
    "Entre com um link de e-mail de uso único para manter suas pontuações e configurações em todos os dispositivos.",
  "account.signIn": "Entrar",
  "account.signedInTitle": "Conectado",
  "account.email": "E-mail",
  "account.memberSince": "Membro desde",
  "account.handleLabel": "Nome de usuário",
  "account.handleHint":
    "Seu nome público nos placares. Letras minúsculas, números e sublinhados, de 3 a 20 caracteres.",
  "account.handlePlaceholder": "ex.: type_star",
  "account.save": "Salvar",
  "account.saving": "Salvando…",
  "account.saved": "Nome de usuário salvo.",
  "account.signOut": "Sair",
  "account.deleteAccount": "Excluir conta",
  "account.deleteConfirm": "Excluir sua conta e todos os seus dados?",
  "account.deleteYes": "Sim, excluir",
  "account.cancel": "Cancelar",
  "account.handleInvalid": "Esse nome de usuário não pode ser usado.",
  "account.handleTaken": "Esse nome de usuário já está em uso ou é inválido. Tente novamente.",
  "account.deleteFailed": "Não foi possível excluir a conta.",
  "handle.empty": "Escolha um nome de usuário.",
  "handle.length": "O nome de usuário tem {min}–{max} caracteres.",
  "handle.charset":
    "Use apenas letras minúsculas, números e sublinhados, começando e terminando com uma letra ou número.",
  "handle.reserved": "Esse nome de usuário é reservado.",

  // The magic-link sign-in email
  "email.subject": "Seu link de acesso do TypeStar",
  "email.comment": "entrar",
  "email.heading": "Entrar no TypeStar",
  "email.body":
    "Abra o link abaixo para concluir a entrada. Ele funciona uma vez e expira em {minutes} minutos.",
  "email.button": "Entrar",
  "email.paste": "Ou cole isto no seu navegador:",
  "email.ignore": "Se você não pediu para entrar, pode ignorar este e-mail sem problemas.",
  "email.textBody": "Abra este link para concluir a entrada:",
  "email.textExpiry": "O link funciona uma vez e expira em {minutes} minutos.",
  "email.signoff": "— TypeStar",

  // Embed
  "embed.button": "Incorporar",
  "embed.copied": "Copiado!",

  // Turnstile
  "turnstile.failed": "A verificação humana falhou. Tente novamente.",
  "turnstile.expired": "A verificação humana expirou. Tente novamente.",
  "turnstile.loadError": "Não foi possível carregar a verificação humana.",
};
