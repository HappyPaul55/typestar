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
  "results.rank": "Posição {rank}",
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
  "results.failScore": "Sua pontuação ficou negativa.",
  "results.failMistake": "Você cometeu um erro.",
  "results.failStreak": "Você errou 20 seguidas.",

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

  // Site copy
  "site.tagline": "Digite a letra no ritmo",
  "site.description":
    "Um jogo de digitação rítmica. O YouTube fornece a música e os visuais, e você digita a letra conforme as palavras chegam — um pouco como Guitar Hero para o seu teclado.",
  "common.skipToContent": "Pular para o conteúdo",
  "seo.ogAlt":
    "{name} — um bloco “TS” amarelo ao lado do título num fundo de caderno escuro",
  "seo.requiresJs": "Requer JavaScript",
  "privacy.updated": "Última atualização em {date}",
  "privacy.banner":
    "Esta política foi traduzida para sua conveniência. A versão em inglês é a fonte de referência — se houver qualquer divergência, o texto em inglês prevalece.",
  "privacy.bannerLink": "Ler a política em inglês",

  // Game status (island)
  "game.loadingTrack": "Carregando música…",
  "game.fetchingCaptions": "Buscando as legendas e marcando o tempo das palavras.",
  "game.noTrack": "Nenhuma música para tocar",
  "game.tryAnother": "Tentar outra música",
  "game.humanCheckComment": "música nova",
  "game.humanCheckTitle": "Verificação humana rápida",
  "game.humanCheckBody":
    "Esta música ainda não está na biblioteca, então só precisamos confirmar que você é humano antes de buscá-la. Isso acontece apenas uma vez por música.",
  "game.humanCheckFailed":
    "Não foi possível concluir a verificação humana. Tente de novo mais tarde.",
  "game.loadError": "Algo deu errado ao carregar esta música.",
  "game.embedNoSong": "Esta incorporação precisa de uma música na URL.",

  // Sign-in and account
  "signin.comment": "entrar",
  "signin.title": "Entrar",
  "signin.lede":
    "O TypeStar usa um link de uso único em vez de senha. Digite seu e-mail, abra o link que enviarmos e pronto.",
  "signin.formTitle": "Entrar com um link",
  "signin.formBody":
    "Digite seu e-mail e enviaremos um link de acesso de uso único. Nada de senha para lembrar, e nenhuma conta existe até você usar o link.",
  "signin.emailLabel": "Endereço de e-mail",
  "signin.submit": "Enviar link de acesso por e-mail",
  "signin.sending": "Enviando…",
  "signin.invalidEmail": "Digite um endereço de e-mail válido.",
  "signin.needCheck": "Conclua a verificação humana.",
  "signin.sendFailed": "Não foi possível enviar o link. Tente de novo.",
  "signin.sentComment": "confira sua caixa de entrada",
  "signin.sentTitle": "Link enviado",
  "signin.sentBody":
    "Enviamos um link de acesso de uso único para {email}. Abra-o neste navegador para concluir a entrada. O link expira em 15 minutos e só pode ser usado uma vez.",
  "signin.nothing": "Não chegou nada? Confira a pasta de spam ou",
  "signin.tryAgain": "tente de novo",
  "account.comment": "conta",
  "account.title": "Conta",
  "account.lede": "Seu e-mail, seu apelido público e sua sessão.",
  "account.loading": "Carregando sua conta…",
  "account.signedOutTitle": "Você não está conectado",
  "account.signedOutBody":
    "Entre com um link de e-mail de uso único para manter suas pontuações e configurações entre dispositivos.",
  "account.signIn": "Entrar",
  "account.signedInTitle": "Conectado",
  "account.email": "E-mail",
  "account.memberSince": "Membro desde",
  "account.handleLabel": "Apelido",
  "account.handleHint":
    "Seu nome público nos placares. Letras minúsculas, números e sublinhados, de 3 a 20 caracteres.",
  "account.save": "Salvar",
  "account.saving": "Salvando…",
  "account.saved": "Apelido salvo.",
  "account.signOut": "Sair",
  "account.deleteAccount": "Excluir conta",
  "account.deleteConfirm": "Excluir sua conta e todos os seus dados?",
  "account.deleteYes": "Sim, excluir",
  "account.cancel": "Cancelar",

  // Embed
  "embed.button": "Incorporar",
  "embed.copied": "Copiado!",

  // Turnstile
  "turnstile.failed": "A verificação humana falhou. Tente de novo.",
  "turnstile.expired": "A verificação humana expirou. Tente de novo.",
  "turnstile.loadError": "Não foi possível carregar a verificação humana.",
};
