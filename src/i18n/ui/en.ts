/**
 * The English UI dictionary — the source of truth.
 *
 * Every other locale is a partial overlay on this: a missing key falls back to
 * English, so a half-finished translation still reads sensibly. Keys are dotted
 * by area. `{name}` placeholders are filled by `t()`.
 *
 * Machine translations live alongside (`de.ts`, `fr.ts`, …) and are expected to
 * be reviewed by a human later.
 */

export const en = {
  // Shared
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.close": "Close",

  // Navigation and footer
  "nav.primary": "Primary",
  "nav.menu": "Menu",
  "nav.play": "Play",
  "nav.privacy": "Privacy",
  "nav.challenge": "Challenge",
  "nav.recent": "Recent",
  "nav.account": "Account",
  "nav.language": "Language",
  "footer.pages": "Pages",
  "footer.elsewhere": "Elsewhere",
  "footer.source": "Source",
  "footer.licence": "{licence} licence",
  "footer.private": "// no accounts, no cookies, no trackers",

  // Landing
  "home.comment": "rhythm typing",
  "home.titleBefore": "Type the lyrics",
  "home.titleMark": "in time",
  "home.titleAfter": ".",
  "home.howComment": "how it works",
  "home.step1Title": "Pick a track",
  "home.step1Body":
    "Paste a YouTube link, or start from the featured list. TypeStar reads the captions and times every word.",
  "home.step2Title": "Type to the beat",
  "home.step2Body":
    "Words light up as they arrive. Type each one before its moment passes — like Guitar Hero, for your keyboard.",
  "home.step3Title": "Chase the score",
  "home.step3Body":
    "Chains build a multiplier and clean lines pay a bonus. Three difficulties, four run modes, endless replays.",

  // 404
  "notFound.comment": "404 · not found",
  "notFound.titleBefore": "This track didn't",
  "notFound.titleMark": "load",
  "notFound.titleAfter": ".",
  "notFound.body":
    "The link may be broken, or the page has moved. Head back home, or jump straight into the game.",
  "notFound.home": "Back to home",
  "notFound.play": "Play a game",

  // Play page
  "play.crumb": "play",
  "play.localCrumb": "local",
  "play.subtitle":
    "{tagline} — YouTube supplies the music and visuals; you type the lyrics as the words arrive.",
  "play.ratingComment": "rating",
  "play.ratingTitle":
    "How hard the lyrics are to type, rated from the song's words per second",
  "play.embed": "Embed",
  "play.embedCopied": "Copied!",

  // Start screen
  "start.ready": "ready",
  "start.titleType": "Type the words in time.",
  "start.titleSing": "Sing along.",
  "start.start": "Start",
  "start.styleGroup": "Play style",

  // HUD
  "hud.score": "score",
  "hud.combo": "combo",
  "hud.accuracy": "accuracy",
  "hud.pause": "Pause",
  "hud.resume": "Resume",
  "hud.reset": "Reset",
  "hud.difficulty": "Difficulty",
  "hud.runMode": "Run mode",
  "hud.speed": "Playback speed",
  "hud.sync": "Sync offset",
  "hud.fullscreen": "Fullscreen",
  "hud.goFullscreen": "Go fullscreen",
  "hud.changeSong": "Change song",

  // Calibration
  "calibration.comment": "sync",
  "calibration.help":
    "If the words run ahead of the music, nudge them later. If they lag, nudge them earlier.",
  "calibration.offset": "offset",
  "calibration.reset": "Reset",
  "calibration.done": "Done",

  // Results
  "results.results": "results",
  "results.runOver": "run over",
  "results.karaoke": "karaoke",
  "results.score": "score",
  "results.best": "Best {score}",
  "results.newBest": "New best!",
  "results.thanks": "Thanks for playing!",
  "results.failed": "Failed",
  "results.rank": "Rank {rank}",
  "results.through": "{percent}% through",
  "results.tryAgain": "Try Again",
  "results.share": "Share",
  "results.copied": "Copied!",
  "results.changeSong": "Change song",
  "results.close": "Close results",
  "results.saving": "Saving to the leaderboard…",
  "results.saved": "Saved to the leaderboard",
  "results.savedRank": "Saved to the leaderboard — #{rank}",
  "results.invalid": "Saved as unverified ({reason}).",
  "results.signedOut": "Sign in to save your scores to the leaderboard.",
  "results.saveError": "Could not save to the leaderboard.",
  "results.failScore": "Your score went negative.",
  "results.failMistake": "You made a mistake.",
  "results.failStreak": "You missed 20 in a row.",

  // Track picker
  "picker.pasteLabel": "Paste a YouTube link or an UltraStar URL",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  or  …/song.txt",
  "picker.play": "Play",
  "picker.note":
    "A YouTube link is played from its captions; a link to an UltraStar .txt chart is fetched and its audio streamed from its own host. GitHub blob links are converted to raw automatically.",
  "picker.localHeading": "On this device",
  "picker.localNote":
    "Play songs you already have. Pick a folder of UltraStar charts or videos with matching .vtt captions — nothing is uploaded.",
  "picker.openLocal": "Open local files",
  "picker.unsupported":
    "Local playback isn't available in this browser — it needs the File System Access API. Try Chrome, Edge or Brave to play local files.",
  "picker.checking": "Checking this browser…",
  "picker.featured": "Featured",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "Player",
  "leaderboard.score": "Score",
  "leaderboard.accuracy": "Accuracy",
  "leaderboard.combo": "Combo",
  "leaderboard.empty": "No scores yet — be the first.",
  "leaderboard.emptySing": "No scored singing yet.",
  "score.song": "Song",
  "score.mode": "Mode",
  "score.when": "When",
  "profile.comment": "profile",
  "profile.title": "Player profile",
  "profile.lede": "Scores, bests and recent runs.",
  "profile.missing": "No player with that handle.",
  "profile.plays": "plays",
  "profile.songs": "songs",
  "profile.best": "best",
  "profile.bestHeading": "Best scores",
  "profile.recentHeading": "Recent",
  "profile.noBests": "No verified scores yet.",
  "profile.nothing": "Nothing yet.",
  "recent.title": "Recently played",
  "recent.lede": "The latest verified scores. Sign in and play to add yours.",
  "recent.empty": "No scores yet — play a song and be the first on the board.",
  "recent.loading": "Loading recent scores…",
  "challenge.title": "Daily & weekly challenge",
  "challenge.lede":
    "One song and one modifier per period, with its own typing and singing boards. The same for everyone, and it changes on its own.",
  "challenge.daily": "Daily",
  "challenge.weekly": "Weekly",
  "challenge.playTyping": "Play typing",
  "challenge.playSinging": "Play singing",
  "challenge.typingBoard": "Typing board",
  "challenge.singingBoard": "Singing board",
  "challenge.loading": "Loading challenges…",
  "challenge.error": "The challenge could not be loaded.",

  // Site copy
  "site.tagline": "A music game you play with your keyboard, your voice, and more",
  "site.description":
    "A rhythm touch-typing game. YouTube supplies the music and visuals, and you type the lyrics as the words arrive — a bit like Guitar Hero for your keyboard.",
  "common.skipToContent": "Skip to content",
  "seo.ogAlt": "{name} — a yellow “TS” tile beside the title on a dark notebook background",
  "seo.requiresJs": "Requires JavaScript",
  "privacy.updated": "Last updated {date}",
  "privacy.banner":
    "This policy has been translated for your convenience. The English version is the source of truth — if anything differs, the English text applies.",
  "privacy.bannerLink": "Read the English policy",

  // Game status (island)
  "game.loadingTrack": "Loading track…",
  "game.fetchingCaptions": "Fetching the captions and timing the words.",
  "game.noTrack": "No track to play",
  "game.tryAnother": "Try another song",
  "game.humanCheckComment": "new song",
  "game.humanCheckTitle": "Quick human check",
  "game.humanCheckBody":
    "This song isn't in the library yet, so we just need to check you're human before fetching it. It only ever happens once per song.",
  "game.humanCheckFailed":
    "The human check could not be completed. Please try again later.",
  "game.loadError": "Something went wrong loading this track.",
  "game.embedNoSong": "This embed needs a song in its URL.",

  // Sign-in and account
  "signin.comment": "sign in",
  "signin.title": "Sign in",
  "signin.lede":
    "TypeStar uses a one-time link instead of a password. Enter your email, open the link we send, and you're in.",
  "signin.formTitle": "Sign in with a link",
  "signin.formBody":
    "Enter your email and we'll send a one-time sign-in link. No password to remember, and no account exists until you use the link.",
  "signin.emailLabel": "Email address",
  "signin.submit": "Email me a sign-in link",
  "signin.sending": "Sending…",
  "signin.invalidEmail": "Enter a valid email address.",
  "signin.needCheck": "Please complete the human check.",
  "signin.sendFailed": "Could not send the link. Please try again.",
  "signin.sentComment": "check your inbox",
  "signin.sentTitle": "Link sent",
  "signin.sentBody":
    "We sent a one-time sign-in link to {email}. Open it in this browser to finish signing in. The link expires in 15 minutes and can only be used once.",
  "signin.nothing": "Nothing arrived? Check your spam folder, or",
  "signin.tryAgain": "try again",
  "account.comment": "account",
  "account.title": "Account",
  "account.lede": "Your email, your public handle and your session.",
  "account.loading": "Loading your account…",
  "account.signedOutTitle": "You're not signed in",
  "account.signedOutBody":
    "Sign in with a one-time email link to keep your scores and settings across devices.",
  "account.signIn": "Sign in",
  "account.signedInTitle": "Signed in",
  "account.email": "Email",
  "account.memberSince": "Member since",
  "account.handleLabel": "Handle",
  "account.handleHint":
    "Your public name on leaderboards. Lowercase letters, numbers and underscores, 3–20 characters.",
  "account.save": "Save",
  "account.saving": "Saving…",
  "account.saved": "Handle saved.",
  "account.signOut": "Sign out",
  "account.deleteAccount": "Delete account",
  "account.deleteConfirm": "Delete your account and all its data?",
  "account.deleteYes": "Yes, delete",
  "account.cancel": "Cancel",
  "account.handleInvalid": "That handle can’t be used.",
  "account.handleTaken": "That handle is taken or invalid. Please try again.",
  "account.deleteFailed": "Could not delete the account.",
  "handle.empty": "Choose a handle.",
  "handle.length": "A handle is {min}–{max} characters.",
  "handle.charset":
    "Use lowercase letters, numbers and underscores only, starting and ending with a letter or number.",
  "handle.reserved": "That handle is reserved.",

  // Embed
  "embed.button": "Embed",
  "embed.copied": "Copied!",

  // Turnstile
  "turnstile.failed": "The human check failed. Please try again.",
  "turnstile.expired": "The human check expired. Please try again.",
  "turnstile.loadError": "Could not load the human check.",
} as const;

export type MessageKey = keyof typeof en;
