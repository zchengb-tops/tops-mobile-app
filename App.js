import {SafeAreaView, StyleSheet, Text} from 'react-native';
import React from "react";
import {Tab, TabView} from "@rneui/themed";

export default function App() {
    const [index, setIndex] = React.useState(0);

    return (
        <SafeAreaView style={styles.container}>
            <Tab
                value={index}
                onChange={(e) => setIndex(e)}
                style={styles.tabBar}
                indicatorStyle={styles.tabBarIndicator}
                dense
            >
                <Tab.Item
                    iconPosition="left"
                    title="微博"
                    titleStyle={styles.tabBarText}
                    icon={{name: 'timer', type: 'ionicon', color: 'black'}}
                />
                <Tab.Item
                    iconPosition="left"
                    title="Favorite"
                    titleStyle={{fontSize: 12}}
                    icon={{name: 'heart', type: 'ionicon', color: 'black'}}
                />
                <Tab.Item
                    iconPosition="left"
                    title="Cart"
                    titleStyle={{fontSize: 12}}
                    icon={{name: 'cart', type: 'ionicon', color: 'black'}}
                />
            </Tab>

            <TabView value={index} onChange={setIndex} animationType="spring">
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>RecentRecentRecentRecentRecent</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Favorite</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Cart</Text>
                </TabView.Item>
            </TabView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabBar: {
        display: "flex",
        alignItems: "center",
        height: 48,
    },
    tabBarIndicator: {
        backgroundColor: '#626262',
        height: 3
    },
    tabBarText: {
        fontSize: 12,
        color: 'black'
    },
    text: {
        fontSize: 24,
        color: 'black',
        textAlign: 'center',
        marginTop: 20,
    },
    tabView: {
        backgroundColor: '#F8F8F8',
        width: '100%'
    }
});
