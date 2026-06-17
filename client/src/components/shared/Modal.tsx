import { HTMLAttributes, useEffect } from "react";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, showCloseButton = true, children, ...props }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose && onClose();
    }

    if (!isOpen) return;
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      {...props}
      className={`fixed inset-0 z-50 flex items-center justify-center cursor-auto ${props.className ?? ""}`}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
        onClick={() => onClose && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-gray-800 text-gray-100 rounded-lg max-w-2xl w-full mx-4 p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          {title ? <h3 className="text-2xl font-bold">{title}</h3> : <div />}

          {showCloseButton && (
            <button
              aria-label="Close"
              className="ml-4 bg-transparent p-1 rounded-full hover:opacity-90"
              onClick={() => onClose && onClose()}
            >
              ✖
            </button>
          )}
        </div>

        <div className="">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
