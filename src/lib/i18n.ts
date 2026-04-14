export type Locale = "es" | "en" | "fr" | "ja" | "ru";

const LOCALES: Locale[] = ["en", "es", "fr", "ja", "ru"];
export { LOCALES };

export const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Navigation
    "nav.forYou": "Para ti",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "Guardados",

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
    "auth.signInWithGoogle": "Iniciar sesión con Google",
    "auth.signOut": "Cerrar sesión",
    "auth.savedTracks": "Tracks guardados",
    "auth.saveTracksSync": "Guarda tracks y sincroniza entre dispositivos",
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
    "player.locate": "Localizar (l)",
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
    "card.save": "Guardar",
    "card.saved": "¡Guardado!",
    "card.unlike": "Quitar",
    "card.loginToSave": "Inicia sesión para guardar",

    // Saved
    "saved.signInToSave": "Inicia sesión para guardar",
    "saved.noSavedYet": "Aún no hay tracks guardados",
    "saved.all": "Todo",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "Aún no hay {filter} guardados",
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
    "tutorial.clickToPlayDesc": "Haz click en cualquier tarjeta para escuchar.",
    "tutorial.thePlayer": "El reproductor",
    "tutorial.thePlayerDesc": "Play, pausa, localizar, volumen, shuffle — todos los controles aquí.",
    "tutorial.browseYourWay": "Explora a tu manera",
    "tutorial.browseYourWayDesc": "Tracks, Samples, Mixes y Guardados — descubre música en distintos formatos.",
    "tutorial.filters": "Filtros",
    "tutorial.filtersDesc": "Filtros por género y año (próximamente).",
    "tutorial.yourMenu": "Tu menú",
    "tutorial.yourMenuDesc": "Apariencia, info, ajustes y más — todo en tu menú de perfil.",
    "tutorial.yourMenuDescMobile": "Ajustes, acerca de y tracks guardados — todo en tu menú de perfil.",
    "tutorial.skipTitle": "¿Saltar tutorial?",
    "tutorial.skipDesc": "Puedes reiniciarlo desde Ajustes.",
    "tutorial.continue": "Continuar",
    "tutorial.skip": "Saltar",
    "tutorial.done": "Listo",

    // Welcome
    "welcome.tagline": "Encuentra música nueva",
    "welcome.signInPrompt": "¿Te gustó? guárdalo.",
    "welcome.skip": "Ahora no",

    // About
    "about.tagline": "Música selecta para diggers. Todo seleccionado a mano.",
    "about.tags": "Tags",
    "about.trending": "Lo más escuchado",
    "about.hiddenGems": "Rarezas",
    "about.addedRecently": "Novedades",
    "about.shortcuts": "Atajos",
    "about.tabs": "Tabs",
    "about.electronic": "Electrónica underground selecta",
    "about.djSets": "DJ sets y live sets",
    "about.worldFunk": "World, funk, jazz, ambient y otras rarezas",
    "about.yourLiked": "Tus tracks favoritos",
    "about.legal": "Todos los tracks son propiedad de sus respectivos dueños y titulares de derechos. Esta plataforma no reclama propiedad de ningún contenido.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Play / Pausa",
    "about.shortcutNext": "Siguiente track",
    "about.shortcutPrev": "Track anterior",
    "about.shortcutShuffle": "Shuffle on/off",
    "about.shortcutMute": "Silenciar / Activar",
    "about.shortcutLocate": "Localizar track",
    "about.shortcutQueue": "Mostrar queue",
    "about.shortcutTab": "Cambiar tab",
    "about.shortcutPanel": "Mostrar este panel",

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
    "nav.saved": "Saved",

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
    "auth.signInWithGoogle": "Sign in with Google",
    "auth.signOut": "Sign out",
    "auth.savedTracks": "Saved tracks",
    "auth.saveTracksSync": "Save tracks & sync across devices",
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
    "player.locate": "Locate (l)",
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
    "card.save": "Save",
    "card.saved": "Saved!",
    "card.unlike": "Unlike",
    "card.loginToSave": "Log in to save",

    // Saved
    "saved.signInToSave": "Sign in to save",
    "saved.noSavedYet": "No saved tracks yet",
    "saved.all": "All",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "No saved {filter} yet",
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
    "tutorial.clickToPlayDesc": "Click any card to start listening.",
    "tutorial.thePlayer": "The player",
    "tutorial.thePlayerDesc": "Play, pause, locate, volume, shuffle — all controls live here.",
    "tutorial.browseYourWay": "Browse your way",
    "tutorial.browseYourWayDesc": "Tracks, Samples, Mixes & Saved — each tab surfaces different music.",
    "tutorial.filters": "Filters",
    "tutorial.filtersDesc": "Genre & year filters coming soon.",
    "tutorial.yourMenu": "Your menu",
    "tutorial.yourMenuDesc": "Theme, about, settings, and more — all inside your profile menu.",
    "tutorial.yourMenuDescMobile": "Settings, about, and saved tracks — all inside your profile menu.",
    "tutorial.skipTitle": "Skip tutorial?",
    "tutorial.skipDesc": "You can restart it anytime from Settings.",
    "tutorial.continue": "Continue",
    "tutorial.skip": "Skip",
    "tutorial.done": "Done",

    // Welcome
    "welcome.tagline": "Music discovery for diggers",
    "welcome.signInPrompt": "Like it? Save it.",
    "welcome.skip": "Not now",

    // About
    "about.tagline": "Music discovery for diggers. All human-selected.",
    "about.tags": "Tags",
    "about.trending": "Most played",
    "about.hiddenGems": "Rarities",
    "about.addedRecently": "New arrivals",
    "about.shortcuts": "Shortcuts",
    "about.tabs": "Tabs",
    "about.electronic": "Electronic cuts from the underground",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "World, funk, jazz, ambient & rare finds",
    "about.yourLiked": "Your liked tracks",
    "about.legal": "All tracks are property of their respective owners and rights holders. This platform does not claim ownership of any content.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Play / Pause",
    "about.shortcutNext": "Next track",
    "about.shortcutPrev": "Previous track",
    "about.shortcutShuffle": "Toggle shuffle",
    "about.shortcutMute": "Mute / Unmute",
    "about.shortcutLocate": "Locate track",
    "about.shortcutQueue": "Toggle queue",
    "about.shortcutTab": "Switch tab",
    "about.shortcutPanel": "Toggle this panel",

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
    "nav.saved": "Sauvegardés",

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
    "auth.signInWithGoogle": "Se connecter avec Google",
    "auth.signOut": "Se déconnecter",
    "auth.savedTracks": "Tracks sauvegardés",
    "auth.saveTracksSync": "Sauvegarde tes tracks et synchronise entre appareils",
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
    "player.locate": "Localiser (l)",
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
    "card.save": "Sauvegarder",
    "card.saved": "Sauvegardé !",
    "card.unlike": "Retirer",
    "card.loginToSave": "Connecte-toi pour sauvegarder",

    // Saved
    "saved.signInToSave": "Connecte-toi pour sauvegarder",
    "saved.noSavedYet": "Pas encore de tracks sauvegardés",
    "saved.all": "Tout",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "Pas encore de {filter} sauvegardés",
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
    "tutorial.clickToPlayDesc": "Clique sur n'importe quelle carte pour écouter.",
    "tutorial.thePlayer": "Le lecteur",
    "tutorial.thePlayerDesc": "Play, pause, localiser, volume, shuffle — tous les contrôles sont ici.",
    "tutorial.browseYourWay": "Explore à ta façon",
    "tutorial.browseYourWayDesc": "Tracks, Samples, Mixes & Sauvegardés — chaque tab affiche une musique différente.",
    "tutorial.filters": "Filtres",
    "tutorial.filtersDesc": "Filtres par genre et année bientôt disponibles.",
    "tutorial.yourMenu": "Ton menu",
    "tutorial.yourMenuDesc": "Thème, info, réglages et plus — tout dans ton menu profil.",
    "tutorial.yourMenuDescMobile": "Réglages, info et tracks sauvegardés — tout dans ton menu profil.",
    "tutorial.skipTitle": "Passer le tutorial ?",
    "tutorial.skipDesc": "Tu peux le relancer depuis les Réglages.",
    "tutorial.continue": "Continuer",
    "tutorial.skip": "Passer",
    "tutorial.done": "Terminé",

    // Welcome
    "welcome.tagline": "Découvre de la nouvelle musique",
    "welcome.signInPrompt": "Tu aimes ? Sauvegarde.",
    "welcome.skip": "Pas maintenant",

    // About
    "about.tagline": "Musique selecte pour diggers. Sélection 100% humaine.",
    "about.tags": "Tags",
    "about.trending": "Les plus écoutés",
    "about.hiddenGems": "Raretés",
    "about.addedRecently": "Nouveautés",
    "about.shortcuts": "Raccourcis",
    "about.tabs": "Tabs",
    "about.electronic": "Électro underground selecte",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "World, funk, jazz, ambient & raretés",
    "about.yourLiked": "Tes tracks favoris",
    "about.legal": "Tous les tracks sont la propriété de leurs propriétaires et ayants droit respectifs. Cette plateforme ne revendique la propriété d'aucun contenu.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Lecture / Pause",
    "about.shortcutNext": "Track suivant",
    "about.shortcutPrev": "Track précédent",
    "about.shortcutShuffle": "Shuffle on/off",
    "about.shortcutMute": "Muet / Son",
    "about.shortcutLocate": "Localiser le track",
    "about.shortcutQueue": "Afficher la queue",
    "about.shortcutTab": "Changer de tab",
    "about.shortcutPanel": "Afficher ce panneau",

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
    "nav.saved": "保存済み",

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
    "auth.signInWithGoogle": "Googleでログイン",
    "auth.signOut": "ログアウト",
    "auth.savedTracks": "保存したトラック",
    "auth.saveTracksSync": "トラックを保存してデバイス間で同期",
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
    "player.locate": "トラックを探す (l)",
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
    "card.save": "保存",
    "card.saved": "保存済み!",
    "card.unlike": "削除",
    "card.loginToSave": "ログインして保存",

    // Saved
    "saved.signInToSave": "ログインして保存",
    "saved.noSavedYet": "保存したトラックはまだない",
    "saved.all": "すべて",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "保存した{filter}はまだない",
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
    "tutorial.clickToPlayDesc": "カードをクリックして聴き始めよう。",
    "tutorial.thePlayer": "プレイヤー",
    "tutorial.thePlayerDesc": "再生、一時停止、トラック探索、音量、shuffle — すべてここに。",
    "tutorial.browseYourWay": "自分のスタイルで探索",
    "tutorial.browseYourWayDesc": "Tracks、Samples、Mixes、保存済み — 各タブで違う音楽が見つかる。",
    "tutorial.filters": "フィルター",
    "tutorial.filtersDesc": "ジャンル・年代フィルターは近日公開。",
    "tutorial.yourMenu": "メニュー",
    "tutorial.yourMenuDesc": "テーマ、info、設定など — すべてプロフィールメニューに。",
    "tutorial.yourMenuDescMobile": "設定、info、保存したトラック — すべてプロフィールメニューに。",
    "tutorial.skipTitle": "Tutorialをスキップ？",
    "tutorial.skipDesc": "設定からいつでも再開できる。",
    "tutorial.continue": "続ける",
    "tutorial.skip": "スキップ",
    "tutorial.done": "完了",

    // Welcome
    "welcome.tagline": "新しい音楽を見つけよう",
    "welcome.signInPrompt": "気に入った？保存しよう。",
    "welcome.skip": "今はいい",

    // About
    "about.tagline": "ディガーのための音楽発見。すべて人の手で選曲。",
    "about.tags": "Tags",
    "about.trending": "最も再生された",
    "about.hiddenGems": "レア曲",
    "about.addedRecently": "新着",
    "about.shortcuts": "ショートカット",
    "about.tabs": "Tabs",
    "about.electronic": "アンダーグラウンドの電子音楽",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "ワールド、ファンク、ジャズ、ambient、レア音源",
    "about.yourLiked": "お気に入りのトラック",
    "about.legal": "すべてのトラックは各権利者の所有物です。本プラットフォームはコンテンツの所有権を主張しません。",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "再生 / 一時停止",
    "about.shortcutNext": "次のトラック",
    "about.shortcutPrev": "前のトラック",
    "about.shortcutShuffle": "Shuffle 切替",
    "about.shortcutMute": "ミュート 切替",
    "about.shortcutLocate": "トラックを探す",
    "about.shortcutQueue": "Queue 切替",
    "about.shortcutTab": "タブ切替",
    "about.shortcutPanel": "パネル切替",

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
    "nav.saved": "Сохранённые",

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
    "auth.signInWithGoogle": "Войти через Google",
    "auth.signOut": "Выйти",
    "auth.savedTracks": "Сохранённые треки",
    "auth.saveTracksSync": "Сохраняй треки и синхронизируй между устройствами",
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
    "player.locate": "Найти трек (l)",
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
    "card.save": "Сохранить",
    "card.saved": "Сохранено!",
    "card.unlike": "Убрать",
    "card.loginToSave": "Войди, чтобы сохранить",

    // Saved
    "saved.signInToSave": "Войди, чтобы сохранять",
    "saved.noSavedYet": "Пока нет сохранённых треков",
    "saved.all": "Все",
    "saved.tracks": "Tracks",
    "saved.mixes": "Mixes",
    "saved.samples": "Samples",
    "saved.noSavedFilter": "Пока нет сохранённых {filter}",
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
    "tutorial.clickToPlayDesc": "Нажми на любую карточку, чтобы начать слушать.",
    "tutorial.thePlayer": "Плеер",
    "tutorial.thePlayerDesc": "Воспроизведение, пауза, поиск, громкость, shuffle — всё здесь.",
    "tutorial.browseYourWay": "Исследуй по-своему",
    "tutorial.browseYourWayDesc": "Tracks, Samples, Mixes и Сохранённые — каждый tab показывает разную музыку.",
    "tutorial.filters": "Фильтры",
    "tutorial.filtersDesc": "Фильтры по жанру и году скоро появятся.",
    "tutorial.yourMenu": "Твоё меню",
    "tutorial.yourMenuDesc": "Тема, info, настройки и другое — всё в меню профиля.",
    "tutorial.yourMenuDescMobile": "Настройки, info и сохранённые треки — всё в меню профиля.",
    "tutorial.skipTitle": "Пропустить tutorial?",
    "tutorial.skipDesc": "Можно перезапустить из Настроек.",
    "tutorial.continue": "Продолжить",
    "tutorial.skip": "Пропустить",
    "tutorial.done": "Готово",

    // Welcome
    "welcome.tagline": "Открой новую музыку",
    "welcome.signInPrompt": "Понравилось? Сохрани.",
    "welcome.skip": "Не сейчас",

    // About
    "about.tagline": "Музыка для диггеров. Всё отобрано вручную.",
    "about.tags": "Tags",
    "about.trending": "Самые слушаемые",
    "about.hiddenGems": "Редкости",
    "about.addedRecently": "Новинки",
    "about.shortcuts": "Горячие клавиши",
    "about.tabs": "Tabs",
    "about.electronic": "Андеграунд электроника",
    "about.djSets": "DJ sets & live sets",
    "about.worldFunk": "World, funk, jazz, ambient и редкие находки",
    "about.yourLiked": "Твои любимые треки",
    "about.legal": "Все треки являются собственностью их владельцев и правообладателей. Платформа не претендует на права на какой-либо контент.",
    "about.projectPrefix": "",
    "about.projectSuffix": "· 2026",
    "about.shortcutPlayPause": "Воспроизведение / Пауза",
    "about.shortcutNext": "Следующий трек",
    "about.shortcutPrev": "Предыдущий трек",
    "about.shortcutShuffle": "Shuffle вкл/выкл",
    "about.shortcutMute": "Звук вкл/выкл",
    "about.shortcutLocate": "Найти трек",
    "about.shortcutQueue": "Показать queue",
    "about.shortcutTab": "Сменить tab",
    "about.shortcutPanel": "Показать панель",

    // Search
    "search.comingSoon": "Скоро",

    // Maintenance
    "maintenance.backSoon": "Скоро вернёмся",

    // Misc
    "misc.noMatchingGenres": "Нет подходящих жанров",
    "misc.clearAll": "Очистить всё",
  },
};
