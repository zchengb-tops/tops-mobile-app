import { useRef } from 'react';

export const useSwipeDetection = () => {
    const touchStartRef = useRef(null);

    const handleTouchStart = (event) => {
        touchStartRef.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
            timestamp: Date.now()
        };
    };

    const handlePress = (callback) => {
        return () => {
            if (!touchStartRef.current) {
                callback();
                return;
            }

            const touchEnd = {
                x: touchStartRef.current.x,
                y: touchStartRef.current.y,
                timestamp: Date.now()
            };

            const deltaX = Math.abs(touchEnd.x - touchStartRef.current.x);
            const deltaY = Math.abs(touchEnd.y - touchStartRef.current.y);
            const deltaTime = touchEnd.timestamp - touchStartRef.current.timestamp;

            // Only execute callback if it's a tap (not a swipe) and within reasonable time
            if (deltaX < 10 && deltaY < 10 && deltaTime < 500) {
                callback();
            }
        };
    };

    return {
        handleTouchStart,
        handlePress
    };
};

