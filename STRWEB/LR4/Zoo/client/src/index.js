import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/variables.css';
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { NotificationProvider } from "./context/NotificationContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <NotificationProvider>
                <AuthProvider>
                    <ProductProvider>
                        <CartProvider>
                            <App />
                        </CartProvider>
                    </ProductProvider>
                </AuthProvider>
            </NotificationProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);