import React, { useEffect, useState } from 'react';

interface FlyingItemProps {
    src: string;
    startRect: { x: number; y: number; width: number; height: number };
    onComplete: () => void;
}

export const FlyingItem: React.FC<FlyingItemProps> = ({ src, startRect, onComplete }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        left: startRect.x,
        top: startRect.y,
        width: startRect.width,
        height: startRect.height,
        zIndex: 9999,
        objectFit: 'cover',
        borderRadius: '1rem',
        pointerEvents: 'none',
        transition: 'all 1.5s cubic-bezier(0.2, 1, 0.3, 1)',
        opacity: 1
    });

    useEffect(() => {
        // Trigger animation in next frame
        requestAnimationFrame(() => {
            setStyle(prev => ({
                ...prev,
                left: '50%',
                top: window.innerHeight - 80, // Approximate cart position
                width: 20,
                height: 20,
                opacity: 0,
                transform: 'translate(-50%, 0) rotate(360deg)'
            }));
        });

        const timer = setTimeout(onComplete, 1500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return <img src={src} style={style} alt="" className="shadow-xl border-2 border-white" />;
};
