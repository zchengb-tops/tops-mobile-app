import React from 'react';
import {Image, StyleSheet} from 'react-native';

const LOGO_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAylJREFUWAntVz1MFFEQfvP2DkwEsdBCjSQaY7DiELCgUqIm1v7ESmJioxhNgAgsJmCUPU04E03ARI0mlv4UVhYWamEs0ACVFpqoFGqkQSgU2DfO2/Mds3u3d29taNiEezPfzJuZNztvdhBi9VnhDIDxnxn2PQGiBxHTeQympwaceiOPrqQHTZ66jUKcEAKrtBwAPk+6zraobjk+ZYRkqFsUnGtjYp2RlVrJ+RkUeIrL6DT3OW9Dy2Wl/CmW+Xhq7yjWULYGuQad/mddnbzOMRuaBWCjnteZnVVd9Ao2RnZ4LzthPoJVZBMH0DyCG5QQPdwynf7rphp5i2O2dOIAlhZUP9VKLXdAtTD07Bz84ZgtnSiA1hxuJcOdIeMAH3bucB6EsARM4RbY7Fn4rYboylVzXQny4qNj4HMsCW2dgWYPG+hqdnDjdO3eTvTDE44lpa0zsIT+FTLuhB04bphPzlkF0HQNW9SSf5ibp2y8mHThOcfi6MYsHgT0zwuENirY9dTl5qZcJ2h0VgGg72ejxkE4A1GsFN+Y9c8KpW5Qp6XXTb/6YbeoYg3szmI7otif3/nvF+DHhAtvQlgJpjWL24USOfIY6ydWYOwpVer0+jSVn0Wlesl58KHi2tS4Fg1fzlBNxvPvUdL2GGWz6jacuYptho9bEUQrl1HdvHKk0wJCbjF4bA2QE13xJ41i0aqCW9FehHMAxS7D0qn9dEoeH78A3w2m13IZ4HpFNNXFvswwHigShABcY1jK5Jeocy377wDyhmmIsX1QFN4732IdAAgYo3f4mG+mU7U0eXiEY0lpqwDI+czalOxLVztd1ERCXz0l1OWjD4N6Seo70LcKgE7qve6FufFumKZdoyFPiA0fP/kdISwBYxEATG+ulWPGZqpKZnUrNbxeaT4dPHQz/JXk8nJ05QAAB/mw8a4HZmjTCDdKV7b+27w6zTFbumwA9O7flxo29PCph9CIEzcYViNgJZYFAAtFyo7sLzVsBMMniktcX3dHPaxyzIYuBEDDRc70aN216O/OZB88jTMy4coxytBd+g+iEDgVa7hzsloBwF9xtlbxFc3AXzzj7cB0q8qAAAAAAElFTkSuQmCC';

export const Kr36Logo = ({size = 28, style}) => (
    <Image source={{uri: LOGO_DATA_URI}} style={[styles.logo, {height: size, width: size}, style]} resizeMode='contain'/>
);

const styles = StyleSheet.create({
    logo: {
        height: 28,
        width: 28,
    },
});
