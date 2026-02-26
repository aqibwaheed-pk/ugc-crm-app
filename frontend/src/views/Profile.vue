<script setup>
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const profile = ref({
  fullName: '',
  email: '',
  bio: '',
})

function saveProfile() {
  alert('Profile details saved locally. Connect API to persist changes.')
}
</script>

<template>
  <Card class="max-w-3xl mx-auto">
    <CardHeader>
      <CardTitle>Profile</CardTitle>
      <CardDescription>Update your personal details.</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <div class="grid gap-2">
        <Label for="fullName">Full Name</Label>
        <Input id="fullName" v-model="profile.fullName" placeholder="Your full name" />
      </div>

      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" v-model="profile.email" placeholder="you@example.com" />
      </div>

      <div class="grid gap-2">
        <Label for="bio">Bio</Label>
        <Textarea id="bio" v-model="profile.bio" placeholder="Tell us about yourself" />
      </div>

      <Button @click="saveProfile">Save Profile</Button>
    </CardContent>
  </Card>
</template>
