export type Locale = "es" | "en";

export const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Navigation
    "nav.forYou": "Para ti",
    "nav.mixes": "Mixes",
    "nav.samples": "Samples",
    "nav.saved": "Guardados",

    // Settings
    "settings.title": "AJUSTES",
    "settings.theme": "Tema",
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
    "auth.theme": "Tema",
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
    "saved.signInToSave": "Inicia sesión para guardar tracks",
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
    "tutorial.browseYourWayDesc": "Tracks, Samples, Mixes y Guardados — cada tab muestra música diferente.",
    "tutorial.filters": "Filtros",
    "tutorial.filtersDesc": "Filtros por género y año próximamente.",
    "tutorial.yourMenu": "Tu menú",
    "tutorial.yourMenuDesc": "Tema, acerca de, ajustes y más — todo en tu menú de perfil.",
    "tutorial.yourMenuDescMobile": "Ajustes, acerca de y tracks guardados — todo en tu menú de perfil.",
    "tutorial.skipTitle": "¿Saltar tutorial?",
    "tutorial.skipDesc": "Puedes reiniciarlo desde Ajustes.",
    "tutorial.continue": "Continuar",
    "tutorial.skip": "Saltar",
    "tutorial.done": "Listo",

    // Welcome
    "welcome.tagline": "Música por descubrir",
    "welcome.signInPrompt": "Inicia sesión para guardar tus hallazgos.",
    "welcome.skip": "Saltar por ahora",

    // About
    "about.tagline": "Música selecta para diggers. Todo seleccionado a mano.",
    "about.tags": "Tags",
    "about.trending": "En tendencia",
    "about.hiddenGems": "Joyas ocultas",
    "about.addedRecently": "Agregados recientemente",
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
    "settings.theme": "Theme",
    "settings.speedAdjust": "Speed Adjust",
    "settings.tutorial": "Tutorial",
    "settings.about": "About",
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
    "auth.theme": "Theme",
    "auth.settings": "Settings",
    "auth.about": "About",

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
    "saved.signInToSave": "Sign in to save tracks",
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
    "welcome.signInPrompt": "Sign in to save your finds.",
    "welcome.skip": "Skip for now",

    // About
    "about.tagline": "Music discovery for diggers. All human-selected.",
    "about.tags": "Tags",
    "about.trending": "Trending picks",
    "about.hiddenGems": "Hidden gems",
    "about.addedRecently": "Added recently",
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
};
