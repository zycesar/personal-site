<script setup lang="ts">
import { profile } from '../../../data/profile'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="shell">
      <strong>{{ profile.name }}</strong>
      <span>{{ profile.role }}</span>
      <small>&copy; {{ year }}</small>
    </div>
  </footer>
</template>
