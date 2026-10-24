import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const empty = { name: '', email: '', phone: '', city: '', password: '', confirm: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState({ password: false, confirm: false });
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      setError('Примите условия сервиса');
      return;
    }
    if (form.password.length < 10) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    setError('');
    setPhoneError('');
    try {
      await register(form);
      navigate('/profile');
    } catch (err) {
      const message = err.message || 'Не удалось зарегистрироваться';
      if (message.includes('номер')) setPhoneError(message);
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="reg-page">
      <div className="reg-intro">
        <h1>Создайте аккаунт Torgo</h1>
        <p>Покупайте редкие вещи, участвуйте в торгах и продавайте с защищённой оплатой.</p>
      </div>
      <form className="reg-card" onSubmit={onSubmit}>
        {error ? <p className="form-banner form-banner--error">{error}</p> : null}
        <div className="reg-grid">
          <label>
            Имя
            <input required name="name" value={form.name} onChange={onChange} autoComplete="name" />
            <small>Как к вам обращаться</small>
          </label>
          <label>
            Email
            <input required type="email" name="email" value={form.email} onChange={onChange} autoComplete="email" />
            <small>На него придёт подтверждение</small>
          </label>
          <label>
            Телефон
            <input
              required
              name="phone"
              value={form.phone}
              onChange={onChange}
              autoComplete="tel"
              className={phoneError ? 'is-invalid' : ''}
              placeholder="+7 901 000-00-00"
            />
            <small className={phoneError ? 'is-invalid' : ''}>{phoneError || 'Для связи по сделке'}</small>
          </label>
          <label>
            Город
            <input required name="city" value={form.city} onChange={onChange} autoComplete="address-level2" />
            <small>Можно изменить позже</small>
          </label>
          <label>
            Пароль
            <span className="reg-secret">
              <input
                required
                minLength={6}
                type={show.password ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={onChange}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShow((prev) => ({ ...prev, password: !prev.password }))}>
                {show.password ? 'Скрыть' : 'Показать'}
              </button>
            </span>
            <small>Не менее 6 символов</small>
          </label>
          <label>
            Подтверждение пароля
            <span className="reg-secret">
              <input
                required
                minLength={6}
                type={show.confirm ? 'text' : 'password'}
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShow((prev) => ({ ...prev, confirm: !prev.confirm }))}>
                {show.confirm ? 'Скрыть' : 'Показать'}
              </button>
            </span>
            <small className={passwordsMatch ? 'is-ok' : ''}>{passwordsMatch ? 'Пароли совпадают' : 'Повторите пароль'}</small>
          </label>
        </div>
        <label className="reg-agree">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          <span>Я принимаю условия сервиса и политику конфиденциальности, подтверждаю, что мне исполнилось 18 лет.</span>
        </label>
        <button type="submit" className="btn btn-lg reg-submit" disabled={loading}>
          {loading ? 'Регистрация…' : 'Зарегистрироваться'}
        </button>
        <p className="reg-login">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
      <p className="reg-help">Нужна помощь? <a href="mailto:support@torgo.ru">support@torgo.ru</a></p>
    </section>
  );
}
