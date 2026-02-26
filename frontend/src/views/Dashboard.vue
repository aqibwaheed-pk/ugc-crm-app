<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'
import { Trash2, ArrowLeft, Play, CheckCircle, Save } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const deals = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingDeal = ref({})

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  const token = localStorage.getItem('sponso_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

async function fetchDeals() {
  loading.value = true
  try {
    const res = await api.get('/deals')
    deals.value = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    loading.value = false
  }
}

async function updateStatus(id, newStatus) {
  const dealIndex = deals.value.findIndex((deal) => deal.id === id)
  if (dealIndex !== -1) {
    deals.value[dealIndex].status = newStatus
  }

  try {
    await api.patch(`/deals/${id}`, { status: newStatus })
  } catch (error) {
    console.error('Status update failed:', error)
    fetchDeals()
  }
}

async function deleteDeal(id) {
  if (!confirm('Delete this deal permanently?')) return

  deals.value = deals.value.filter((deal) => deal.id !== id)

  try {
    await api.delete(`/deals/${id}`)
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

async function saveDeal() {
  const { id, brand_name, amount, deadline, description } = editingDeal.value
  const index = deals.value.findIndex((deal) => deal.id === id)

  if (index !== -1) {
    deals.value[index] = { ...deals.value[index], brand_name, amount, deadline, description }
  }

  try {
    await api.patch(`/deals/${id}`, { brand_name, amount, deadline, description })
    showModal.value = false
  } catch (error) {
    console.error('Save failed:', error)
    alert('Failed to save changes')
  }
}

function openEditModal(deal) {
  editingDeal.value = { ...deal }
  showModal.value = true
}

const pendingDeals = computed(() => deals.value.filter((deal) => deal.status === 'Pending'))
const activeDeals = computed(() => deals.value.filter((deal) => deal.status === 'In Progress'))
const doneDeals = computed(() => deals.value.filter((deal) => deal.status === 'Done'))

onMounted(() => {
  fetchDeals()
  window.addEventListener('refresh-deals', fetchDeals)
})

onUnmounted(() => {
  window.removeEventListener('refresh-deals', fetchDeals)
})
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-slate-100/50 p-4 rounded-xl border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-700 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-orange-400"></div>
            Pending
          </h2>
          <Badge variant="outline" class="bg-white">{{ pendingDeals.length }}</Badge>
        </div>

        <div class="space-y-3">
          <Card v-for="deal in pendingDeals" :key="deal.id" class="cursor-pointer hover:shadow-md transition-all duration-200 group border-l-4 border-l-orange-400">
            <CardHeader class="p-4 pb-2" @click="openEditModal(deal)">
              <div class="flex justify-between items-start">
                <CardTitle class="text-base font-bold text-slate-800">{{ deal.brand_name }}</CardTitle>
                <span class="text-sm font-semibold text-slate-600">${{ deal.amount }}</span>
              </div>
            </CardHeader>
            <CardContent class="p-4 pt-0 pb-2" @click="openEditModal(deal)">
              <p class="text-xs text-slate-500 flex items-center gap-1">
                📅 {{ deal.deadline || 'No Deadline' }}
              </p>
            </CardContent>
            <CardFooter class="p-3 bg-slate-50/50 flex justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" class="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" @click.stop="deleteDeal(deal.id)">
                <Trash2 class="w-4 h-4" />
              </Button>
              <Button size="sm" class="bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs gap-1" @click.stop="updateStatus(deal.id, 'In Progress')">
                Start <Play class="w-3 h-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-blue-900 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            In Progress
          </h2>
          <Badge variant="outline" class="bg-white text-blue-700 border-blue-200">{{ activeDeals.length }}</Badge>
        </div>

        <div class="space-y-3">
          <Card v-for="deal in activeDeals" :key="deal.id" class="cursor-pointer hover:shadow-md transition-all duration-200 group border-l-4 border-l-blue-500">
            <CardHeader class="p-4 pb-2" @click="openEditModal(deal)">
              <div class="flex justify-between items-start">
                <CardTitle class="text-base font-bold text-slate-800">{{ deal.brand_name }}</CardTitle>
                <span class="text-sm font-semibold text-blue-600">${{ deal.amount }}</span>
              </div>
            </CardHeader>
            <CardFooter class="p-3 bg-slate-50/50 flex justify-between gap-2">
              <Button size="sm" variant="outline" class="h-8 text-xs gap-1" @click.stop="updateStatus(deal.id, 'Pending')">
                <ArrowLeft class="w-3 h-3" />
                Back
              </Button>
              <Button size="sm" class="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs gap-1" @click.stop="updateStatus(deal.id, 'Done')">
                Done <CheckCircle class="w-3 h-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div class="bg-green-50/50 p-4 rounded-xl border border-green-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-green-900 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            Paid / Done
          </h2>
          <Badge variant="outline" class="bg-white text-green-700 border-green-200">{{ doneDeals.length }}</Badge>
        </div>

        <div class="space-y-3">
          <Card v-for="deal in doneDeals" :key="deal.id" class="cursor-pointer hover:shadow-sm opacity-75 hover:opacity-100 transition-all border-l-4 border-l-green-500">
            <CardHeader class="p-4 pb-2" @click="openEditModal(deal)">
              <div class="flex justify-between items-start">
                <CardTitle class="text-base font-bold text-slate-700 line-through decoration-slate-400">{{ deal.brand_name }}</CardTitle>
                <span class="text-sm font-semibold text-green-600">${{ deal.amount }}</span>
              </div>
            </CardHeader>
            <CardFooter class="p-3 flex justify-end">
              <Button size="sm" variant="ghost" class="text-slate-400 hover:text-red-500 h-8" @click.stop="deleteDeal(deal.id)">
                Archive
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>

    <Dialog :open="showModal" @update:open="showModal = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deal Details</DialogTitle>
          <DialogDescription>
            Make changes to the deal here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="name">Brand Name</Label>
            <Input id="name" v-model="editingDeal.brand_name" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="amount">Amount ($)</Label>
              <Input id="amount" type="number" v-model="editingDeal.amount" />
            </div>
            <div class="grid gap-2">
              <Label for="date">Deadline</Label>
              <Input id="date" type="date" v-model="editingDeal.deadline" />
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="desc">Notes / Description</Label>
            <Textarea id="desc" v-model="editingDeal.description" placeholder="Add deliverable details..." />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" @click="saveDeal" class="w-full gap-2">
            <Save class="w-4 h-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
