// เดียลอกยืนยัน — ใช้แทน window.confirm เพื่อสไตล์มืด/glass สอดคล้องทั้งแอป
export default function ConfirmDialog({
  title = 'ยืนยัน',
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'confirm-btn danger' : 'confirm-btn'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'กำลังทำงาน...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
