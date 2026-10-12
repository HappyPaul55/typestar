import type { MessageKey } from "./en";

/** Brazilian Portuguese — machine-translated; pending human review. */
export const ptBR: Partial<Record<MessageKey, string>> = {
  // Shared
  "common.loading": "Carregando…",
  "common.retry": "Tentar de novo",
  "common.close": "Fechar",

  // Navigation and footer
  "nav.primary": "Principal",
  "nav.menu": "Menu",
  "nav.play": "Jogar",
  "nav.privacy": "Privacidade",
  "nav.challenge": "Desafio",
  "nav.recent": "Recentes",
  "nav.account": "Conta",
  "nav.language": "Idioma",
  "footer.pages": "Páginas",
  "footer.elsewhere": "Em outros lugares",
  "footer.source": "Código-fonte",
  "footer.licence": "Licença {licence}",
  "footer.private": "// sem contas, sem cookies, sem rastreadores",

  // Landing
  "home.comment": "digitação rítmica",
  "home.titleBefore": "Digite a letra",
  "home.titleMark": "no ritmo",
  "home.titleAfter": ".",
  "home.howComment": "como funciona",
  "home.step1Title": "Escolha uma música",
  "home.step1Body":
    "Cole um link do YouTube ou comece pela lista de destaques. O TypeStar lê as legendas e marca o tempo de cada palavra.",
  "home.step2Title": "Digite no ritmo",
  "home.step2Body":
    "As palavras acendem conforme chegam. Digite cada uma antes que o momento passe — como Guitar Hero, para o seu teclado.",
  "home.step3Title": "Corra atrás da pontuação",
  "home.step3Body":
    "Sequências aumentam o multiplicador e linhas perfeitas rendem bônus. Três dificuldades, quatro modos de jogo, partidas sem fim.",

  // 404
  "notFound.comment": "404 · não encontrado",
  "notFound.titleBefore": "Esta música não",
  "notFound.titleMark": "carregou",
  "notFound.titleAfter": ".",
  "notFound.body":
    "O link pode estar quebrado ou a página foi movida. Volte para o início ou entre direto no jogo.",
  "notFound.home": "Voltar ao início",
  "notFound.play": "Jogar uma partida",

  // Play page
  "play.crumb": "jogar",
  "play.localCrumb": "local",
  "play.subtitle":
    "{tagline} — o YouTube fornece a música e os visuais; você digita a letra conforme as palavras chegam.",
  "play.ratingComment": "avaliação",
  "play.ratingTitle":
    "O quão difícil é digitar a letra, avaliado pelas palavras por segundo da música",
  "play.embed": "Incorporar",
  "play.embedCopied": "Copiado!",

  // Start screen
  "start.ready": "pronto",
  "start.titleType": "Digite as palavras no ritmo.",
  "start.titleSing": "Cante junto.",
  "start.start": "Começar",
  "start.styleGroup": "Estilo de jogo",

  // HUD
  "hud.score": "pontos",
  "hud.combo": "combo",
  "hud.accuracy": "precisão",
  "hud.pause": "Pausar",
  "hud.resume": "Retomar",
  "hud.reset": "Reiniciar",
  "hud.difficulty": "Dificuldade",
  "hud.runMode": "Modo de jogo",
  "hud.speed": "Velocidade de reprodução",
  "hud.sync": "Ajuste de sincronia",
  "hud.fullscreen": "Tela cheia",
  "hud.goFullscreen": "Entrar em tela cheia",
  "hud.changeSong": "Trocar música",

  // Calibration
  "calibration.comment": "sincronia",
  "calibration.help":
    "Se as palavras adiantarem em relação à música, atrase-as. Se atrasarem, adiante-as.",
  "calibration.offset": "ajuste",
  "calibration.reset": "Reiniciar",
  "calibration.done": "Pronto",

  // Results
  "results.results": "resultados",
  "results.runOver": "fim da partida",
  "results.karaoke": "karaokê",
  "results.score": "pontos",
  "results.best": "Melhor: {score}",
  "results.newBest": "Novo recorde!",
  "results.thanks": "Obrigado por jogar!",
  "results.failed": "Falhou",
  "results.through": "{percent}% concluído",
  "results.tryAgain": "Tentar de novo",
  "results.share": "Compartilhar",
  "results.copied": "Copiado!",
  "results.changeSong": "Trocar música",
  "results.close": "Fechar resultados",
  "results.saving": "Salvando no placar…",
  "results.saved": "Salvo no placar",
  "results.savedRank": "Salvo no placar — #{rank}",
  "results.invalid": "Salvo como não verificado ({reason}).",
  "results.signedOut": "Entre na sua conta para salvar suas pontuações no placar.",
  "results.saveError": "Não foi possível salvar no placar.",

  // Track picker
  "picker.pasteLabel": "Cole um link do YouTube ou uma URL do UltraStar",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  ou  …/song.txt",
  "picker.play": "Jogar",
  "picker.note":
    "Um link do YouTube toca a partir das suas legendas; um link para um arquivo .txt do UltraStar é buscado e o áudio é transmitido pelo próprio host de origem. Links blob do GitHub são convertidos para raw automaticamente.",
  "picker.localHeading": "Neste dispositivo",
  "picker.localNote":
    "Toque músicas que você já tem. Escolha uma pasta de arquivos UltraStar ou de vídeos com legendas .vtt correspondentes — nada é enviado.",
  "picker.openLocal": "Abrir arquivos locais",
  "picker.unsupported":
    "A reprodução local não está disponível neste navegador — ela precisa da File System Access API. Tente Chrome, Edge ou Brave para tocar arquivos locais.",
  "picker.checking": "Verificando este navegador…",
  "picker.featured": "Destaques",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "Jogador",
  "leaderboard.score": "Pontos",
  "leaderboard.accuracy": "Precisão",
  "leaderboard.combo": "Combo",
  "leaderboard.empty": "Ainda sem pontuações — seja o primeiro.",
  "leaderboard.emptySing": "Ainda sem pontuações de canto.",
  "score.song": "Música",
  "score.mode": "Modo",
  "score.when": "Quando",
  "profile.comment": "perfil",
  "profile.title": "Perfil do jogador",
  "profile.lede": "Pontuações, recordes e partidas recentes.",
  "profile.missing": "Nenhum jogador com esse apelido.",
  "profile.plays": "partidas",
  "profile.songs": "músicas",
  "profile.best": "recorde",
  "profile.bestHeading": "Melhores pontuações",
  "profile.recentHeading": "Recentes",
  "profile.noBests": "Ainda sem pontuações verificadas.",
  "profile.nothing": "Nada por aqui ainda.",
  "recent.title": "Jogadas recentemente",
  "recent.lede":
    "As pontuações verificadas mais recentes. Entre na sua conta e jogue para adicionar a sua.",
  "recent.empty": "Ainda sem pontuações — toque uma música e seja o primeiro no placar.",
  "recent.loading": "Carregando pontuações recentes…",
  "challenge.title": "Desafio diário e semanal",
  "challenge.lede":
    "Uma música e um modificador por período, com placares próprios de digitação e de canto. Igual para todo mundo, e muda sozinho.",
  "challenge.daily": "Diário",
  "challenge.weekly": "Semanal",
  "challenge.playTyping": "Jogar digitando",
  "challenge.playSinging": "Jogar cantando",
  "challenge.typingBoard": "Placar de digitação",
  "challenge.singingBoard": "Placar de canto",
  "challenge.loading": "Carregando desafios…",
  "challenge.error": "Não foi possível carregar o desafio.",
};
