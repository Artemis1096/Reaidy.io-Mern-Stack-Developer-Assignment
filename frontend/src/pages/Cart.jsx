import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCartRecommendations, createOrder } from '../api/client';
import ProductCard from '../components/ProductCard';
import './Cart.css';

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const data = await getCartRecommendations();
                setRecommendations(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [cartItems.length]); // Refetch when cart changes

    const handleQuantityChange = (productId, newQuantity) => {
        updateQuantity(productId, parseInt(newQuantity));
    };

    const subtotal = getCartTotal();
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            alert('Please login to checkout');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }

        setCheckoutLoading(true);
        setCheckoutError('');

        try {
            const items = cartItems.map(item => ({
                productId: item._id,
                quantity: item.quantity,
            }));

            const result = await createOrder(items);
            clearCart();
            alert(`Order placed successfully! Order ID: ${result.order._id}`);
            navigate('/');
        } catch (error) {
            setCheckoutError(error.response?.data?.message || error.message || 'Checkout failed');
            console.error('Checkout error:', error);
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="page cart-page">
                <div className="cart-empty">
                    <div className="empty-icon">🛒</div>
                    <h2>Your cart is empty</h2>
                    <p>Start shopping to add items to your cart!</p>
                    <a href="/" className="btn-primary">Continue Shopping</a>
                </div>

                {!loading && recommendations.length > 0 && (
                    <div className="recommendations-section">
                        <h3>You Might Also Like</h3>
                        <div className="product-grid">
                            {recommendations.map(p => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="page cart-page">
            <div className="cart-container">
                <div className="cart-items-section">
                    <div className="cart-header">
                        <h2>Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h2>
                        <button className="btn-clear" onClick={clearCart}>Clear Cart</button>
                    </div>

                    <div className="cart-items-list">
                        {cartItems.map((item) => (
                            <div key={item._id} className="cart-item">
                                <div className="cart-item-image">
                                    <div className="image-placeholder-small">
                                        <span>{item.category}</span>
                                    </div>
                                </div>
                                <div className="cart-item-details">
                                    <h4>{item.name}</h4>
                                    <p className="cart-item-category">{item.category}</p>
                                    <p className="cart-item-price">${(item.price || 0).toFixed(2)} each</p>
                                </div>
                                <div className="cart-item-controls">
                                    <div className="quantity-controls">
                                        <button 
                                            className="qty-btn"
                                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                                            className="quantity-input"
                                        />
                                        <button 
                                            className="qty-btn"
                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="cart-item-total">
                                        ${((item.price || 0) * item.quantity).toFixed(2)}
                                    </div>
                                    <button 
                                        className="remove-btn"
                                        onClick={() => removeFromCart(item._id)}
                                        title="Remove item"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="cart-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (10%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    {checkoutError && (
                        <div className="error-message" style={{ marginTop: '1rem' }}>
                            {checkoutError}
                        </div>
                    )}
                    {!isAuthenticated && (
                        <div className="checkout-warning">
                            Please login to checkout
                        </div>
                    )}
                    <button 
                        className="checkout-btn" 
                        onClick={handleCheckout}
                        disabled={checkoutLoading || !isAuthenticated || cartItems.length === 0}
                    >
                        {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                    </button>
                    <a href="/" className="continue-shopping">Continue Shopping</a>
                </div>
            </div>

            {!loading && recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h3>You Might Also Like</h3>
                    <div className="product-grid">
                        {recommendations.map(p => (
                            <ProductCard key={p._id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
