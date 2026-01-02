import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductTracking } from '../hooks/trackingHooks';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, showExplanation = true }) => {
    const navigate = useNavigate();
    const { trackClick, trackAddToCart } = useProductTracking();
    const { addToCart, isInCart } = useCart();

    const handleClick = () => {
        trackClick(product._id);
        navigate(`/product/${product._id}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        trackAddToCart(product._id);
        addToCart(product);
    };

    const inCart = isInCart(product._id);

    return (
        <div className="product-card" onClick={handleClick}>
            <div className="card-image">
                <div className="image-placeholder">
                    <span className="category-badge">{product.category}</span>
                </div>
            </div>
            <div className="card-content">
                <h4 className="product-name">{product.name}</h4>
                <p className="price">${(product.price || 99).toFixed(2)}</p>

                {showExplanation && product.explanation && (
                    <div className="ai-explanation">
                        <small>✨ {product.explanation}</small>
                    </div>
                )}

                <button 
                    className={`add-btn ${inCart ? 'in-cart' : ''}`} 
                    onClick={handleAddToCart}
                >
                    {inCart ? '✓ In Cart' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
