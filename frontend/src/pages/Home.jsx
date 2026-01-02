import React, { useEffect, useState } from 'react';
import { getHomeRecommendations } from '../api/client';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                setError(null);
                const data = await getHomeRecommendations();
                setProducts(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load recommendations. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, []);

    return (
        <div className="page home-page">
            <header className="hero">
                <h1>For You</h1>
                <p>Personalized picks based on your style.</p>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="product-grid">
                {loading ? (
                    // Show 8 skeletons while loading
                    Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    products.map(p => (
                        <ProductCard key={p._id} product={p} />
                    ))
                )}

                {!loading && !error && products.length === 0 && (
                    <p>No recommendations found. Start browsing to get suggestions!</p>
                )}
            </div>
        </div>
    );
};

export default Home;
