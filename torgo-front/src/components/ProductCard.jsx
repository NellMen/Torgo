import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/catalog.js';
import AuctionTimer from './AuctionTimer.jsx';

export default function ProductCard({
  item,
  to,
  type = 'listing',
  className = '',
  showTimer = false,
  badge = '',
  locked = false,
}) {
  const href = to || (type === 'auction' ? `/auctions/${item.id}` : `/listings/${item.id}`);
  const cardClass = ['card', item.extra && 'card-extra', className].filter(Boolean).join(' ');
  const inner = (
    <>
      {badge ? <em className="card-badge">{badge}</em> : null}
      <img src={item.image} alt={item.title} loading="lazy" />
      <div className="card-body">
        {showTimer && item.endsAt ? <AuctionTimer endsAt={item.endsAt} compact /> : null}
        <p className="price">{formatPrice(item.price)}</p>
        <p className="title">{item.title}</p>
        <p className="city">{item.city || 'Город не указан'}</p>
      </div>
    </>
  );

  return (
    <article className={cardClass}>
      {locked ? <div className="card-link">{inner}</div> : <Link to={href} className="card-link">{inner}</Link>}
    </article>
  );
}
