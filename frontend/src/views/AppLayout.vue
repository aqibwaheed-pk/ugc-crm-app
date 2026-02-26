<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { ChevronDown, CreditCard, LogOut, RotateCw, Settings, UserCircle2 } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const route = useRoute()
const menuOpen = ref(false)
const menuRoot = ref(null)
const isRefreshing = ref(false)
const currentYear = new Date().getFullYear()
const companyName = 'SponsoAI'

const navItems = [
  { label: 'Profile', path: '/profile', icon: UserCircle2 },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Billing', path: '/billing', icon: CreditCard },
]

const activePage = computed(() => route.path)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

async function goTo(path) {
  closeMenu()
  if (route.path !== path) {
    await router.push(path)
  }
}

async function refreshBoard() {
  if (isRefreshing.value) return

  isRefreshing.value = true
  if (route.path !== '/dashboard') {
    await router.push('/dashboard')
  }

  window.dispatchEvent(new Event('refresh-deals'))
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}

function handleLogout() {
  localStorage.removeItem('sponso_token')
  closeMenu()
  router.push('/login')
}

function onWindowClick(event) {
  if (menuRoot.value && !menuRoot.value.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  window.addEventListener('click', onWindowClick)
})

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-50 font-sans">
    <nav class="border-b border-slate-200 bg-white">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span class="text-white text-xl font-bold">S</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Sponso<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI</span>
          </h1>
          <Badge variant="secondary" class="ml-2 text-xs">BETA</Badge>
        </div>

        <div class="flex items-center gap-3">
          <Button @click="refreshBoard" variant="outline" class="gap-2">
            <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
            Refresh Board
          </Button>

          <Button @click="handleLogout" variant="ghost" class="text-slate-500 hover:text-red-600">
            <LogOut class="w-4 h-4 mr-2" /> Logout
          </Button>

          <div class="relative" ref="menuRoot">
            <Button variant="outline" class="gap-2" @click.stop="toggleMenu">
              Account
              <ChevronDown class="w-4 h-4" />
            </Button>

            <div v-if="menuOpen" class="absolute right-0 top-full mt-2 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg z-20">
              <button
                v-for="item in navItems"
                :key="item.path"
                @click="goTo(item.path)"
                class="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left hover:bg-slate-100"
                :class="activePage === item.path ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
              >
                <component :is="item.icon" class="w-4 h-4" />
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="flex-1 px-6 py-8">
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-slate-600">
        <p>&copy; {{ currentYear }} {{ companyName }}. All rights reserved.</p>
        <a href="/contact" class="hover:text-slate-900 transition-colors">Contact Us</a>
      </div>
    </footer>
  </div>
</template>
