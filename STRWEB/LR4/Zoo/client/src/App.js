import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import ProductDetails from './pages/Products/ProductDetails';
import ProductForm from './pages/Products/ProductForm';
import Suppliers from './pages/Suppliers/Suppliers';
import SupplierDetails from './pages/Suppliers/SupplierDetails';
import SupplierForm from './pages/Suppliers/SupplierForm';
import AuthForm from './pages/Auth/AuthForm';
import Profile from './pages/Auth/Profile';
import PetCareChat from './api/PetCareChat';

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/products/create" element={<ProductForm />} />
                <Route path="/products/edit/:id" element={<ProductForm />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:id" element={<SupplierDetails />} />
                <Route path="/suppliers/create" element={<SupplierForm />} />
                <Route path="/suppliers/edit/:id" element={<SupplierForm />} />
                <Route path="/login" element={<AuthForm mode="login" />} />
                <Route path="/register" element={<AuthForm mode="register" />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<PetCareChat />} />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;