import {ScrollView, Text, TouchableOpacity, View} from "react-native";
import {ListItem} from "@rneui/themed";
import React, {useContext, useEffect, useState} from "react";
import {StyleSheet} from 'react-native';
import {GlobalContext} from "../../utils/GlobalContext";

export const Sina = ({navigation}) => {
    const {globalState} = useContext(GlobalContext);
    const [news, setNews] = useState([]);

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
                    <ListItem style={{marginBottom: -8}}>
                        <View style={[
                            styles.rankNumCircle,
                            index < 3 && styles[`rankNumCircleTop${index + 1}`]
                        ]}>
                            <Text
                                style={index < 3 ? styles.topRankNumText : styles.rankNumText}>{item.rankNum}</Text>
                        </View>
                        <ListItem.Content>
                            <ListItem.Title style={{fontSize: 16, color: 'rgba(0,0,0,0.85)'}}>
                                {item.title}
                            </ListItem.Title>
                        </ListItem.Content>
                        <Text style={{color: '#939393', fontSize: 12}}>
                            {prettifyNumber(item.properties.viewers)}
                        </Text>
                    </ListItem>
                </TouchableOpacity>
            })
        }
    </ScrollView>
}

const styles = StyleSheet.create({
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