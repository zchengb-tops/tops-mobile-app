import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { useTheme } from '@rneui/themed';

export const UserServiceAgreement = () => {
    const { theme } = useTheme();
    
    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>用户服务协议</Text>
                
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    欢迎您使用 InfoHub。在使用本应用之前，请您仔细阅读以下条款。使用本应用即表示您同意接受以下所有条款。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. 服务说明</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    InfoHub 是一款资讯聚合应用，为用户提供新闻资讯订阅和阅读服务。我们会尽最大努力保证服务的连续性和可用性，但不承诺服务不会中断。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. 用户行为规范</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    用户在使用本应用时应遵守中华人民共和国相关法律法规，不得利用本应用从事违法违规活动。用户应对自己在使用本应用过程中的行为负责。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. 隐私保护</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    我们重视用户的隐私保护，会采取合理措施保护用户的个人信息安全。我们承诺不会将用户的个人信息用于未经授权的用途。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. 知识产权</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    本应用的所有权利均归开发者所有。用户仅获得使用本应用的权利，但不得对本应用进行复制、修改、传播或用于商业用途。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. 免责声明</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    对于因不可抗力或非本应用可控原因造成的服务中断或其他缺陷，本应用不承担任何责任。用户理解并同意自行承担使用本应用的风险。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. 协议修改</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    我们保留在必要时修改本协议的权利。对本协议的修改将通过应用内通知或其他适当方式告知用户。
                </Text>

                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    如您对本协议有任何疑问，请通过应用内的反馈功能与我们联系。
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
