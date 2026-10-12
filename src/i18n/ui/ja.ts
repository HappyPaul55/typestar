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
};
