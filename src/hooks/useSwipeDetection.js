import { useRef } from 'react';
import { useTab } from './TabHooks';

export const useSwipeDetection = () => {
    const { isSwiping } = useTab();
    const touchStartRef = useRef(null);

    const handleTouchStart = (event) => {
        touchStartRef.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
            timestamp: Date.now()
        };
    };

    const handlePress = (callback) => {
        return (event) => {
            // Don't trigger press events if we're in the middle of a tab swipe
            if (isSwiping) {
                touchStartRef.current = null;
                return;
            }
            
            if (!touchStartRef.current) {
                callback();
                return;
            }

            const touchEnd = {
                x: event?.nativeEvent?.pageX || touchStartRef.current.x,
                y: event?.nativeEvent?.pageY || touchStartRef.current.y,
                timestamp: Date.now()
            };

            const deltaX = Math.abs(touchEnd.x - touchStartRef.current.x);
            const deltaY = Math.abs(touchEnd.y - touchStartRef.current.y);
            const deltaTime = touchEnd.timestamp - touchStartRef.current.timestamp;

            // Only execute callback if it's a tap (not a swipe) and within reasonable time
            // Increased deltaX threshold to better handle horizontal swipes between tabs
            if (deltaX < 15 && deltaY < 15 && deltaTime < 500) {
                callback();
            }
            
            // Clear the touch start reference after handling
            touchStartRef.current = null;
        };
    };

    return {
        handleTouchStart,
        handlePress
    };
};

