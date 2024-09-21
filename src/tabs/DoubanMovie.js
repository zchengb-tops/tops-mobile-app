import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import {useNavigation} from "@react-navigation/native";
import {Rating} from "react-native-ratings";

export const DoubanMovie = () => {
    const {globalState} = useContext(GlobalContext);
    const [movies, setMovies] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setMovies(globalState['news']['doubanMovie'])
    }, [globalState]);


    return <ScrollView style={styles.container}>
        {
            movies.map((movie, index) => {
                const numericRate = parseFloat(movie.rate);
                const rate = numericRate / 2;

                return <TouchableOpacity style={styles.movieItem} key={index} activeOpacity={0.8}
                                         onPress={() => navigation.navigate('NewsDetailScreen', {url: "https://zchengb.top/api/t/" + movie.shortLink})}>
                    <View style={[
                        styles.rankNumCircle,
                        index < 3 && styles[`rankNumCircleTop${index + 1}`]
                    ]}>
                        <Text
                            style={index < 3 ? styles.topRankNumText : styles.rankNumText}>{movie.rankNum}</Text>
                    </View>
                    <Image style={styles.cover} source={{uri: movie.coverUrl}}></Image>
                    <View style={styles.movieInfoWrapper}>
                        <Text style={styles.movieName}>
                            {movie.name}
                        </Text>
                        <View style={styles.additionalInfoWrapper}>
                            <Text style={styles.additionalText}>{movie.publishDate} / </Text>
                            <Text style={styles.additionalText}>{movie.region} / </Text>
                            <Text style={[styles.additionalText, styles.movieTypeText]} numberOfLines={1}
                                  ellipsizeMode='tail'>{movie.type}</Text>
                        </View>
                        <View style={styles.rankWrapper}>
                            <Rating
                                readonly
                                startingValue={rate}
                                imageSize={16}
                                fractions={1}
                            />
                            <Text style={styles.rankText}>{movie.rate}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            })
        }
    </ScrollView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cover: {
        borderRadius: 8,
        width: 80,
        height: 120,
        marginLeft: 12,
    },
    movieItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        height: 152,
    },
    rankNumCircle: {
        width: 18,
        height: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f1f4',
    },
    rankNumCircleTop1: {
        backgroundColor: '#E67700',
        color: 'white',
    },
    rankNumCircleTop2: {
        backgroundColor: '#F59F00',
        color: 'white',
    },
    rankNumCircleTop3: {
        backgroundColor: '#FCC419',
        color: 'white',
    },
    rankNumText: {
        color: 'rgba(0, 0, 0, 0.8)',
        fontSize: 12
    },
    topRankNumText: {
        color: 'white',
        fontSize: 12
    },
    movieInfoWrapper: {
        marginLeft: 16,
        flex: 1,
        height: '100%',
        justifyContent: 'space-around'
    },
    additionalInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    additionalText: {
        fontSize: 12,
        color: '#939393',
    },
    movieTypeText: {
        flexShrink: 1,
    },
    movieName: {
        fontSize: 16
    },
    rankWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#F1C30F',
        fontWeight: '500'
    }
})