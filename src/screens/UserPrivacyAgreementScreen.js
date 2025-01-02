import React, {useEffect} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useTheme} from "@rneui/themed";
import {Text} from "../components/Text";
import {useVisibility} from "../providers/VisibilityProvider";

export const UserPrivacyAgreementScreen = ({ navigation, route }) => {
    const {theme} = useTheme();
    const { setIsNavBarVisible, setIsPlayBarVisible } = useVisibility();

    useEffect(() => {
        setIsNavBarVisible(false);
        setIsPlayBarVisible(false);
        return () => {
            setIsNavBarVisible(true);
            setIsPlayBarVisible(true);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            route.params?.onGoBack?.();
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <ScrollView style={[styles.container, {backgroundColor: theme.colors.background}]}>
            <View style={styles.content}>
                <Text style={[styles.title, {color: theme.colors.text}]}>隐私政策</Text>

                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    我们非常重视您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息。使用本应用即表示您同意本隐私政策的条款。
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>1. 信息收集</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    我们可能收集以下信息：
                    账户信息（如电子邮件地址）、
                    设备信息、
                    使用数据、
                    订阅偏好设置
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>2. 信息使用</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    我们使用收集的信息来：{'\n'}
                    • 提供和改进服务{'\n'}
                    • 个性化用户体验{'\n'}
                    • 发送服务相关通知{'\n'}
                    • 处理用户反馈和权利请求{'\n'}
                    • 遵守法律法规要求
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>3. 信息安全</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    我们采取适当的技术和组织措施来保护您的个人信息免受未经授权的访问或披露。
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>4. 信息共享</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    除非法律要求或获得您的明确同意，我们不会与第三方共享您的个人信息。
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>5. 您的权利</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    您有权访问、更正或删除您的个人信息。如需行使这些权利，请通过应用内的反馈功能与我们联系。
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>6. 政策更新</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    我们可能会不时更新本隐私政策。更新后的政策将在应用内发布。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>7. 内容权利与反馈</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    如果您是内容权利人，认为应用中的某些内容侵犯了您的合法权益，请通过应用内反馈功能或发送邮件至zxchengb@163.com与我们联系。我们会在收到通知后及时核实和处理。
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 15,
    },
});
