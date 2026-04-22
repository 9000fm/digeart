export type Locale = "es" | "en" | "fr" | "ja" | "ru";

const LOCALES: Locale[] = ["en", "es", "fr", "ja", "ru"];
export { LOCALES };

export const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Navigation
    "nav.forYou": "Para ti",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "Me gusta",

    // Settings
    "settings.title": "AJUSTES",
    "settings.theme": "Apariencia",
    "settings.speedAdjust": "Velocidad",
    "settings.tutorial": "Tutorial",
    "settings.about": "Info",
    "settings.language": "Idioma",
    "settings.signInToUnlock": "Inicia sesión para desbloquear",
    "settings.on": "On",
    "settings.off": "Off",
    "settings.run": "Ir",
    "settings.view": "Ver",
    "settings.dark": "Dark",
    "settings.light": "Light",

    // Auth
    "auth.signIn": "Iniciar sesión",
    "auth.signInWithGoogle": "Continuar con Google",
    "auth.signOut": "Cerrar sesión",
    "auth.savedTracks": "Tus me gusta",
    "auth.saveTracksSync": "Dale me gusta a tracks y sincroniza entre dispositivos",
    "auth.theme": "Apariencia",
    "auth.settings": "Ajustes",
    "auth.about": "Info",

    // Player
    "player.unavailable": "No disponible · saltando…",
    "player.watchOnYoutube": "Ver en YouTube",
    "player.closePlayer": "Cerrar reproductor",
    "player.play": "Reproducir (space / k)",
    "player.pause": "Pausar (space / k)",
    "player.next": "Siguiente (n)",
    "player.previous": "Anterior (p)",
    "player.shuffleOn": "Shuffle on (s)",
    "player.shuffleOff": "Shuffle off (s)",
    "player.mute": "Silenciar (m)",
    "player.unmute": "Activar sonido (m)",
    "player.locate": "Target (t)",
    "player.like": "Me gusta (l)",
    "player.unlike": "Quitar (l)",
    "player.fullscreen": "Pantalla completa (f)",
    "player.queue": "Queue (q)",
    "player.reset": "Reset (tap)",

    // Queue
    "queue.title": "Queue",
    "queue.close": "Cerrar queue",
    "queue.empty": "Sin queue",
    "queue.nowPlaying": "Reproduciendo",
    "queue.upNext": "Siguiente",
    "queue.previouslyPlayed": "Reproducido",

    // Cards
    "card.save": "Me gusta",
    "card.saved": "¡Te gusta!",
    "card.unlike": "Quitar",
    "card.loginToSave": "Inicia sesión para dar me gusta",

    // Saved
    "saved.signInToSave": "Inicia sesión para dar me gusta",
    "saved.noSavedYet": "Aún no hay tracks con me gusta",
    "saved.all": "Todo",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "Aún no hay {filter} con me gusta",
    "saved.recentlyRemoved": "Eliminados recientemente",
    "saved.play": "Reproducir",
    "saved.restore": "Restaurar",
    "saved.deletePermanently": "Eliminar permanentemente",
    "saved.clearAll": "Limpiar todo",
    "saved.discoverMore": "Ve a {tab} para descubrir más",

    // Toast
    "toast.removed": "Eliminado",
    "toast.undo": "Deshacer",

    // Tutorial
    "tutorial.clickToPlay": "Click para reproducir",
    "tutorial.clickToPlayDesc": "Haz click en cualquier track para escuchar.",
    "tutorial.thePlayer": "El reproductor",
    "tutorial.thePlayerDesc": "Play, pausa, skip, shuffle y ajusta el volumen desde aquí.",
    "tutorial.browseYourWay": "Elige una sección",
    "tutorial.browseYourWayDesc": "Cambia entre Tracks, Samples, Mixes y Me gusta para explorar distintos sonidos.",
    "tutorial.filters": "Filtros",
    "tutorial.filtersDesc": "Filtros por género y año (próximamente).",
    "tutorial.yourMenu": "Ajustes personales",
    "tutorial.yourMenuDesc": "Tema, ajustes y controles extra — todo en un solo lugar.",
    "tutorial.yourMenuDescMobile": "Tema, ajustes y controles extra — todo en un solo lugar.",
    "tutorial.skipTitle": "¿Saltar tutorial?",
    "tutorial.skipDesc": "Puedes reiniciarlo desde Ajustes.",
    "tutorial.continue": "Continuar",
    "tutorial.skip": "Saltar",
    "tutorial.done": "Listo",

    // Welcome
    "welcome.tagline": "Una plataforma para descubrir música.",
    "welcome.signInPrompt": "Inicia sesión para guardar tracks.",
    "welcome.skip": "Saltar por ahora",

    // About
    "about.tagline": "Plataforma de exploración enfocado en música underground y material poco común. Tracks, samples y mixes en un solo lugar.",
    "about.tags": "Tags",
    "about.trending": "Lo más escuchado",
    "about.hiddenGems": "Rarezas",
    "about.addedRecently": "Novedades",
    "about.shortcuts": "Atajos",
    "about.tabs": "Tabs",
    "about.electronic": "Electrónica underground selecta",
    "about.djSets": "DJ sets y live sets",
    "about.worldFunk": "World, jazz, ambient y otras rarezas",
    "about.yourLiked": "Tus tracks favoritos",
    "about.legal": "Todos los tracks son propiedad de sus respectivos dueños y titulares de derechos. Esta plataforma no reclama propiedad de ningún contenido.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Play / Pausa",
    "about.shortcutNext": "Siguiente track",
    "about.shortcutPrev": "Track anterior",
    "about.shortcutShuffle": "Shuffle on/off",
    "about.shortcutMute": "Silenciar / Activar",
    "about.shortcutLocate": "Target track",
    "about.shortcutLike": "Me gusta",
    "about.shortcutQueue": "Cola de reproducción",
    "about.shortcutTab": "Ir a tab",
    "about.shortcutPanel": "Mostrar info",

    // Search
    "search.comingSoon": "Próximamente",

    // Maintenance
    "maintenance.backSoon": "Volvemos pronto",

    // Misc
    "misc.noMatchingGenres": "Sin géneros coincidentes",
    "misc.clearAll": "Limpiar todo",
  },
  en: {
    // Navigation
    "nav.forYou": "For You",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "Liked",

    // Settings
    "settings.title": "SETTINGS",
    "settings.theme": "Appearance",
    "settings.speedAdjust": "Speed Adjust",
    "settings.tutorial": "Tutorial",
    "settings.about": "Info",
    "settings.language": "Language",
    "settings.signInToUnlock": "Sign in to unlock",
    "settings.on": "On",
    "settings.off": "Off",
    "settings.run": "Run",
    "settings.view": "View",
    "settings.dark": "Dark",
    "settings.light": "Light",

    // Auth
    "auth.signIn": "Sign in",
    "auth.signInWithGoogle": "Continue with Google",
    "auth.signOut": "Sign out",
    "auth.savedTracks": "Liked tracks",
    "auth.saveTracksSync": "Like tracks & sync across devices",
    "auth.theme": "Appearance",
    "auth.settings": "Settings",
    "auth.about": "Info",

    // Player
    "player.unavailable": "Unavailable · skipping…",
    "player.watchOnYoutube": "Watch on YouTube",
    "player.closePlayer": "Close player",
    "player.play": "Play (space / k)",
    "player.pause": "Pause (space / k)",
    "player.next": "Next (n)",
    "player.previous": "Previous (p)",
    "player.shuffleOn": "Shuffle on (s)",
    "player.shuffleOff": "Shuffle off (s)",
    "player.mute": "Mute (m)",
    "player.unmute": "Unmute (m)",
    "player.locate": "Target (t)",
    "player.like": "Like (l)",
    "player.unlike": "Unlike (l)",
    "player.fullscreen": "Fullscreen (f)",
    "player.queue": "Queue (q)",
    "player.reset": "Reset (tap)",

    // Queue
    "queue.title": "Queue",
    "queue.close": "Close queue",
    "queue.empty": "No queue",
    "queue.nowPlaying": "Now playing",
    "queue.upNext": "Up next",
    "queue.previouslyPlayed": "Previously played",

    // Cards
    "card.save": "Like",
    "card.saved": "Liked!",
    "card.unlike": "Unlike",
    "card.loginToSave": "Log in to like",

    // Saved
    "saved.signInToSave": "Sign in to like",
    "saved.noSavedYet": "No liked tracks yet",
    "saved.all": "All",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "No liked {filter} yet",
    "saved.recentlyRemoved": "Recently removed",
    "saved.play": "Play",
    "saved.restore": "Restore",
    "saved.deletePermanently": "Delete permanently",
    "saved.clearAll": "Clear all",
    "saved.discoverMore": "Head to {tab} to discover some",

    // Toast
    "toast.removed": "Removed",
    "toast.undo": "Undo",

    // Tutorial
    "tutorial.clickToPlay": "Click to play",
    "tutorial.clickToPlayDesc": "Click any track to start listening.",
    "tutorial.thePlayer": "The player",
    "tutorial.thePlayerDesc": "Play, pause, skip, shuffle, and adjust volume from here.",
    "tutorial.browseYourWay": "Pick a section",
    "tutorial.browseYourWayDesc": "Jump between Tracks, Samples, Mixes, and Liked to explore different kinds of sounds.",
    "tutorial.filters": "Filters",
    "tutorial.filtersDesc": "Genre & year filters coming soon.",
    "tutorial.yourMenu": "Personal settings",
    "tutorial.yourMenuDesc": "Theme, settings, and extra controls are all gathered here.",
    "tutorial.yourMenuDescMobile": "Theme, settings, and extra controls are all gathered here.",
    "tutorial.skipTitle": "Skip tutorial?",
    "tutorial.skipDesc": "You can restart it anytime from Settings.",
    "tutorial.continue": "Continue",
    "tutorial.skip": "Skip",
    "tutorial.done": "Done",

    // Welcome
    "welcome.tagline": "A platform for music discovery.",
    "welcome.signInPrompt": "Sign in to save tracks.",
    "welcome.skip": "Skip for now",

    // About
    "about.tagline": "Music discovery for underground and hard-to-find material. Tracks, samples, and mixes in one place.",
    "about.tags": "Tags",
    "about.trending": "Most played",
    "about.hiddenGems": "Rarities",
    "about.addedRecently": "New arrivals",
    "about.shortcuts": "Shortcuts",
    "about.tabs": "Tabs",
    "about.electronic": "Electronic cuts from the underground",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "World, jazz, ambient & rare finds",
    "about.yourLiked": "Your liked tracks",
    "about.legal": "All tracks are property of their respective owners and rights holders. This platform does not claim ownership of any content.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Play / Pause",
    "about.shortcutNext": "Next track",
    "about.shortcutPrev": "Previous track",
    "about.shortcutShuffle": "Toggle shuffle",
    "about.shortcutMute": "Mute / Unmute",
    "about.shortcutLocate": "Target track",
    "about.shortcutLike": "Like track",
    "about.shortcutQueue": "Playback queue",
    "about.shortcutTab": "Go to tab",
    "about.shortcutPanel": "Show info",

    // Search
    "search.comingSoon": "Coming soon",

    // Maintenance
    "maintenance.backSoon": "We'll be right back",

    // Misc
    "misc.noMatchingGenres": "No matching genres",
    "misc.clearAll": "Clear all",
  },
  fr: {
    // Navigation
    "nav.forYou": "Pour toi",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "J'aime",

    // Settings
    "settings.title": "RÉGLAGES",
    "settings.theme": "Apparence",
    "settings.speedAdjust": "Vitesse",
    "settings.tutorial": "Tutorial",
    "settings.about": "Info",
    "settings.language": "Langue",
    "settings.signInToUnlock": "Connecte-toi pour débloquer",
    "settings.on": "On",
    "settings.off": "Off",
    "settings.run": "Lancer",
    "settings.view": "Voir",
    "settings.dark": "Dark",
    "settings.light": "Light",

    // Auth
    "auth.signIn": "Se connecter",
    "auth.signInWithGoogle": "Continuer avec Google",
    "auth.signOut": "Se déconnecter",
    "auth.savedTracks": "Tracks que tu aimes",
    "auth.saveTracksSync": "Aime des tracks et synchronise entre appareils",
    "auth.theme": "Apparence",
    "auth.settings": "Réglages",
    "auth.about": "Info",

    // Player
    "player.unavailable": "Indisponible · passage…",
    "player.watchOnYoutube": "Voir sur YouTube",
    "player.closePlayer": "Fermer le lecteur",
    "player.play": "Lecture (space / k)",
    "player.pause": "Pause (space / k)",
    "player.next": "Suivant (n)",
    "player.previous": "Précédent (p)",
    "player.shuffleOn": "Shuffle on (s)",
    "player.shuffleOff": "Shuffle off (s)",
    "player.mute": "Muet (m)",
    "player.unmute": "Son activé (m)",
    "player.locate": "Cibler (t)",
    "player.like": "J'aime (l)",
    "player.unlike": "Retirer (l)",
    "player.fullscreen": "Plein écran (f)",
    "player.queue": "Queue (q)",
    "player.reset": "Reset (tap)",

    // Queue
    "queue.title": "Queue",
    "queue.close": "Fermer la queue",
    "queue.empty": "Queue vide",
    "queue.nowPlaying": "En lecture",
    "queue.upNext": "Suivant",
    "queue.previouslyPlayed": "Déjà joué",

    // Cards
    "card.save": "J'aime",
    "card.saved": "J'aime !",
    "card.unlike": "Retirer",
    "card.loginToSave": "Connecte-toi pour aimer",

    // Saved
    "saved.signInToSave": "Connecte-toi pour aimer",
    "saved.noSavedYet": "Pas encore de tracks aimés",
    "saved.all": "Tout",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "Pas encore de {filter} aimés",
    "saved.recentlyRemoved": "Supprimés récemment",
    "saved.play": "Lecture",
    "saved.restore": "Restaurer",
    "saved.deletePermanently": "Supprimer définitivement",
    "saved.clearAll": "Tout effacer",
    "saved.discoverMore": "Va dans {tab} pour en découvrir",

    // Toast
    "toast.removed": "Supprimé",
    "toast.undo": "Annuler",

    // Tutorial
    "tutorial.clickToPlay": "Clique pour écouter",
    "tutorial.clickToPlayDesc": "Clique sur n'importe quel track pour commencer à écouter.",
    "tutorial.thePlayer": "Le lecteur",
    "tutorial.thePlayerDesc": "Play, pause, skip, shuffle et ajuste le volume ici.",
    "tutorial.browseYourWay": "Choisis une section",
    "tutorial.browseYourWayDesc": "Passe entre Tracks, Samples, Mixes et J'aime pour explorer différents sons.",
    "tutorial.filters": "Filtres",
    "tutorial.filtersDesc": "Filtres par genre et année bientôt disponibles.",
    "tutorial.yourMenu": "Réglages personnels",
    "tutorial.yourMenuDesc": "Thème, réglages et contrôles supplémentaires — tout au même endroit.",
    "tutorial.yourMenuDescMobile": "Thème, réglages et contrôles supplémentaires — tout au même endroit.",
    "tutorial.skipTitle": "Passer le tutorial ?",
    "tutorial.skipDesc": "Tu peux le relancer depuis les Réglages.",
    "tutorial.continue": "Continuer",
    "tutorial.skip": "Passer",
    "tutorial.done": "Terminé",

    // Welcome
    "welcome.tagline": "Une plateforme pour découvrir la musique.",
    "welcome.signInPrompt": "Connecte-toi pour sauvegarder des tracks.",
    "welcome.skip": "Passer pour le moment",

    // About
    "about.tagline": "Plateforme d'exploration axée sur la musique underground et le matériel rare. Tracks, samples et mixes au même endroit.",
    "about.tags": "Tags",
    "about.trending": "Les plus écoutés",
    "about.hiddenGems": "Raretés",
    "about.addedRecently": "Nouveautés",
    "about.shortcuts": "Raccourcis",
    "about.tabs": "Tabs",
    "about.electronic": "Électro underground selecte",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "World, jazz, ambient & raretés",
    "about.yourLiked": "Tes tracks favoris",
    "about.legal": "Tous les tracks sont la propriété de leurs propriétaires et ayants droit respectifs. Cette plateforme ne revendique la propriété d'aucun contenu.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Lecture / Pause",
    "about.shortcutNext": "Track suivant",
    "about.shortcutPrev": "Track précédent",
    "about.shortcutShuffle": "Shuffle on/off",
    "about.shortcutMute": "Muet / Son",
    "about.shortcutLocate": "Cibler le track",
    "about.shortcutLike": "J'aime",
    "about.shortcutQueue": "File de lecture",
    "about.shortcutTab": "Aller au tab",
    "about.shortcutPanel": "Afficher info",

    // Search
    "search.comingSoon": "Bientôt disponible",

    // Maintenance
    "maintenance.backSoon": "On revient vite",

    // Misc
    "misc.noMatchingGenres": "Aucun genre correspondant",
    "misc.clearAll": "Tout effacer",
  },
  ja: {
    // Navigation
    "nav.forYou": "おすすめ",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "いいね",

    // Settings
    "settings.title": "設定",
    "settings.theme": "外観",
    "settings.speedAdjust": "再生速度",
    "settings.tutorial": "Tutorial",
    "settings.about": "Info",
    "settings.language": "言語",
    "settings.signInToUnlock": "ログインして解除",
    "settings.on": "On",
    "settings.off": "Off",
    "settings.run": "実行",
    "settings.view": "表示",
    "settings.dark": "Dark",
    "settings.light": "Light",

    // Auth
    "auth.signIn": "ログイン",
    "auth.signInWithGoogle": "Googleで続行",
    "auth.signOut": "ログアウト",
    "auth.savedTracks": "いいねしたトラック",
    "auth.saveTracksSync": "トラックにいいねしてデバイス間で同期",
    "auth.theme": "外観",
    "auth.settings": "設定",
    "auth.about": "Info",

    // Player
    "player.unavailable": "再生不可 · スキップ中…",
    "player.watchOnYoutube": "YouTubeで見る",
    "player.closePlayer": "プレイヤーを閉じる",
    "player.play": "再生 (space / k)",
    "player.pause": "一時停止 (space / k)",
    "player.next": "次へ (n)",
    "player.previous": "前へ (p)",
    "player.shuffleOn": "Shuffle on (s)",
    "player.shuffleOff": "Shuffle off (s)",
    "player.mute": "ミュート (m)",
    "player.unmute": "ミュート解除 (m)",
    "player.locate": "ターゲット (t)",
    "player.like": "いいね (l)",
    "player.unlike": "削除 (l)",
    "player.fullscreen": "フルスクリーン (f)",
    "player.queue": "Queue (q)",
    "player.reset": "リセット (tap)",

    // Queue
    "queue.title": "Queue",
    "queue.close": "Queueを閉じる",
    "queue.empty": "Queueなし",
    "queue.nowPlaying": "再生中",
    "queue.upNext": "次に再生",
    "queue.previouslyPlayed": "再生済み",

    // Cards
    "card.save": "いいね",
    "card.saved": "いいね!",
    "card.unlike": "削除",
    "card.loginToSave": "ログインしていいね",

    // Saved
    "saved.signInToSave": "ログインしていいね",
    "saved.noSavedYet": "いいねしたトラックはまだない",
    "saved.all": "すべて",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "いいねした{filter}はまだない",
    "saved.recentlyRemoved": "最近削除したもの",
    "saved.play": "再生",
    "saved.restore": "復元",
    "saved.deletePermanently": "完全に削除",
    "saved.clearAll": "すべてクリア",
    "saved.discoverMore": "{tab}で新しい音楽を見つけよう",

    // Toast
    "toast.removed": "削除済み",
    "toast.undo": "元に戻す",

    // Tutorial
    "tutorial.clickToPlay": "クリックして再生",
    "tutorial.clickToPlayDesc": "トラックをクリックして再生。",
    "tutorial.thePlayer": "プレイヤー",
    "tutorial.thePlayerDesc": "再生、一時停止、スキップ、shuffle、音量調整 — すべてここから。",
    "tutorial.browseYourWay": "セクションを選ぶ",
    "tutorial.browseYourWayDesc": "Tracks、Samples、Mixes、いいねを切り替えて色んな音を探そう。",
    "tutorial.filters": "フィルター",
    "tutorial.filtersDesc": "ジャンル・年代フィルターは近日公開。",
    "tutorial.yourMenu": "個人設定",
    "tutorial.yourMenuDesc": "テーマ、設定、その他のコントロール — すべてここに。",
    "tutorial.yourMenuDescMobile": "テーマ、設定、その他のコントロール — すべてここに。",
    "tutorial.skipTitle": "Tutorialをスキップ？",
    "tutorial.skipDesc": "設定からいつでも再開できる。",
    "tutorial.continue": "続ける",
    "tutorial.skip": "スキップ",
    "tutorial.done": "完了",

    // Welcome
    "welcome.tagline": "音楽を発見するプラットフォーム。",
    "welcome.signInPrompt": "ログインしてトラックを保存。",
    "welcome.skip": "今はスキップ",

    // About
    "about.tagline": "アンダーグラウンドな音楽とレアな音源に特化した探索プラットフォーム。トラック、サンプル、ミックスが一か所に。",
    "about.tags": "Tags",
    "about.trending": "最も再生された",
    "about.hiddenGems": "レア曲",
    "about.addedRecently": "新着",
    "about.shortcuts": "ショートカット",
    "about.tabs": "Tabs",
    "about.electronic": "アンダーグラウンドの電子音楽",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "ワールド、ジャズ、アンビエント、レア音源",
    "about.yourLiked": "お気に入りのトラック",
    "about.legal": "すべてのトラックは各権利者の所有物です。本プラットフォームはコンテンツの所有権を主張しません。",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "再生 / 一時停止",
    "about.shortcutNext": "次のトラック",
    "about.shortcutPrev": "前のトラック",
    "about.shortcutShuffle": "Shuffle 切替",
    "about.shortcutMute": "ミュート 切替",
    "about.shortcutLocate": "トラックをターゲット",
    "about.shortcutLike": "いいね",
    "about.shortcutQueue": "再生キュー",
    "about.shortcutTab": "タブ移動",
    "about.shortcutPanel": "情報表示",

    // Search
    "search.comingSoon": "近日公開",

    // Maintenance
    "maintenance.backSoon": "すぐ戻ります",

    // Misc
    "misc.noMatchingGenres": "一致するジャンルなし",
    "misc.clearAll": "すべてクリア",
  },
  ru: {
    // Navigation
    "nav.forYou": "Для тебя",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "Нравится",

    // Settings
    "settings.title": "НАСТРОЙКИ",
    "settings.theme": "Оформление",
    "settings.speedAdjust": "Скорость",
    "settings.tutorial": "Tutorial",
    "settings.about": "Info",
    "settings.language": "Язык",
    "settings.signInToUnlock": "Войди, чтобы разблокировать",
    "settings.on": "Вкл",
    "settings.off": "Выкл",
    "settings.run": "Запуск",
    "settings.view": "Открыть",
    "settings.dark": "Dark",
    "settings.light": "Light",

    // Auth
    "auth.signIn": "Войти",
    "auth.signInWithGoogle": "Продолжить через Google",
    "auth.signOut": "Выйти",
    "auth.savedTracks": "Понравившиеся треки",
    "auth.saveTracksSync": "Ставь нравится трекам и синхронизируй между устройствами",
    "auth.theme": "Оформление",
    "auth.settings": "Настройки",
    "auth.about": "Info",

    // Player
    "player.unavailable": "Недоступно · пропуск…",
    "player.watchOnYoutube": "Смотреть на YouTube",
    "player.closePlayer": "Закрыть плеер",
    "player.play": "Воспроизвести (space / k)",
    "player.pause": "Пауза (space / k)",
    "player.next": "Следующий (n)",
    "player.previous": "Предыдущий (p)",
    "player.shuffleOn": "Shuffle on (s)",
    "player.shuffleOff": "Shuffle off (s)",
    "player.mute": "Без звука (m)",
    "player.unmute": "Включить звук (m)",
    "player.locate": "Нацелиться (t)",
    "player.like": "Нравится (l)",
    "player.unlike": "Убрать (l)",
    "player.fullscreen": "Полный экран (f)",
    "player.queue": "Queue (q)",
    "player.reset": "Сброс (tap)",

    // Queue
    "queue.title": "Queue",
    "queue.close": "Закрыть queue",
    "queue.empty": "Queue пусто",
    "queue.nowPlaying": "Сейчас играет",
    "queue.upNext": "Далее",
    "queue.previouslyPlayed": "Уже играло",

    // Cards
    "card.save": "Нравится",
    "card.saved": "Нравится!",
    "card.unlike": "Убрать",
    "card.loginToSave": "Войди, чтобы поставить нравится",

    // Saved
    "saved.signInToSave": "Войди, чтобы ставить нравится",
    "saved.noSavedYet": "Пока нет понравившихся треков",
    "saved.all": "Все",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "Пока нет понравившихся {filter}",
    "saved.recentlyRemoved": "Недавно удалённые",
    "saved.play": "Играть",
    "saved.restore": "Восстановить",
    "saved.deletePermanently": "Удалить навсегда",
    "saved.clearAll": "Очистить всё",
    "saved.discoverMore": "Перейди в {tab}, чтобы найти ещё",

    // Toast
    "toast.removed": "Удалено",
    "toast.undo": "Отменить",

    // Tutorial
    "tutorial.clickToPlay": "Нажми, чтобы слушать",
    "tutorial.clickToPlayDesc": "Нажми на любой трек, чтобы начать слушать.",
    "tutorial.thePlayer": "Плеер",
    "tutorial.thePlayerDesc": "Играй, паузь, переключай, shuffle и настраивай громкость здесь.",
    "tutorial.browseYourWay": "Выбери раздел",
    "tutorial.browseYourWayDesc": "Переключайся между Tracks, Samples, Mixes и Нравится, чтобы находить разные звуки.",
    "tutorial.filters": "Фильтры",
    "tutorial.filtersDesc": "Фильтры по жанру и году скоро появятся.",
    "tutorial.yourMenu": "Личные настройки",
    "tutorial.yourMenuDesc": "Тема, настройки и доп. элементы — всё собрано здесь.",
    "tutorial.yourMenuDescMobile": "Тема, настройки и доп. элементы — всё собрано здесь.",
    "tutorial.skipTitle": "Пропустить tutorial?",
    "tutorial.skipDesc": "Можно перезапустить из Настроек.",
    "tutorial.continue": "Продолжить",
    "tutorial.skip": "Пропустить",
    "tutorial.done": "Готово",

    // Welcome
    "welcome.tagline": "Платформа для поиска музыки.",
    "welcome.signInPrompt": "Войди, чтобы сохранять треки.",
    "welcome.skip": "Пропустить",

    // About
    "about.tagline": "Платформа для поиска, сфокусированная на андеграундной музыке и редком материале. Треки, сэмплы и миксы в одном месте.",
    "about.tags": "Tags",
    "about.trending": "Самые слушаемые",
    "about.hiddenGems": "Редкости",
    "about.addedRecently": "Новинки",
    "about.shortcuts": "Горячие клавиши",
    "about.tabs": "Tabs",
    "about.electronic": "Андеграунд электроника",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "World, jazz, ambient и редкие находки",
    "about.yourLiked": "Твои любимые треки",
    "about.legal": "Все треки являются собственностью их владельцев и правообладателей. Платформа не претендует на права на какой-либо контент.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Воспроизведение / Пауза",
    "about.shortcutNext": "Следующий трек",
    "about.shortcutPrev": "Предыдущий трек",
    "about.shortcutShuffle": "Shuffle вкл/выкл",
    "about.shortcutMute": "Звук вкл/выкл",
    "about.shortcutLocate": "Нацелиться на трек",
    "about.shortcutLike": "Нравится",
    "about.shortcutQueue": "Очередь воспроизведения",
    "about.shortcutTab": "Перейти к табу",
    "about.shortcutPanel": "Показать info",

    // Search
    "search.comingSoon": "Скоро",

    // Maintenance
    "maintenance.backSoon": "Скоро вернёмся",

    // Misc
    "misc.noMatchingGenres": "Нет подходящих жанров",
    "misc.clearAll": "Очистить всё",
  },
};
