import React, { useEffect, useRef } from "react";

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  minHeight?: string;
  titleClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  show,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
  maxHeight = "max-h-[90vh]",
  minHeight = "min-h-80",
  titleClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex justify-center items-center modal-overlay transition-opacity duration-300 ${
        show
          ? "opacity-100 pointer-events-auto backdrop-blur-sm"
          : "opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
      onClick={onClose}
      tabIndex={-1}
    >
      <div
        className={`w-full ${maxWidth} ${maxHeight} ${minHeight} relative flex flex-col transform transition-all duration-300 ${
          show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="bg-white dark:bg-[#1a0f27] rounded-xl shadow-lg flex flex-col h-full overflow-hidden mx-5 border border-burgundy/10 dark:border-white/10">
          <div className="flex justify-between items-center p-6 border-b border-burgundy/10 dark:border-white/10">
            <h2
              className={
                titleClassName ||
                "text-2xl font-semibold text-burgundy dark:text-white gradient-sweep mb-0"
              }
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-burgundy/60 dark:text-white/60 hover:text-burgundy dark:hover:text-white cursor-pointer transition-colors duration-200"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          <div className="p-6 overflow-y-auto text-burgundy dark:text-white">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
