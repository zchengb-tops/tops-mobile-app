import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Icon} from '@rneui/themed';

export const Rating = ({
    readonly = true,
    startingValue = 0,
    imageSize = 16,
    fractions = 1,
    tintColor = 'transparent'
}) => {
    var rating = Math.max(0, Math.min(5, startingValue));
    var fullStars = Math.floor(rating);
    var hasHalfStar = rating - fullStars >= 0.5;
    var emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    var renderStars = () => {
        var stars = [];
        
        for (var i = 0; i < fullStars; i++) {
            stars.push(
                <Icon
                    key={`full-${i}`}
                    name="star"
                    type="ionicon"
                    size={imageSize}
                    color="#FFD700"
                />
            );
        }
        
        if (hasHalfStar) {
            stars.push(
                <Icon
                    key="half"
                    name="star-half"
                    type="ionicon"
                    size={imageSize}
                    color="#FFD700"
                />
            );
        }
        
        for (var i = 0; i < emptyStars; i++) {
            stars.push(
                <Icon
                    key={`empty-${i}`}
                    name="star-outline"
                    type="ionicon"
                    size={imageSize}
                    color="#D3D3D3"
                />
            );
        }
        
        return stars;
    };
    
    return (
        <View style={[styles.container, {backgroundColor: tintColor}]}>
            {renderStars()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
