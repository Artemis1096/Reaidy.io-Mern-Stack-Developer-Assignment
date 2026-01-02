import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="product-card skeleton-card">
            <div className="skeleton-image"></div>
            <div className="card-content">
                <div className="skeleton-text title"></div>
                <div className="skeleton-text price"></div>
                <div className="skeleton-text meta"></div>
                <div className="skeleton-btn"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;
