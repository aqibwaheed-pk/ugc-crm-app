<script setup>
import { ref } from 'vue';
import { GoogleSignInButton } from 'vue3-google-signin';
import axios from 'axios';
import { useRouter } from 'vue-router';

const emit = defineEmits(['login-success']);
const router = useRouter();

const authMode = ref('signin');
const loading = ref(false);
const errorMessage = ref('');

const signUpForm = ref({
  name: '',
  email: '',
  password: '',
});

const signInForm = ref({
  email: '',
  password: '',
});

const apiUrl = import.meta.env.VITE_API_URL;

const saveTokenAndRedirect = (data) => {
  const myAppToken = data?.accessToken;
  if (myAppToken) {
    localStorage.setItem('sponso_token', myAppToken);
  }
  emit('login-success', data?.user || null);
  router.push('/dashboard');
};

const submitSignUp = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await axios.post(`${apiUrl}/auth/signup`, signUpForm.value);
    saveTokenAndRedirect(res.data);
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || 'Sign up failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const submitSignIn = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await axios.post(`${apiUrl}/auth/signin`, signInForm.value);
    saveTokenAndRedirect(res.data);
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || 'Sign in failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const handleGoogleSuccess = async (response) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { credential } = response;
    const res = await axios.post(`${apiUrl}/auth/google-login`, {
      token: credential,
    });

    saveTokenAndRedirect(res.data);
  } catch (err) {
    const backendMessage = err?.response?.data?.message;
    if (backendMessage === 'First sign up on web app') {
      errorMessage.value = 'First sign up on web app';
      authMode.value = 'signup';
    } else {
      errorMessage.value = backendMessage || 'Google login failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

const handleGoogleError = () => {
  errorMessage.value = 'Google popup failed. Please try again.';
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md rounded-xl border bg-white p-8 shadow-lg">
      <h1 class="mb-2 text-center text-2xl font-bold">Welcome to SponsoAI</h1>
      <p class="mb-6 text-center text-gray-500">Manage your brand deals efficiently.</p>

      <div class="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        <button
          class="rounded-md px-3 py-2 text-sm font-medium"
          :class="authMode === 'signin' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'"
          type="button"
          @click="authMode = 'signin'"
        >
          Sign In
        </button>
        <button
          class="rounded-md px-3 py-2 text-sm font-medium"
          :class="authMode === 'signup' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'"
          type="button"
          @click="authMode = 'signup'"
        >
          Sign Up
        </button>
      </div>

      <form v-if="authMode === 'signup'" class="space-y-4" @submit.prevent="submitSignUp">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            v-model="signUpForm.name"
            type="text"
            class="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            v-model="signUpForm.email"
            type="email"
            class="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            v-model="signUpForm.password"
            type="password"
            minlength="8"
            class="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <button
          class="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Please wait...' : 'Create Account' }}
        </button>
      </form>

      <form v-else class="space-y-4" @submit.prevent="submitSignIn">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            v-model="signInForm.email"
            type="email"
            class="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            v-model="signInForm.password"
            type="password"
            minlength="8"
            class="w-full rounded-md border px-3 py-2"
            required
          />
        </div>
        <button
          class="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Please wait...' : 'Sign In' }}
        </button>
      </form>

      <div class="my-5 flex items-center gap-3">
        <div class="h-px flex-1 bg-slate-200" />
        <span class="text-xs uppercase tracking-wide text-slate-400">or</span>
        <div class="h-px flex-1 bg-slate-200" />
      </div>

      <div class="flex justify-center">
        <GoogleSignInButton @success="handleGoogleSuccess" @error="handleGoogleError" />
      </div>

      <p v-if="errorMessage" class="mt-4 text-center text-sm text-red-600">{{ errorMessage }}</p>
    </div>
  </div>
</template>
