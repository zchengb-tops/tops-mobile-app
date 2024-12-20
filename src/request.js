import { storage } from "./storage";
import * as Burnt from "burnt";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const request = async (endpoint, options = {}) => {
    const accessToken = storage.getString('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers
    };

    const requestBody = options.body ? JSON.stringify(options.body) : undefined;

    const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
        body: requestBody
    });

    if (response.status === 401) {
        storage.delete('accessToken');
        storage.delete('userInfo');
        Burnt.toast({
            title: '登录已过期',
            preset: 'error',
            message: '请重新登录',
            duration: 2,
        });
    }

    return response;
};