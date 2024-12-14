import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View, Image, Alert } from "react-native";
import Modal from "react-native-modal";
import { Icon, useTheme } from "@rneui/themed";
import { Text } from "./Text";
import { sendVerificationCode, signIn } from "../apis/User";

const STEP = {
    EMAIL: 1,
    VERIFICATION: 2
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const LoginModal = ({ isVisible, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(STEP.EMAIL);
    const [isAgreed, setIsAgreed] = useState(false);
    const [emailError, setEmailError] = useState('');
    const { theme } = useTheme();

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(c => c - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleSendVerificationCode = async () => {
        if (!email || loading || !isAgreed) return;

        if (!validateEmail(email)) {
            setEmailError('请输入正确的邮箱格式');
            return;
        }

        setLoading(true);
        sendVerificationCode(email).then(async response => {
            if (response.ok) {
                setStep(STEP.VERIFICATION);
                setCountdown(120);
                setEmailError('');
            } else {
                const errorMessage = await response.json();
                throw new Error(errorMessage?.message || '发送验证码失败');
            }
        }).catch(error => {
            console.error(error);
            Alert.alert('发送失败', error.message);
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleSignIn = async () => {
        if (!email || !verificationCode || loading) return;
        setLoading(true);
        signIn(email, verificationCode).then(async response => {
            if (response.ok) {
                const data = await response.json();
                onSuccess(data.accessToken);
                handleClose();
            } else {
                const errorMessage = await response.json();
                throw new Error(errorMessage?.message || '登录失败');
            }
        }).catch(error => {
            console.error("sign in error:", error);
            Alert.alert('登录失败', error.message);
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleClose = () => {
        setStep(STEP.EMAIL);
        setEmail('');
        setVerificationCode('');
        setCountdown(0);
        setIsAgreed(false);
        setEmailError('');
        onClose();
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailError) {
            setEmailError('');
        }
    };

    return (
        <Modal
            isVisible={isVisible}
            style={{ margin: 0 }}
            backdropOpacity={0.5}
            onBackdropPress={handleClose}
            onSwipeComplete={handleClose}
            backdropTransitionOutTiming={0}
            swipeDirection="down"
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            登录
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Icon name="close-outline" type="ionicon" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.iconContainer}>
                        <Image
                            source={require('../../assets/images/icon-468.png')}
                            style={styles.appIcon}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.modalBody}>
                        {step === STEP.EMAIL ? (
                            <>
                                <View>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: theme.colors.inputBackground,
                                            color: theme.colors.text,
                                            borderColor: emailError ? 'red' : 'transparent',
                                            borderWidth: 1
                                        }]}
                                        placeholder="请输入邮箱，新账号即默认注册"
                                        placeholderTextColor={theme.colors.secondaryText}
                                        value={email}
                                        onChangeText={handleEmailChange}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    {emailError ? (
                                        <Text style={styles.errorText}>{emailError}</Text>
                                    ) : null}
                                </View>
                                <TouchableOpacity
                                    style={[styles.button, { opacity: !email || loading || !isAgreed ? 0.5 : 1 }, { backgroundColor: theme.colors.indicator }]}
                                    onPress={handleSendVerificationCode}
                                    disabled={!email || loading || !isAgreed}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>发送验证码</Text>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.agreementContainer}>
                                    <TouchableOpacity
                                        style={styles.checkbox}
                                        onPress={() => setIsAgreed(!isAgreed)}
                                    >
                                        <Icon
                                            name={isAgreed ? "checkbox" : "square-outline"}
                                            type="ionicon"
                                            size={18}
                                            color={theme.colors.primary}
                                        />
                                    </TouchableOpacity>
                                    <Text style={[styles.agreementText, { color: theme.colors.secondaryText }]}>
                                        我已认真阅读、理解并同意《InfoHub用户协议》、《隐私协议》
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: theme.colors.inputBackground,
                                        color: theme.colors.text
                                    }]}
                                    placeholder="请输入验证码"
                                    placeholderTextColor={theme.colors.secondaryText}
                                    value={verificationCode}
                                    onChangeText={setVerificationCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <TouchableOpacity
                                    style={[styles.button, { opacity: !verificationCode || loading ? 0.5 : 1, backgroundColor: theme.colors.indicator }]}
                                    onPress={handleSignIn}
                                    disabled={!verificationCode || loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>登录</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleSendVerificationCode}
                                    disabled={countdown > 0 || loading}
                                >
                                    <Text style={[styles.resendText, {
                                        color: countdown > 0 ? theme.colors.secondaryText : theme.colors.primary
                                    }]}>
                                        {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end'
    },
    modalContent: {
        flex: 1,
        marginTop: 56,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    iconContainer: {
        marginTop: 48,
        alignItems: 'center',
        marginBottom: 20
    },
    appIcon: {
        width: 86,
        height: 86,
        borderRadius: 20
    },
    modalBody: {
        marginTop: 20,
        flex: 1,
    },
    modalTitle: {
        fontSize: 24,
        lineHeight: 24,
        fontWeight: '600',
    },
    modalDesc: {
        fontSize: 14,
        marginBottom: 20,
    },
    closeButton: {
        padding: 4
    },
    input: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16
    },
    button: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600'
    },
    resendButton: {
        marginTop: 16,
        alignItems: 'center'
    },
    resendText: {
        fontSize: 14
    },
    agreementContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16
    },
    checkbox: {
        marginTop: 1,
        marginRight: 4
    },
    agreementText: {
        fontSize: 14,
        flex: 1
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 8,
        marginLeft: 4
    }
});

export default LoginModal;