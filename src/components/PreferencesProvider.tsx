"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SavedViewMode = "grid" | "list";

interface Preferences {
  gridCols: number;
  reducedAnimations: boolean;
  savedViewMode: SavedViewMode;
}

interface PreferencesContextValue extends Preferences {
  setGridCols: (cols: number) => void;
  setReducedAnimations: (v: boolean) => void;
  setSavedViewMode: (mode: SavedViewMode) => void;
}

const defaults: Preferences = {
  gridCols: 5,
  reducedAnimations: false,
  savedViewMode: "grid",
};

const PreferencesContext = createContext<PreferencesContextValue>({
  ...defaults,
  setGridCols: () => {},
  setReducedAnimations: () => {},
  setSavedViewMode: () => {},
});

export const usePreferences = () => useContext(PreferencesContext);

const STORAGE_KEY = "digeart-prefs";

export default function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [gridCols, setGridColsState] = useState(defaults.gridCols);
  const [reducedAnimations, setReducedAnimationsState] = useState(defaults.reducedAnimations);
  const [savedViewMode, setSavedViewModeState] = useState<SavedViewMode>(defaults.savedViewMode);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.gridCols === "number") setGridColsState(parsed.gridCols); // eslint-disable-line react-hooks/set-state-in-effect
        if (typeof parsed.reducedAnimations === "boolean") setReducedAnimationsState(parsed.reducedAnimations);
        if (parsed.savedViewMode === "grid" || parsed.savedViewMode === "list") setSavedViewModeState(parsed.savedViewMode);
      }
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ gridCols, reducedAnimations, savedViewMode })
      );
    } catch {}
  }, [gridCols, reducedAnimations, savedViewMode]);

  const setGridCols = (cols: number) => {
    setGridColsState(Math.max(3, Math.min(7, cols)));
  };

  const setReducedAnimations = (v: boolean) => {
    setReducedAnimationsState(v);
  };

  const setSavedViewMode = (mode: SavedViewMode) => {
    setSavedViewModeState(mode);
  };

  return (
    <PreferencesContext.Provider
      value={{ gridCols, reducedAnimations, savedViewMode, setGridCols, setReducedAnimations, setSavedViewMode }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
