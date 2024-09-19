import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import {useNavigation} from "@react-navigation/native";
import FlashlightIcon from "../../assets/icons/flashlight.svg";
import CommentIcon from "../../assets/icons/comment.svg";

export const DoubanMovie = () => {
    const {globalState} = useContext(GlobalContext);
    const [movie, setMovie] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setMovie(globalState['news']['doubanMovie'])
    }, [globalState]);


    return <ScrollView>
    </ScrollView>
}

const styles = StyleSheet.create({

})