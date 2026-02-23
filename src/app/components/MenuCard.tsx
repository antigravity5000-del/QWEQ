'use client';

import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { MenuItem } from '../data/menu';
import styles from './MenuCard.module.css';
import { useCart } from '../context/CartContext';

interface MenuCardProps {
    item: MenuItem;
    mealGroup?: string;
}

export default function MenuCard({ item, mealGroup }: MenuCardProps) {
    const { addToCart, toggleFavorite, isFavorite } = useCart();
    const favoritestatus = isFavorite(item.id);

    // Default rating if not provided
    const rating = item.rating || 5;

    return (
        <div className={`${styles.card} ${item.available === false ? styles.unavailable : ''}`}>
            <div className={styles.imageContainer}>
                {item.isNew && item.available !== false && <span className={styles.newBadge}>NEW</span>}
                {item.available === false && <span className={styles.soldOutBadge}>SOLD OUT</span>}
                <button
                    className={styles.wishlistBtn}
                    aria-label="Add to wishlist"
                    onClick={() => toggleFavorite(item)}
                >
                    <Heart size={16} fill={favoritestatus ? "#D32F2F" : "white"} color={favoritestatus ? "#D32F2F" : "white"} />
                </button>
                {item.available === false && (
                    <div className={styles.soldOutContainer}>
                        <span className={styles.soldOutText}>Sold Out</span>
                    </div>
                )}
                <Image
                    src={item.image}
                    alt={item.name}
                    width={300}
                    height={200}
                    className={styles.productImage}
                    unoptimized
                />
            </div>

            <div className={styles.content}>
                <div className={styles.topRow}>
                    <h3 className={styles.title}>{item.name}</h3>
                    <button
                        className={styles.orderBtn}
                        onClick={() => addToCart(item, mealGroup)}
                        disabled={item.available === false}
                    >
                        {item.available === false ? 'Out of Stock' : (mealGroup ? `Add to ${mealGroup}` : 'Add Now')}
                    </button>
                </div>

                <div className={styles.bottomRow}>
                    <div className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={12}
                                fill={i < rating ? "#FF7A00" : "none"}
                                color="#FF7A00"
                            />
                        ))}
                    </div>
                    <span className={styles.price}>₦{item.price.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
