import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import Layout from './components/Layout.jsx';
import About from './pages/About.jsx';
import AuctionDetail from './pages/AuctionDetail.jsx';
import AuctionsCatalog from './pages/AuctionsCatalog.jsx';
import CreateListing from './pages/CreateListing.jsx';
import Favorites from './pages/Favorites.jsx';
import Home from './pages/Home.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import ListingsCatalog from './pages/ListingsCatalog.jsx';
import Login from './pages/Login.jsx';
import Messages from './pages/Messages.jsx';
import Profile from './pages/Profile.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import Register from './pages/Register.jsx';
import AdminReview from './pages/admin/AdminReview.jsx';
import AdminAttributes from './pages/admin/Attributes.jsx';
import AdminAuctionsModeration from './pages/admin/AuctionsModeration.jsx';
import AdminCategories from './pages/admin/Categories.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminListingsModeration from './pages/admin/ListingsModeration.jsx';
import AdminUsers from './pages/admin/Users.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="listings" element={<ListingsCatalog />} />
        <Route path="listings/:id" element={<ListingDetail />} />
        <Route path="auctions" element={<AuctionsCatalog />} />
        <Route path="auctions/:id" element={<AuctionDetail />} />
        <Route path="create-listing" element={<CreateListing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users/:id" element={<PublicProfile />} />
        <Route path="messages" element={<Messages />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="about" element={<About />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="listings" element={<AdminListingsModeration />} />
          <Route path="listings/:id" element={<AdminReview kind="listing" />} />
          <Route path="auctions" element={<AdminAuctionsModeration />} />
          <Route path="auctions/:id" element={<AdminReview kind="auction" />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="attributes" element={<AdminAttributes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
