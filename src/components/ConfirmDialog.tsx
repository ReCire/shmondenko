import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

/**
 * Global brutalist confirmation modal, driven by `requestConfirm()` in the store.
 * Rendered once in App so it sits above every screen, including the fixed player.
 */
export function ConfirmDialog() {
  const dialog = useAppStore((s) => s.confirmDialog)
  const clearConfirm = useAppStore((s) => s.clearConfirm)

  const cancel = useCallback(() => {
    useAppStore.getState().confirmDialog?.onCancel?.()
    clearConfirm()
  }, [clearConfirm])
  const confirm = useCallback(() => {
    useAppStore.getState().confirmDialog?.onConfirm()
    clearConfirm()
  }, [clearConfirm])

  // Esc cancels; Enter confirms. Listener only exists while a dialog is open.
  // Captured so the player's own key shortcuts don't fire underneath the modal.
  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        cancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        confirm()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [dialog, cancel, confirm])

  return (
    <AnimatePresence>
      {dialog && (
        <motion.div
          key="confirm-dialog"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={cancel}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 backdrop-blur-md sm:items-center safe-pb"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border-[3px] border-paper bg-ink text-paper shadow-[0_32px_80px_-24px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between border-b-[3px] border-paper px-5 py-2.5">
              <span className="font-mono font-semibold text-label tracking-[0.25em] text-paper/60">CONFIRMATION REQUIRED</span>
              <AlertTriangle size={14} className="text-soviet" />
            </div>

            <div className="px-5 pb-6 pt-5">
              <h2 id="confirm-title" className="text-3xl font-black uppercase leading-[0.95] tracking-tighter">
                {dialog.title}
              </h2>
              <p id="confirm-message" className="mt-3 text-base leading-relaxed text-paper/70">
                {dialog.message}
              </p>
            </div>

            <div className="grid grid-cols-2 border-t-[3px] border-paper">
              <button
                type="button"
                onClick={cancel}
                autoFocus
                className="py-5 font-mono text-xs font-bold tracking-[0.3em] text-paper/70 transition-colors active:bg-paper/10"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirm}
                className="border-l-[3px] border-paper bg-soviet py-5 font-mono text-xs font-bold tracking-[0.3em] text-[#f4f1ea] transition-colors active:bg-soviet-deep"
              >
                CONFIRM
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
