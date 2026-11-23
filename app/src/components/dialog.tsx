import { useEffect, useRef } from "preact/hooks";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      class="dialog"
      onClose={() => {
        if (open) onCancel();
      }}
    >
      <h2>{title}</h2>
      <p>{body}</p>
      <div class="dialog-actions">
        <button type="button" class="btn btn--secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" class="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
