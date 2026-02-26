<script setup>
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const billing = ref({
  companyName: '',
  taxId: '',
  billingEmail: '',
})

function saveBilling() {
  alert('Billing details saved locally. Connect API to persist changes.')
}
</script>

<template>
  <Card class="max-w-3xl mx-auto">
    <CardHeader>
      <CardTitle>Billing</CardTitle>
      <CardDescription>Manage billing and invoicing information.</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="grid gap-2">
        <Label for="companyName">Company Name</Label>
        <Input id="companyName" v-model="billing.companyName" placeholder="Your company" />
      </div>

      <div class="grid gap-2">
        <Label for="taxId">Tax ID</Label>
        <Input id="taxId" v-model="billing.taxId" placeholder="Tax registration number" />
      </div>

      <div class="grid gap-2">
        <Label for="billingEmail">Billing Email</Label>
        <Input id="billingEmail" type="email" v-model="billing.billingEmail" placeholder="billing@example.com" />
      </div>

      <Button @click="saveBilling">Save Billing</Button>
    </CardContent>
  </Card>
</template>
