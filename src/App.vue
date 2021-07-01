<template>
  <div id="app">
    <h3 :title="description">
      {{ title }}
      <br />
      <small>
        {{ description }}
      </small>
    </h3>

    <fan></fan>
    <base-footer />
  </div>
</template>

<script setup lang="ts">
import Fan from "./components/Fan.vue";
import BaseFooter from "./components/BaseFooter.vue";

const title = "夏日清凉小风扇";
const description = "除了没有风，什么都好！";
</script>
