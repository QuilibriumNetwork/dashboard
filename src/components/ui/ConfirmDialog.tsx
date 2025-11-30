import Modal from "./Modal";

interface ConfirmDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "default";
  isLoading?: boolean;
}

export function ConfirmDialog({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      minHeight="min-h-0"
    >
      <div className="space-y-6">
        <p className="text-sm text-burgundy dark:text-white">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white transition-colors border border-burgundy/20 dark:border-white/20 rounded-lg hover:bg-burgundy/10 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmVariant === "danger"
                ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-600/20 dark:border-red-400/20 hover:bg-red-600/10 dark:hover:bg-red-400/10"
                : "text-burgundy/70 hover:text-burgundy dark:text-white/70 dark:hover:text-white border border-burgundy/20 dark:border-white/20 hover:bg-burgundy/10 dark:hover:bg-white/10"
            }`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

