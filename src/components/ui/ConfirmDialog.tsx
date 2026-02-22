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
        <p className="text-sm text-primary">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm action-text border border-default rounded-lg hover:bg-active-highlight disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold uppercase tracking-label transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmVariant === "danger"
                ? "text-danger hover:text-danger/80 border border-danger/20 hover:bg-danger/10"
                : "text-secondary hover:text-primary border border-default hover:bg-active-highlight"
            }`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

