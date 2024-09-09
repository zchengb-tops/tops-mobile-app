import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ListItem} from "@rneui/themed";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import {useNavigation} from "@react-navigation/native";

export const Sina = () => {
    const {globalState} = useContext(GlobalContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setNews(globalState['news']['sina'])
    }, [globalState]);

    const prettifyNumber = (viewers) => {
        viewers = Number(viewers);
        if (viewers >= 100000000) {
            viewers = Math.round(viewers / 10000000) / 10 + "亿";
        } else if (viewers >= 10000) {
            viewers = Math.round(viewers / 1000) / 10 + "万";
        }
        return viewers;
    }

    return <ScrollView>
        {
            news?.map((item, index) => {
                return <TouchableOpacity key={index}
                                         onPress={() => navigation.navigate('NewsDetail', {url: "https://zchengb.top/api/t/" + item.shortLink})}>
                    <ListItem containerStyle={styles.newItemContainer}>
                        <View style={[
                            styles.rankNumCircle,
                            index < 3 && styles[`rankNumCircleTop${index + 1}`]
                        ]}>
                            <Text
                                style={index < 3 ? styles.topRankNumText : styles.rankNumText}>{item.rankNum}</Text>
                        </View>
                        <ListItem.Content>
                            <ListItem.Title style={styles.title}
                                            numberOfLines={1}
                                            ellipsizeMode='tail'>
                                {item.title}
                            </ListItem.Title>
                        </ListItem.Content>
                        <Text style={styles.viewerText}>
                            {prettifyNumber(item.properties.viewers)}
                        </Text>
                    </ListItem>
                </TouchableOpacity>
            })
        }
    </ScrollView>
}

const styles = StyleSheet.create({
    newItemContainer: {
        marginBottom: -4,
    },
    title: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.85)'
    },
    viewerText: {
        color: '#939393',
        fontSize: 14
    },
    rankNumCircle: {
        width: 18,
        height: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f1f4',
        marginRight: -6,
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
    }
})