import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: localStorage.getItem('torgo-email') || '',
    password: '',
  });
  const [remember, setRemember] = useState(Boolean(localStorage.getItem('torgo-email')));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email: form.email, password: form.password });
      if (remember) localStorage.setItem('torgo-email', form.email);
      else localStorage.removeItem('torgo-email');
      navigate('/profile');
    } catch {
      setError('Email или пароль не совпадают. Проверьте данные и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-intro">
        <h1>С возвращением</h1>
        <p>Войдите, чтобы продолжить покупки и следить за ставками.</p>
      </div>
      <form className="login-card" onSubmit={onSubmit}>
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
        <label>
          Email
          <input required type="email" name="email" value={form.email} autoComplete="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Пароль
          <span className="reg-secret">
            <input
              required
              className={error ? 'is-invalid' : ''}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              autoComplete="current-password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          </span>
        </label>
        <div className="login-row">
          <label className="reg-agree">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Запомнить меня</span>
          </label>
          <a href="mailto:support@torgo.ru">Забыли пароль?</a>
        </div>
        <button type="submit" className="btn btn-lg reg-submit" disabled={loading}>
          {loading ? 'Вход…' : 'Войти'}
        </button>
        <p className="reg-login">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </section>
  );
}
