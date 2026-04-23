"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/LanguageProvider";

interface Props {
  playerVisible?: boolean;
}

export default function LinkCopiedToast({ playerVisible = false }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 2200);
    };
    document.addEventListener("link-copied", handler);
    return () => {
      document.removeEventListener("link-copied", handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 min-[1152px]:left-[calc(var(--sidebar-width)/2+50%)] ${playerVisible ? "bottom-[calc(var(--player-height,0px)+12px)]" : "bottom-3"}`}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="px-3.5 py-2 bg-[var(--bg-alt)]/90 backdrop-blur-xl border border-[var(--border)]/50 rounded-lg shadow-2xl font-mono text-[11px] uppercase tracking-wider text-[var(--text)]"
          >
            {t("toast.linkCopied")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
