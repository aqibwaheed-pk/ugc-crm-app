<script setup>
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const settings = ref({
  workspaceName: '',
  timezone: '',
})

function saveSettings() {
  alert('Settings saved locally. Connect API to persist changes.')
}
</script>

<template>
  <Card class="max-w-3xl mx-auto">
    <CardHeader>
      <CardTitle>Settings</CardTitle>
      <CardDescription>Configure your workspace preferences.</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="grid gap-2">
        <Label for="workspaceName">Workspace Name</Label>
        <Input id="workspaceName" v-model="settings.workspaceName" placeholder="Sponso Team" />
      </div>

      <div class="grid gap-2">
        <Label for="timezone">Timezone</Label>
        <Input id="timezone" v-model="settings.timezone" placeholder="UTC+05:00" />
      </div>

      <Button @click="saveSettings">Save Settings</Button>
    </CardContent>
  </Card>
</template>
