<script setup>
import { GoogleSignInButton } from "vue3-google-signin";
import axios from 'axios';

const emit = defineEmits(['login-success']);

const handleLoginSuccess = async (response) => {
  const { credential } = response; // Ye Google ka Token hai
  
  try {
    // 1. Backend ko bhejo verify karne ke liye
    const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google-login`, {
      token: credential
    }, {
      withCredentials: true,
    });

    // 2. Apna App Token save karo (if not using httpOnly cookies)
    const myAppToken = res.data.accessToken;
    if (myAppToken) {
      localStorage.setItem('sponso_token', myAppToken);
    }
    
    // 3. App ko batao ke login ho gaya
    emit('login-success', res.data.user);

  } catch (err) {
    console.error("Login Failed:", err);
    alert("Login failed! Backend check karein.");
  }
};

const handleLoginError = () => {
  console.error("Google Popup failed");
};
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-slate-50">
    <div class="bg-white p-8 rounded-xl shadow-lg text-center border">
      <h1 class="text-2xl font-bold mb-2">Welcome to SponsoAI</h1>
      <p class="text-gray-500 mb-6">Manage your brand deals efficiently.</p>
      
      <div class="flex justify-center">
        <GoogleSignInButton
          @success="handleLoginSuccess"
          @error="handleLoginError"
        />
      </div>
    </div>
  </div>
</template>