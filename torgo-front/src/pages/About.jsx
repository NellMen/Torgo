const steps = [
  ['01', 'Найдите', 'Выберите объявление или онлайн-аукцион с прозрачной историей.'],
  ['02', 'Проверьте', 'Изучите верификацию, экспертизу, рейтинг и условия доставки.'],
  ['03', 'Оплатите', 'Средства резервируются и остаются защищёнными до получения.'],
  ['04', 'Получите', 'Осмотрите покупку и только затем подтвердите сделку.'],
];

const roles = [
  ['Продукт', 'Понятный путь от поиска вещи до диалога.'],
  ['Дизайн', 'Ясные интерфейсы и внимание к деталям.'],
  ['Разработка', 'Логика и инструменты для работы платформы.'],
];

const principles = [
  ['Безопасность по умолчанию', 'Проверки и защита встроены в путь сделки, а не спрятаны в настройках.'],
  ['Прозрачность', 'Показываем комиссии, историю ставок, статус продавца и ограничения заранее.'],
  ['Справедливое решение', 'Споры рассматривает отдельная команда на основе фактов и заключений экспертов.'],
  ['Уважение к контексту', 'Локализуем оплату, доставку и поддержку без снижения единого стандарта.'],
];

const press = [
  ['РБК Стиль', '«Площадка, которая сделала происхождение вещи частью интерфейса»', '12 сентября 2026'],
  ['Forbes', '«Как escrow-модель меняет рынок коллекционных товаров»', '28 августа 2026'],
  ['The Blueprint', '«Новая этика владения: почему редкие вещи снова в движении»', '04 июля 2026'],
];

const partners = ['ЮKassa', 'СДЭК', 'DHL Express', 'Ingosstrakh', 'Swiss Appraisal', 'Art & Fact', 'Kaspersky', 'CloudPayments'];

const faq = [
  ['01', 'Как Torgo проверяет продавцов?', 'Мы сверяем документы, реквизиты и историю продаж. Для дорогих категорий подключаем профильных экспертов и ручную проверку происхождения.'],
  ['02', 'Где находятся деньги во время сделки?', 'Оплата резервируется на защищённом счёте платёжного партнёра и перечисляется продавцу только после подтверждения получения.'],
  ['03', 'Можно ли участвовать в торгах из другой страны?', 'Да. Мы показываем доступные способы оплаты и доставки для каждой пары стран до того, как вы сделаете ставку.'],
  ['04', 'Что делать, если товар не соответствует описанию?', 'Откройте спор в течение 48 часов после получения. Команда поддержки изучит фото, переписку и заключение эксперта.'],
  ['05', 'На каких языках работает поддержка?', 'Русский, английский, немецкий, французский, итальянский, турецкий, грузинский и казахский — всего 8 языков.'],
];

export default function About() {
  return (
    <div className="about">
      <section className="about-hero">
        <p className="about-label">Миссия</p>
        <h1>Дать вещам новую историю</h1>
        <p>Мы хотим, чтобы интересные вещи находили новых владельцев, а люди могли выбирать осознанно и общаться напрямую.</p>
        <small>Фото города используется как фон. Это не местоположение Torgo.</small>
      </section>

      <section className="about-band about-band--white">
        <div className="wrap">
          <p className="about-kicker">Как это работает</p>
          <h2>Как работает Torgo</h2>
          <p className="about-lead">Четыре понятных шага — от первой находки до подтверждённого получения.</p>
          <div className="about-steps">
            {steps.map(([num, title, text]) => (
              <article key={num}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-team">
        <div className="wrap">
          <p className="about-label about-label--ink">Команда</p>
          <h2>Общее дело, разные задачи</h2>
          <p className="about-lead">Направления работы над продуктом, а не список сотрудников.</p>
          <div className="about-roles">
            {roles.map(([title, text]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-band about-band--white">
        <div className="wrap">
          <p className="about-kicker">Принципы продукта</p>
          <h2>Принципы продукта</h2>
          <p className="about-lead">Мы принимаем решения по четырём правилам — они одинаковы для покупателя, продавца и самой команды Torgo.</p>
          <div className="about-principles">
            {principles.map(([title, text]) => (
              <article key={title}>
                <span className="about-icon" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-band">
        <div className="wrap">
          <p className="about-kicker">О нас пишут</p>
          <h2>О нас пишут</h2>
          <p className="about-lead">Независимые медиа отмечают, как Torgo соединяет культуру коллекционирования и финтех-дисциплину.</p>
          <div className="about-press">
            {press.map(([source, quote, date]) => (
              <article key={source}>
                <span>{source}</span>
                <h3>{quote}</h3>
                <footer>
                  <time>{date}</time>
                  <em>Читать →</em>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-band about-band--white">
        <div className="wrap">
          <p className="about-kicker">Партнёры инфраструктуры</p>
          <h2>Партнёры инфраструктуры</h2>
          <p className="about-lead">Платежи, экспертиза, страхование и доставка — с компаниями, чьи процессы выдерживают проверку.</p>
          <div className="about-partners">
            {partners.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="about-band">
        <div className="wrap">
          <p className="about-kicker">Частые вопросы</p>
          <h2>Частые вопросы</h2>
          <p className="about-lead">Коротко о проверках, оплате, международных сделках и поддержке.</p>
          <div className="about-faq">
            {faq.map(([num, question, answer]) => (
              <article key={num}>
                <span>{num}</span>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-support">
        <p className="about-label">Контакты</p>
        <h2>Напишите в поддержку</h2>
        <a href="mailto:support@torgo.ru">support@torgo.ru</a>
        <p>По вопросам работы с Torgo.</p>
        <small>Иллюстративное фото, не фактический офис Torgo.</small>
      </section>
    </div>
  );
}
