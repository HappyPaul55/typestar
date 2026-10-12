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
  "nav.play": "プレイ",
  "nav.privacy": "プライバシー",
  "nav.challenge": "チャレンジ",
  "nav.recent": "最近",
  "nav.account": "アカウント",
  "nav.language": "言語",
  "footer.pages": "ページ",
  "footer.elsewhere": "その他",
  "footer.source": "ソース",
  "footer.licence": "{licence} ライセンス",
  "footer.private": "// アカウントなし、Cookieなし、トラッカーなし",

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
  "results.signedOut":
    "スコアをリーダーボードに保存するにはサインインしてください。",
  "results.saveError": "リーダーボードに保存できませんでした。",
  "results.failScore": "スコアがマイナスになりました。",
  "results.failMistake": "ミスをしました。",
  "results.failStreak": "20回連続でミスしました。",

  // Track picker
  "picker.pasteLabel": "YouTubeのリンクまたはUltraStarのURLを貼り付け",
  "picker.placeholder": "https://www.youtube.com/watch?v=…  または  …/song.txt",
  "picker.play": "プレイ",
  "picker.note":
    "YouTubeのリンクは字幕から再生されます。UltraStarの.txtチャートへのリンクは取得され、音声はそのホストから直接ストリーミングされます。GitHubのblobリンクは自動的にrawに変換されます。",
  "picker.localHeading": "このデバイス上",
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
  "profile.comment": "プロフィール",
  "profile.title": "プレイヤープロフィール",
  "profile.lede": "スコア、ベスト、最近のプレイ。",
  "profile.missing": "そのハンドルのプレイヤーはいません。",
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

  // Site copy
  "site.tagline": "歌詞を時間どおりにタイプ",
  "site.description":
    "リズムタッチタイピングゲーム。YouTubeが音楽と映像を提供し、単語が届くたびに歌詞をタイプします — キーボード版のGuitar Heroのようなものです。",
  "common.skipToContent": "コンテンツへスキップ",
  "seo.ogAlt":
    "{name} — 暗いノート背景に、タイトルの横に並ぶ黄色い「TS」タイル",
  "seo.requiresJs": "JavaScriptが必要です",

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
  "game.embedNoSong": "この埋め込みにはURLに曲が必要です。",

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
  "account.save": "保存",
  "account.saving": "保存中…",
  "account.saved": "ハンドルを保存しました。",
  "account.signOut": "サインアウト",
  "account.deleteAccount": "アカウントを削除",
  "account.deleteConfirm": "アカウントとすべてのデータを削除しますか？",
  "account.deleteYes": "はい、削除する",
  "account.cancel": "キャンセル",

  // Embed
  "embed.button": "埋め込み",
  "embed.copied": "コピーしました！",

  // Turnstile
  "turnstile.failed": "人間確認に失敗しました。もう一度お試しください。",
  "turnstile.expired": "人間確認の有効期限が切れました。もう一度お試しください。",
  "turnstile.loadError": "人間確認を読み込めませんでした。",
};
