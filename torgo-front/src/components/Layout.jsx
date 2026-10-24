import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx';
import Header from './Header.jsx';

export default function Layout() {
  return (
    <>
      <Header />
      <main id="top">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
