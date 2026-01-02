import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendEvent } from '../api/client';

export const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        // Track page view on location change
        sendEvent('view', {
            metadata: {
                path: location.pathname,
                search: location.search,
            },
        });
    }, [location]);
};

export const useProductTracking = () => {
    const trackClick = (productId) => {
        sendEvent('click', { productId });
    };

    const trackAddToCart = (productId) => {
        sendEvent('add_to_cart', { productId });
    };

    const trackPurchase = (productId, price) => {
        sendEvent('purchase', { productId, metadata: { price } });
    };

    return { trackClick, trackAddToCart, trackPurchase };
};
