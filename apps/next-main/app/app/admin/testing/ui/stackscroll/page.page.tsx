'use client'
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const gradients = [
    'from-pink-500 to-purple-500 animate-fadeIn',
    'from-blue-500 to-teal-500 animate-fadeIn',
    'from-green-500 to-yellow-500 animate-fadeIn',
    'from-red-500 to-orange-500 animate-fadeIn',
    'from-indigo-500 to-purple-500 animate-fadeIn',
];

// Mock data array
const allItems = Array.from({ length: 300 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
    content: `This is the content for item ${i + 1}. It provides detailed information about the topic.`
}));

// Mock server function
const fetchItems = (start: number, limit: number): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(allItems.slice(start, start + limit));
        }, 1000); // 1 second delay to simulate network request
    });
};

const SkeletonCard = ({ cardHeight }: { cardHeight: number }) => (
    <div className="c-card animate-pulse" style={{ height: `${cardHeight}px` }}>
        <div className="c-card-content bg-gray-200">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
    </div>
);

const FadeCard = ({ item, index, cardHeight, visibleCards, cardPosition, opacity, zIndex, overlap, gradients, translateY }: { zIndex: number, opacity: number, item: any, index: number, cardHeight: number, visibleCards: number, cardPosition: number, overlap: number, gradients: string[], translateY: string }) => {
    return (
        <div
            key={item.id}
            className="c-card text-black"
            style={{
                top: `${Math.max(0, Math.min(visibleCards - 1, cardPosition)) * (cardHeight * overlap)}px`,
                zIndex,
                opacity: Math.max(0, opacity),
                transform: `scale(${opacity * 0.2 + 0.8}) translateY(${translateY})`,
            }}
        >
            <div className="c-card-content">
                <div className={`gradient-bar bg-gradient-to-r ${gradients[index % gradients.length]}`}></div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.content}</p>
            </div>
        </div>
    );
}

const StackedFolderTabs = ({ controls }: { controls: any }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [items, setItems] = useState<({ type: 'card', id: string, title: string, content: string } | { type: 'loading' })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const cardHeight = controls.cardHeight;
    const visibleCards = controls.visibleCards;
    const fadeSpeed = controls.fadeSpeed;
    const overlap = controls.overlap;

    const loadMoreItems = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const newItems = await fetchItems(items.length, 5);
            if (newItems.length === 0) {
                setHasMore(false);
            } else {
                setItems(prevItems => [...prevItems, ...newItems]);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setIsLoading(false);
        }
    }, [items.length, isLoading, hasMore]);

    useEffect(() => {
        loadMoreItems();
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const handleScroll = () => {
                setScrollPosition(container.scrollTop);
                if (container.scrollHeight - container.scrollTop <= container.clientHeight * 1.5) {
                    loadMoreItems();
                }
            };

            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [loadMoreItems]);

    return (
        <div ref={containerRef} className="relative bg-gray-800 h-screen overflow-y-auto">
            <style jsx>{`
        .c-cards-list {
          padding: ${cardHeight}px 20px;
          padding-bottom: 100dvh;
        }
        .c-card {
          position: sticky;
          height: ${cardHeight}px;
          transition: all ${fadeSpeed}s ease;
          margin-bottom: ${-cardHeight * (1 - overlap)}px;
        }
        .c-card-content {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all ${fadeSpeed}s ease;
          height: 100%;
          overflow: hidden;
        }
        .gradient-bar {
          height: 30px;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
      `}</style>
            <div className="c-cards-list">
                {[...items, ...(isLoading ? [{ type: 'loading' as const }, { type: 'loading' as const }, { type: 'loading' as const }] : [])].map((item, index) => {
                    const cardPosition = index - Math.floor(scrollPosition / (cardHeight * overlap));
                    const isVisible = Math.abs(cardPosition) < visibleCards;
                    const opacity = isVisible ? 1 - Math.abs(cardPosition) / visibleCards : 0;
                    const scale = isVisible ? 1 - Math.abs(cardPosition) * 0.05 : 0.9;
                    const zIndex = items.length - Math.abs(cardPosition);
                    const translateY = cardPosition < 0 ? `${-cardPosition * 10}px` : '0';
                    const isFocused = opacity === 1;

                    return (
                        <div
                            key={item.type === 'card' ? item.id : index}
                            className="c-card text-black"
                            style={{
                                top: `${Math.max(0, Math.min(visibleCards - 1, cardPosition)) * (cardHeight * overlap)}px`,
                                zIndex,
                                opacity: Math.max(0, opacity),
                                transform: `scale(${opacity * 0.2 + 0.8}) translateY(${translateY})`,
                            }}
                        >
                            <div className={`c-card-content ${isFocused ? '' : 'grayscale-75'}`}>
                                {
                                    item.type === 'loading' ?
                                        <SkeletonCard cardHeight={cardHeight} />
                                        :
                                        <>
                                            <div className={`gradient-bar bg-gradient-to-r ${gradients[index % gradients.length]}`}>
                                                <h3 className={`text-white text-xl font-semibold mb-2 p-1`}>{item.title}</h3>
                                            </div>
                                            <p className="text-gray-600 text-sm pt-5">{item.content}</p>
                                        </>

                                }

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StackedFolderTabsDemo = () => {
    const [controls] = useState({
        cardHeight: 180,
        visibleCards: 5,
        fadeSpeed: 0.3,
        overlap: 0.2,
    });

    return (
        <div className="bg-gray-800 h-screen flex flex-col">
            <h1 className="text-4xl font-bold p-8 text-center text-white">Dynamic Stacked Cards</h1>
            <div className="flex-1 overflow-hidden">
                <StackedFolderTabs controls={controls} />
            </div>
        </div>
    );
};

export default StackedFolderTabsDemo;