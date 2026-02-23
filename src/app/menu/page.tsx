'use client';

import { useState, useEffect } from 'react';
import MenuCard from '../components/MenuCard';
import styles from './page.module.css';
import { RefreshCw } from 'lucide-react';

export default function MenuPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeMealGroup, setActiveMealGroup] = useState<string>('Order 1');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch('/api/menu', { cache: 'no-store' });
                const data = await res.json();
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const filteredItems = activeCategory === 'All'
        ? items
        : items.filter(item => item.category === activeCategory);

    const categoriesList = ['All', ...new Set(items.map((i: any) => i.category))];

    if (loading) {
        return (
            <div style={{ padding: '10rem 0', textAlign: 'center' }}>
                <RefreshCw size={40} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />
                <p>Browsing Menu...</p>
            </div>
        );
    }

    return (
        <main style={{ padding: '2rem 0' }}>
            <div className="container">
                <h1 className={styles.title}>Our Menu</h1>

                <div className={styles.tabs}>
                    {categoriesList.map((category: any) => (
                        <button
                            key={category}
                            className={`${styles.tab} ${activeCategory === category ? styles.activeTab : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className={styles.mealSelector}>
                    <span className={styles.mealLabel}>Ordering for:</span>
                    <div className={styles.mealOptions}>
                        {[
                            { id: 'Order 1', label: 'Order 1' },
                            { id: 'Order 2', label: 'Order 2' },
                            { id: 'Order 3', label: 'Order 3' },
                        ].map(group => (
                            <button
                                key={group.label}
                                className={`${styles.mealBtn} ${activeMealGroup === group.id ? styles.mealBtnActive : ''}`}
                                onClick={() => setActiveMealGroup(group.id)}
                            >
                                {group.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.grid}>
                    {filteredItems.map(item => (
                        <MenuCard key={item.id} item={item} mealGroup={activeMealGroup} />
                    ))}
                </div>
            </div>
        </main>
    );
}

