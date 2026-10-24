import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="wrap footer-grid">
        <div>
          <h3>Покупателям</h3>
          <Link to="/about">Как покупать</Link>
          <Link to="/about">Безопасная сделка</Link>
          <Link to="/about">Доставка</Link>
          <Link to="/about">Возвраты</Link>
        </div>
        <div>
          <h3>Продавцам</h3>
          <Link to="/about">Как продавать</Link>
          <Link to="/about">Тарифы</Link>
          <Link to="/about">Продвижение</Link>
          <Link to="/about">Правила</Link>
        </div>
        <div>
          <h3>Аукционы</h3>
          <Link to="/auctions">Торги</Link>
          <Link to="/auctions">Как сделать ставку</Link>
          <Link to="/auctions">Комиссии</Link>
          <Link to="/auctions">Архив торгов</Link>
        </div>
        <div>
          <h3>О Торго</h3>
          <Link to="/about">О компании</Link>
          <Link to="/about">Карьера</Link>
          <Link to="/about">Пресс-центр</Link>
          <Link to="/about">Контакты</Link>
        </div>
        <div>
          <h3>Поддержка</h3>
          <Link to="/about">Центр помощи</Link>
          <Link to="/about">Сообщить о проблеме</Link>
          <Link to="/about">Безопасность</Link>
          <Link to="/about">Документы</Link>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 Торго. Все права защищены.</span>
        <span>Объявления и онлайн-аукционы с безопасной сделкой</span>
      </div>
    </footer>
  );
}
