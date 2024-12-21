import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useTheme} from "@rneui/themed";
import {Text} from "../components/Text";

export const UserPrivacyAgreement = () => {
    const {theme} = useTheme();

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
                    • 账户信息（如电子邮件地址）
                    • 设备信息
                    • 使用数据
                    • 订阅偏好设置
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>2. 信息使用</Text>
                <Text style={[styles.paragraph, {color: theme.colors.text}]}>
                    我们使用收集的信息来：
                    • 提供和改进服务
                    • 个性化用户体验
                    • 发送服务相关通知
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
