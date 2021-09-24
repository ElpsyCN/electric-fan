<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Electric Fan',
  meta: [
    { name: 'description', content: '夏日小风扇，为你的夏日带去清凉～' },
  ],
})
</script>

<template>
  <router-view />
</template>
