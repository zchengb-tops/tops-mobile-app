import { storage } from "./storage";
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const request = (endpoint, options = {}) => {
    const accessToken = storage.getString('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers
    };

    const requestBody = options.body ? JSON.stringify(options.body) : undefined;
    console.log(requestBody);

    return fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
        body: requestBody
    });
};