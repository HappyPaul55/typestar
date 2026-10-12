import type { MessageKey } from "./en";

/** Japanese — machine-translated; pending human review. */
export const ja: Partial<Record<MessageKey, string>> = {
  // Shared
  "common.loading": "読み込み中…",
  "common.retry": "再試行",
  "common.close": "閉じる",

  // Navigation and footer
  "nav.primary": "メイン",
  "nav.menu": "メニュー",
  "nav.home": "ホーム",
  "nav.play": "プレイ",
  "nav.privacy": "プライバシー",
  "nav.challenge": "チャレンジ",
  "nav.recent": "最近",
  "nav.account": "アカウント",
  "nav.language": "言語",
  "nav.breadcrumb": "パンくずリスト",
  "footer.pages": "ページ",
  "footer.elsewhere": "その他",
  "footer.source": "ソース",
  "footer.licence": "{licence} ライセンス",
  "footer.private": "// アカウントなし、Cookieなし、トラッカーなし",
  "footer.nav": "フッター",

  // Landing
  "home.comment": "リズムタイピング",
  "home.titleBefore": "歌詞を",
  "home.titleMark": "時間どおりに",
  "home.titleAfter": "タイプ。",
  "home.howComment": "使い方",
  "home.step1Title": "曲を選ぶ",
  "home.step1Body":
    "YouTubeのリンクを貼るか、特集リストから始めましょう。TypeStarが字幕を読み取り、すべての単語にタイミングを合わせます。",
  "home.step2Title": "ビートに合わせてタイプ",
  "home.step2Body":
    "単語は届くたびに光ります。その瞬間が過ぎる前にタイプしましょう — キーボード版のGuitar Heroのように。",
  "home.step3Title": "スコアを追いかけろ",
  "home.step3Body":
    "連続で打つと倍率が上がり、ミスのない行にはボーナス。3つの難易度、4つのプレイモード、何度でも挑戦できます。",
  "home.heroAlt":
    "TypeStarのスクリーンショット：YouTubeの動画の横に歌詞ハイウェイが並び、1つの単語がハイライトされ、HUDにスコア、コンボ、正確さが表示されています。",

  // 404
  "notFound.comment": "404 · 見つかりません",
  "notFound.titleBefore": "この曲は",
  "notFound.titleMark": "読み込めませんでした",
  "notFound.titleAfter": "。",
  "notFound.body":
    "リンクが壊れているか、ページが移動した可能性があります。ホームに戻るか、そのままゲームを始めましょう。",
  "notFound.home": "ホームに戻る",
  "notFound.play": "ゲームをプレイ",

  // Play page
  "play.crumb": "プレイ",
  "play.localCrumb": "ローカル",
  "play.subtitle":
    "{tagline} — YouTubeが音楽と映像を提供し、単語が届くたびに歌詞をタイプします。",
  "play.ratingComment": "評価",
  "play.ratingTitle":
    "歌詞のタイプしやすさを、曲の1秒あたりの単語数から評価したもの",
  "play.embed": "埋め込み",
  "play.embedCopied": "コピーしました！",

  // Start screen
  "start.ready": "準備完了",
  "start.titleType": "時間どおりに単語をタイプ。",
  "start.titleSing": "一緒に歌おう。",
  "start.start": "スタート",
  "start.styleGroup": "プレイスタイル",
  "style.type": "タイプ",
  "style.sing": "歌唱",
  "style.helpType": "それぞれの単語が通り過ぎる前にタイプしましょう。",
  "style.helpSingScored": "音程が届くたびに当てましょう — ピッチが採点されます。",
  "style.helpSingKaraoke":
    "単語が届くたびに光ります — 一緒に歌いましょう。スコアは記録されません。",

  // HUD
  "hud.score": "スコア",
  "hud.combo": "コンボ",
  "hud.accuracy": "正確さ",
  "hud.pause": "一時停止",
  "hud.resume": "再開",
  "hud.reset": "リセット",
  "hud.difficulty": "難易度",
  "hud.runMode": "プレイモード",
  "hud.speed": "再生速度",
  "hud.sync": "同期オフセット",
  "hud.fullscreen": "全画面",
  "hud.goFullscreen": "全画面にする",
  "hud.changeSong": "曲を変更",
  "hud.syncShort": "同期",
  "hud.songShort": "曲",

  // Difficulty and run mode, shared by the game bar and the score pages
  "difficulty.easy": "簡単",
  "difficulty.normal": "普通",
  "difficulty.hard": "難しい",
  "run.normal": "ノーマル",
  "run.instant": "インスタント",
  "run.fun": "お楽しみ",
  "run.practise": "練習",
  "speed.normal": "標準",

  // Calibration
  "calibration.comment": "同期",
  "calibration.help":
    "歌詞が音楽より先行する場合は後ろに、遅れる場合は前にずらします。",
  "calibration.offset": "オフセット",
  "calibration.reset": "リセット",
  "calibration.done": "完了",

  // Results
  "results.results": "結果",
  "results.runOver": "プレイ終了",
  "results.karaoke": "カラオケ",
  "results.score": "スコア",
  "results.best": "ベスト {score}",
  "results.newBest": "自己ベスト！",
  "results.thanks": "プレイありがとう！",
  "results.failed": "失敗",
  "results.rank": "順位 {rank}",
  "results.through": "{percent}% 進行",
  "results.tryAgain": "もう一度",
  "results.share": "共有",
  "results.copied": "コピーしました！",
  "results.changeSong": "曲を変更",
  "results.close": "結果を閉じる",
  "results.saving": "リーダーボードに保存中…",
  "results.saved": "リーダーボードに保存しました",
  "results.savedRank": "リーダーボードに保存しました — #{rank}",
  "results.invalid": "未検証として保存しました（{reason}）。",
  "invalid.nonce": "実行トークンが不正",
  "invalid.checksum": "記録が一致しません",
  "invalid.timeline": "記録の形式が不正",
  "invalid.track": "不明な曲",
  "invalid.unscorable": "採点できない実行",
  "results.signedOut":
    "スコアをリーダーボードに保存するにはサインインしてください。",
  "results.saveError": "リーダーボードに保存できませんでした。",
  "results.failScore": "スコアがマイナスになりました。",
  "results.failMistake": "ミスをしました。",
  "results.failStreak": "20回連続でミスしました。",
  "results.ariaResults": "結果",
  "results.ariaRunOver": "プレイ終了",

  // The results metric grid. The engines emit these English labels and values;
  // `src/i18n/labels.ts` maps them back to keys.
  "metric.difficulty": "難易度",
  "metric.runMode": "モード",
  "metric.speed": "速度",
  "metric.replays": "リプレイ",
  "metric.song": "曲",
  "metric.artist": "アーティスト",
  "metric.time": "時間",
  "metric.pitchAccuracy": "ピッチ精度",
  "metric.notes": "音符",
  "metric.perfectNotes": "パーフェクト音符",
  "metric.bestCombo": "最高コンボ",
  "metric.accuracy": "正確さ",
  "metric.perfectHits": "パーフェクトヒット",
  "metric.perfectLines": "パーフェクト行",
  "metric.words": "単語",
  "metric.wrongKeys": "ミスキー",
  "metric.wpm": "WPM",

  // Track picker
  "picker.pasteLabel": "YouTubeのリンクまたはUltraStarのURLを貼り付け",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  または  …/song.txt",
  "picker.play": "プレイ",
  "picker.note":
    "YouTubeのリンクは字幕から再生されます。UltraStarの.txtチャートへのリンクは取得され、音声はそのホストから直接ストリーミングされます。GitHubのblobリンクは自動的にrawに変換されます。",
  "picker.invalidInput":
    "YouTubeのリンクまたはUltraStarの.txt URLではないようです。",
  "picker.localHeading": "このデバイス上",
  "picker.localAria": "ローカルファイル",
  "picker.localNote":
    "手持ちの曲を再生できます。UltraStarチャート、または対応する.vtt字幕付き動画のフォルダを選んでください — 何もアップロードされません。",
  "picker.openLocal": "ローカルファイルを開く",
  "picker.unsupported":
    "このブラウザではローカル再生を利用できません — File System Access APIが必要です。ローカルファイルを再生するにはChrome、Edge、Braveをお試しください。",
  "picker.checking": "このブラウザを確認中…",
  "picker.featured": "特集",

  // Score pages
  "leaderboard.rank": "#",
  "leaderboard.player": "プレイヤー",
  "leaderboard.score": "スコア",
  "leaderboard.accuracy": "正確さ",
  "leaderboard.combo": "コンボ",
  "leaderboard.empty": "まだスコアがありません — 最初の一人になりましょう。",
  "leaderboard.emptySing": "まだ採点歌唱の記録がありません。",
  "score.song": "曲",
  "score.mode": "モード",
  "score.when": "日時",
  "time.justNow": "たった今",
  "time.minutesAgo": "{count}分前",
  "time.hoursAgo": "{count}時間前",
  "time.daysAgo": "{count}日前",
  "profile.comment": "プロフィール",
  "profile.title": "プレイヤープロフィール",
  "profile.lede": "スコア、ベスト、最近のプレイ。",
  "profile.missing": "そのハンドルのプレイヤーはいません。",
  "profile.player": "プレイヤー",
  "profile.anonymous": "ゲスト",
  "profile.joined": " · {date} 登録",
  "profile.plays": "プレイ",
  "profile.songs": "曲",
  "profile.best": "ベスト",
  "profile.bestHeading": "ベストスコア",
  "profile.recentHeading": "最近",
  "profile.noBests": "まだ検証済みのスコアがありません。",
  "profile.nothing": "まだ何もありません。",
  "recent.title": "最近のプレイ",
  "recent.lede":
    "最新の検証済みスコアです。サインインしてプレイすると自分の記録も追加できます。",
  "recent.empty": "まだスコアがありません — 曲をプレイして最初の一人になりましょう。",
  "recent.loading": "最近のスコアを読み込み中…",
  "challenge.title": "デイリー＆ウィークリーチャレンジ",
  "challenge.lede":
    "期間ごとに1曲と1つの修飾子、それぞれにタイピングと歌唱のボードがあります。全員共通で、自動的に切り替わります。",
  "challenge.daily": "デイリー",
  "challenge.weekly": "ウィークリー",
  "challenge.playTyping": "タイピングでプレイ",
  "challenge.playSinging": "歌唱でプレイ",
  "challenge.typingBoard": "タイピングボード",
  "challenge.singingBoard": "歌唱ボード",
  "challenge.loading": "チャレンジを読み込み中…",
  "challenge.error": "チャレンジを読み込めませんでした。",

  // Local library
  "local.readFailed": "それらのフォルダを読み取れませんでした。",
  "local.unsupported": "このブラウザはフォルダを開けません。",
  "local.openFailed": "フォルダを開けませんでした。",
  "local.reopenFailed": "フォルダを再度開けませんでした。",
  "local.videoDescription": "ローカル動画 — {name}",
  "local.ultrastarDescription": "UltraStar — {artist}",
  "local.noTimedLyrics":
    "{file} にタイミング付きの歌詞が見つかりませんでした。",
  "local.noLyrics": "{file} に歌詞が見つかりませんでした。",
  "local.videoLoadFailed": "その動画と字幕のペアを読み込めませんでした。",
  "local.songLoadFailed": "そのUltraStarの曲を読み込めませんでした。",
  "local.folderCount": "{count}フォルダ",
  "local.foldersAria": "フォルダ: {names}",
  "local.noSongs": "曲なし",
  "local.oneSong": "1曲",
  "local.songCount": "{count}曲",
  "local.searchPlaceholder": "曲を検索…",
  "local.searchAria": "ローカル曲を検索",
  "local.addFolder": "別のフォルダを追加",
  "local.reopenOne": "{name} を再度開く",
  "local.reopenMany": "フォルダを再度開く",
  "local.missing":
    "これらのフォルダに {file} が見つかりませんでした。移動したか、フォルダを再度開く必要があるかもしれません。",
  "local.blockedOne": "「{name}」の曲を表示するには許可が必要です。",
  "local.blockedMany":
    "{count}個のフォルダの曲を表示するには許可が必要です。",
  "local.nothingFound":
    "再生できるものが見つかりませんでした。TypeStarはUltraStarチャート（#MP3とタイミング付き歌詞）と、同名の.vtt字幕が付いた動画を読み取ります — 例えば song.mp4 と song.vtt です。",
  "local.noMatch": "「{query}」に一致する曲がありません。",
  "local.badgeVideo": "動画",
  "local.badgeLyrics": "歌詞",
  "local.groupVideo": "動画 + 字幕",
  "local.footIntro": "このページを構成するフォルダ:",
  "local.footOutro": "。フォルダを削除するには、名前をクリックしてください。",
  "local.listAnd": "、",
  "local.removeFolder": "{name} を削除",
  "local.youtubeDesc": "特集曲を選ぶか、YouTubeのリンクを貼り付けてください。",
  "local.chooseFolder": "フォルダを選択",
  "local.chooseFolderDesc":
    "このデバイスからUltraStarの曲、または対応する.vtt字幕付きの動画を再生します。何もアップロードされません。",
  "local.scanning": "フォルダをスキャン中…",
  "local.reading": "曲を読み込み中…",

  // Site copy
  "site.tagline": "キーボードでも歌声でも、もっと自由に遊べる音楽ゲーム",
  "site.description":
    "リズムタッチタイピングゲーム。YouTubeが音楽と映像を提供し、単語が届くたびに歌詞をタイプします — キーボード版のGuitar Heroのようなものです。",
  "common.skipToContent": "コンテンツへスキップ",
  "seo.ogAlt":
    "{name} — 暗いノート背景に、タイトルの横に並ぶ黄色い「TS」タイル",
  "seo.requiresJs": "JavaScriptが必要です",
  "seo.sitemap": "サイトマップ",
  "privacy.updated": "最終更新 {date}",
  "privacy.banner":
    "このポリシーは便宜のために翻訳されています。英語版が正式な原本であり、相違がある場合は英語の文面が適用されます。",
  "privacy.bannerLink": "英語のポリシーを読む",

  // Game status (island)
  "game.loadingTrack": "曲を読み込み中…",
  "game.fetchingCaptions": "字幕を取得し、単語にタイミングを合わせています。",
  "game.noTrack": "再生する曲がありません",
  "game.tryAnother": "別の曲を試す",
  "game.humanCheckComment": "新しい曲",
  "game.humanCheckTitle": "簡単な人間確認",
  "game.humanCheckBody":
    "この曲はまだライブラリにないため、取得する前に人間であることを確認します。確認は曲ごとに一度だけです。",
  "game.humanCheckFailed":
    "人間確認を完了できませんでした。後でもう一度お試しください。",
  "game.loadError": "この曲の読み込み中に問題が発生しました。",
  "trackError.network": "楽曲サービスに接続できませんでした。",
  "trackError.noCaptions": "この動画には字幕がないため、入力するものがありません。",
  "trackError.badVideoId": "この動画IDは正しくないようです。",
  "trackError.badUrl": "この楽曲URLは使用できません。",
  "trackError.noLyrics": "このUltraStarチャートにはプレイできる歌詞がありません。",
  "trackError.noAudio": "このUltraStarチャートには音声ファイルの指定がありません。",
  "trackError.notFound": "その楽曲ファイルが見つかりませんでした。",
  "trackError.tooLarge": "その楽曲ファイルは大きすぎます。",
  "trackError.humanCheck": "この新しい曲を読み込むには、簡単な確認を完了してください。",
  "trackError.generic": "この曲を読み込めませんでした。",
  "trackError.unreadable": "楽曲データを読み取れませんでした。",
  "game.embedNoSong": "この埋め込みにはURLに曲が必要です。",
  "game.paused": "一時停止中",
  "game.typeLyricsAria": "歌詞をタイプ",
  "game.perfectLine": "パーフェクト！",
  "game.combo": "{count}コンボ！",
  "game.localTitle": "このデバイスからプレイ",
  "game.localSubtitle":
    "TypeStarに曲のフォルダを指定します。UltraStarチャート（.txt）と、同名の.vtt字幕が付いた動画を読み取ります。何もアップロードされず、フォルダはあなたのマシンに残ります。",
  "game.localMediaError":
    "このファイルを再生できませんでした。ブラウザがその形式に対応していない可能性があります。",
  "game.remoteMediaError": "この曲のメディアを配信元から読み込めませんでした。",

  // The media layer
  "player.loading": "プレイヤーを読み込み中",
  "player.unavailable": "動画を再生できません",
  "player.startFailed": "この動画を再生できませんでした。",
  "player.errInvalidId": "その動画IDは無効です。",
  "player.errEmbedded": "この動画は埋め込みプレイヤーでは再生できません。",
  "player.errPrivate": "この動画は非公開か、削除されています。",
  "player.errNotEmbeddable": "所有者がこの動画の埋め込みを許可していません。",

  // The intro cue
  "cue.firstWord": "最初の単語まで {seconds}秒",
  "cue.nextWord": "次の単語まで {seconds}秒",
  "cue.skip": "スキップ",

  // Microphone
  "mic.declined": "マイクへのアクセスが拒否されたため、ピッチを採点できません。",
  "mic.failed": "マイクを起動できませんでした。",
  "mic.live": "マイク入力中",
  "mic.preparing": "マイクを準備中…",
  "mic.unavailable": "マイクを利用できません — 採点なしで一緒に歌います。",

  // Sign-in and account
  "signin.comment": "サインイン",
  "signin.title": "サインイン",
  "signin.lede":
    "TypeStarはパスワードの代わりにワンタイムリンクを使います。メールアドレスを入力し、送信されたリンクを開くだけです。",
  "signin.formTitle": "リンクでサインイン",
  "signin.formBody":
    "メールアドレスを入力すると、ワンタイムのサインインリンクをお送りします。覚えるパスワードはなく、リンクを使うまでアカウントは作成されません。",
  "signin.emailLabel": "メールアドレス",
  "signin.submit": "サインインリンクをメールで送る",
  "signin.sending": "送信中…",
  "signin.invalidEmail": "有効なメールアドレスを入力してください。",
  "signin.needCheck": "人間確認を完了してください。",
  "signin.sendFailed": "リンクを送信できませんでした。もう一度お試しください。",
  "signin.sentComment": "受信箱をご確認ください",
  "signin.sentTitle": "リンクを送信しました",
  "signin.sentBody":
    "{email} にワンタイムのサインインリンクを送信しました。このブラウザで開いてサインインを完了してください。リンクは15分で失効し、一度しか使えません。",
  "signin.nothing": "届きませんでしたか？迷惑メールフォルダを確認するか、",
  "signin.tryAgain": "もう一度試す",
  "account.comment": "アカウント",
  "account.title": "アカウント",
  "account.lede": "メールアドレス、公開ハンドル、セッション。",
  "account.loading": "アカウントを読み込み中…",
  "account.signedOutTitle": "サインインしていません",
  "account.signedOutBody":
    "ワンタイムのメールリンクでサインインすると、スコアと設定をデバイス間で保持できます。",
  "account.signIn": "サインイン",
  "account.signedInTitle": "サインイン済み",
  "account.email": "メールアドレス",
  "account.memberSince": "登録日",
  "account.handleLabel": "ハンドル",
  "account.handleHint":
    "リーダーボードでの公開名です。小文字、数字、アンダースコアで3〜20文字。",
  "account.handlePlaceholder": "例: type_star",
  "account.save": "保存",
  "account.saving": "保存中…",
  "account.saved": "ハンドルを保存しました。",
  "account.signOut": "サインアウト",
  "account.deleteAccount": "アカウントを削除",
  "account.deleteConfirm": "アカウントとすべてのデータを削除しますか？",
  "account.deleteYes": "はい、削除する",
  "account.cancel": "キャンセル",
  "account.handleInvalid": "そのハンドルは使用できません。",
  "account.handleTaken": "そのハンドルは使用済みか無効です。もう一度お試しください。",
  "account.deleteFailed": "アカウントを削除できませんでした。",
  "handle.empty": "ハンドルを入力してください。",
  "handle.length": "ハンドルは{min}–{max}文字です。",
  "handle.charset":
    "小文字、数字、アンダースコアのみを使用し、先頭と末尾は文字または数字にしてください。",
  "handle.reserved": "そのハンドルは予約されています。",

  // The magic-link sign-in email
  "email.subject": "TypeStarのサインインリンク",
  "email.comment": "サインイン",
  "email.heading": "TypeStarにサインイン",
  "email.body":
    "下のリンクを開いてサインインを完了してください。一度だけ有効で、{minutes}分で失効します。",
  "email.button": "サインイン",
  "email.paste": "または、これをブラウザに貼り付けてください:",
  "email.ignore":
    "サインインを希望していない場合は、このメールを無視していただいて構いません。",
  "email.textBody": "このリンクを開いてサインインを完了してください:",
  "email.textExpiry": "リンクは一度だけ有効で、{minutes}分で失効します。",
  "email.signoff": "— TypeStar",

  // Embed
  "embed.button": "埋め込み",
  "embed.copied": "コピーしました！",

  // Turnstile
  "turnstile.failed": "人間確認に失敗しました。もう一度お試しください。",
  "turnstile.expired": "人間確認の有効期限が切れました。もう一度お試しください。",
  "turnstile.loadError": "人間確認を読み込めませんでした。",
};
