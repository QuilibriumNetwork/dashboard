import { Button } from "./Button";
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
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant === "danger" ? "danger" : "burgundy"}
            size="small"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
