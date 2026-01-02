import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProductRecommendations } from '../api/client';
import { useCart } from '../context/CartContext';
import { useProductTracking } from '../hooks/trackingHooks';
import ProductCard from '../components/ProductCard';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart, isInCart } = useCart();
    const { trackAddToCart } = useProductTracking();

    useEffect(() => {
        // In a real app, fetch product details from API
        // For now, we'll create a mock product from the ID
        const mockProduct = {
            _id: id,
            name: `Product ${id}`,
            description: 'This is an amazing product with great features and quality. Perfect for your needs!',
            price: Math.floor(Math.random() * 900) + 100,
            category: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'][Math.floor(Math.random() * 5)],
            stock: Math.floor(Math.random() * 50) + 10,
        };
        setProduct(mockProduct);
        setLoading(false);

        const fetchSimilar = async () => {
            try {
                const recs = await getProductRecommendations(id);
                setSimilarProducts(recs);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSimilar();
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            trackAddToCart(product._id);
            addToCart(product);
        }
    };

    if (loading || !product) {
        return (
            <div className="page product-details">
                <div className="loading-state">Loading product...</div>
            </div>
        );
    }

    const inCart = isInCart(product._id);

    return (
        <div className="page product-details">
            <div className="product-details-container">
                <div className="product-main">
                    <div className="product-image-large">
                        <div className="image-placeholder-large">
                            <span className="category-badge-large">{product.category}</span>
                        </div>
                    </div>
                    <div className="product-info">
                        <h1>{product.name}</h1>
                        <p className="product-category">{product.category}</p>
                        <p className="product-price-large">${product.price.toFixed(2)}</p>
                        <p className="product-description">{product.description}</p>
                        <div className="product-stock">
                            {product.stock > 0 ? (
                                <span className="in-stock">✓ In Stock ({product.stock} available)</span>
                            ) : (
                                <span className="out-of-stock">✗ Out of Stock</span>
                            )}
                        </div>
                        <button 
                            className={`add-to-cart-btn ${inCart ? 'in-cart' : ''}`}
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            {inCart ? '✓ Added to Cart' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>

            {similarProducts.length > 0 && (
                <div className="recommendations-section">
                    <h3>Similar Items</h3>
                    <div className="product-grid">
                        {similarProducts.map(p => (
                            <ProductCard key={p._id} product={p} showExplanation={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
