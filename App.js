import {StyleSheet} from 'react-native';
import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsPageScreen} from "./components/NewsPageScreen";
import {NewsDetailScreen} from "./components/NewsDetailScreen";
import {GlobalContext, GlobalProvider} from "./utils/GlobalContext";


const Stack = createStackNavigator();


export default function App() {
    return (
        <GlobalProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="NewsPage">
                    <Stack.Screen name="NewsPage" component={NewsPageScreen}
                                  options={{headerShown: false, title: "Tops"}}/>
                    <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{title: "资讯详情"}}/>
                </Stack.Navigator>
            </NavigationContainer>
        </GlobalProvider>
    );
}