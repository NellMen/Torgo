import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { formatPrice } from '../utils/catalog.js';

function digits(value) {
  const raw = String(value).replace(/[^\d]/g, '');
  return raw ? Number(raw) : 0;
}

export default function BidModal({
  open,
  onClose,
  lotId,
  title,
  minAmount = 0,
  step = 0,
  onSubmit,
}) {
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(Number(minAmount) || 0);
    setError('');
    setPending(false);
  }, [open, minAmount]);

  const tooLow = amount > 0 && amount < Number(minAmount);
  const shownError = tooLow
    ? `Ставка должна быть не ниже ${formatPrice(minAmount)}`
    : error;

  const change = (value) => {
    setAmount(digits(value));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || amount < Number(minAmount)) {
      setError(`Ставка должна быть не ниже ${formatPrice(minAmount)}`);
      return;
    }
    try {
      setPending(true);
      await onSubmit?.(amount);
    } catch (err) {
      setError(err.message || 'Ставка отклонена');
    } finally {
      setPending(false);
    }
  };

  const formatted = amount
    ? `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`
    : '';

  return (
    <Modal open={open} onClose={onClose} title="Сделать ставку" className="modal-panel--bid">
      <p className="bid-lot">
        Лот {lotId} — {title}
      </p>
      <form onSubmit={submit}>
        <label className="bid-label" htmlFor="bid-amount">
          Сумма ставки
        </label>
        <input
          id="bid-amount"
          className={`bid-amount ${shownError ? 'is-invalid' : ''}`}
          inputMode="numeric"
          value={formatted}
          onChange={(e) => change(e.target.value)}
        />
        {shownError ? <p className="bid-error">{shownError}</p> : null}
        <div className="bid-note">
          Минимальная ставка включает текущую цену и шаг {formatPrice(step)}. Комиссия покупателя 5%
          начисляется отдельно.
        </div>
        <button type="submit" className="bid-submit" disabled={pending || !amount || amount < Number(minAmount)}>
          Подтвердить ставку
        </button>
      </form>
    </Modal>
  );
}
