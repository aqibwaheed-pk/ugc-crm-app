<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'

const deals = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingDeal = ref({}) // Yahan hum edit honay wala data rakhenge

// 1. Data Fetching
onMounted(async () => {
  await fetchDeals()
})

async function fetchDeals() {
  loading.value = true
  let { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) console.error(error)
  else deals.value = data
  loading.value = false
}

// 2. Computed Columns
const pendingDeals = computed(() => deals.value.filter(d => d.status === 'Pending'))
const activeDeals = computed(() => deals.value.filter(d => d.status === 'In Progress'))
const doneDeals = computed(() => deals.value.filter(d => d.status === 'Done'))

// 3. Status Update (Quick Move)
async function updateStatus(id, newStatus) {
  const dealIndex = deals.value.findIndex(d => d.id === id)
  if (dealIndex !== -1) deals.value[dealIndex].status = newStatus
  await supabase.from('deals').update({ status: newStatus }).eq('id', id)
}

// 4. Delete Deal
async function deleteDeal(id) {
  if(!confirm("Are you sure you want to delete this deal?")) return;
  deals.value = deals.value.filter(d => d.id !== id)
  await supabase.from('deals').delete().eq('id', id)
}

// 5. Open Edit Modal ✏️
function openEditModal(deal) {
  // Deal ki copy banani parti hai taake original change na ho jab tak Save na dabayen
  editingDeal.value = { ...deal }
  showModal.value = true
}

// 6. Save Changes 💾
async function saveDeal() {
  const { id, brand_name, amount, deadline, description } = editingDeal.value
  
  // Frontend update (Fast UI)
  const index = deals.value.findIndex(d => d.id === id)
  if (index !== -1) {
    deals.value[index] = { ...deals.value[index], brand_name, amount, deadline, description }
  }

  // Backend update
  await supabase
    .from('deals')
    .update({ brand_name, amount, deadline, description })
    .eq('id', id)

  showModal.value = false
}
</script>

<template>
  <div class="dashboard">
    <header>
      <h1 class="logo">
        <span class="spark">✨</span> Sponso<span class="ai-text">AI</span>
        <span class="beta">Beta</span>
      </h1>
      <button @click="fetchDeals" class="refresh-btn">🔄 Refresh</button>
    </header>

    <div v-if="loading" class="loading">Loading Pipeline...</div>

    <div class="board">
      
      <div class="column">
        <h2 class="col-header pending">🟠 Pending ({{ pendingDeals.length }})</h2>
        <div class="card-list">
          <div v-for="deal in pendingDeals" :key="deal.id" class="card">
            <div @click="openEditModal(deal)" class="card-content">
              <h3>{{ deal.brand_name }}</h3>
              <p class="price">${{ deal.amount }}</p>
              <p class="date">📅 {{ deal.deadline || 'No Date' }}</p>
            </div>
            <div class="actions">
              <button @click="updateStatus(deal.id, 'In Progress')">Start ▶️</button>
              <button @click="deleteDeal(deal.id)" class="del-btn">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <h2 class="col-header progress">🔵 In Progress ({{ activeDeals.length }})</h2>
        <div class="card-list">
          <div v-for="deal in activeDeals" :key="deal.id" class="card">
            <div @click="openEditModal(deal)" class="card-content">
              <h3>{{ deal.brand_name }}</h3>
              <p class="price">${{ deal.amount }}</p>
            </div>
            <div class="actions">
              <button @click="updateStatus(deal.id, 'Pending')">⬅️</button>
              <button @click="updateStatus(deal.id, 'Done')">Done ✅</button>
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <h2 class="col-header done">🟢 Paid / Done ({{ doneDeals.length }})</h2>
        <div class="card-list">
          <div v-for="deal in doneDeals" :key="deal.id" class="card done-card">
            <div @click="openEditModal(deal)" class="card-content">
              <h3>{{ deal.brand_name }}</h3>
              <p class="price">${{ deal.amount }}</p>
            </div>
            <div class="actions">
              <button @click="deleteDeal(deal.id)" class="del-btn">Archive</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>Edit Deal ✍️</h2>
        
        <label>Brand Name</label>
        <input v-model="editingDeal.brand_name" type="text" />

        <div class="row">
          <div class="half">
            <label>Amount ($)</label>
            <input v-model="editingDeal.amount" type="number" />
          </div>
          <div class="half">
            <label>Deadline</label>
            <input v-model="editingDeal.deadline" type="date" />
          </div>
        </div>

        <label>Description / Notes</label>
        <textarea v-model="editingDeal.description" rows="4" placeholder="Add deal details here..."></textarea>

        <div class="modal-actions">
          <button @click="showModal = false" class="cancel-btn">Cancel</button>
          <button @click="saveDeal" class="save-btn">Save Changes</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Base Styles */
.dashboard { padding: 20px; font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }

/* Logo Styles */
.logo { font-size: 1.8rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; }
.spark { background: linear-gradient(45deg, #4facfe, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-right: 5px; }
.ai-text { background: linear-gradient(45deg, #6a11cb, #2575fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.beta { font-size: 0.6rem; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: top; color: #666; }

/* Board */
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.column { background: #eef2f5; padding: 15px; border-radius: 12px; min-height: 500px; }
.col-header { padding: 10px; border-radius: 8px; color: white; margin-top: 0; font-size: 1rem; }
.pending { background: #f59e0b; }
.progress { background: #3b82f6; }
.done { background: #10b981; }

/* Cards */
.card { background: white; padding: 15px; margin-top: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer; transition: 0.2s; }
.card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.card h3 { margin: 0 0 5px 0; font-size: 1.1rem; color: #334155; }
.price { font-size: 1.1rem; font-weight: bold; color: #1e293b; margin: 5px 0; }
.date { font-size: 0.85rem; color: #64748b; }
.actions { margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; }
.actions button { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; background: #f1f5f9; transition: 0.2s; }
.actions button:hover { background: #e2e8f0; }
.del-btn { color: #ef4444; background: #fef2f2 !important; }

/* MODAL STYLES */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal { background: white; padding: 25px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.modal h2 { margin-top: 0; color: #1e293b; }
.modal label { display: block; margin-top: 15px; font-size: 0.9rem; font-weight: 600; color: #475569; }
.modal input, .modal textarea { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
.modal textarea { resize: vertical; }
.row { display: flex; gap: 15px; }
.half { flex: 1; }

.modal-actions { margin-top: 25px; display: flex; justify-content: flex-end; gap: 10px; }
.save-btn { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.save-btn:hover { background: #2563eb; }
.cancel-btn { background: #e2e8f0; color: #475569; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
.cancel-btn:hover { background: #cbd5e1; }
</style>