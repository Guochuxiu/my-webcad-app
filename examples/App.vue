<template>
    <div class="app-container">
        <div v-if="showBackButton" class="back-button" @click="goBack">
            ← 返回主页
        </div>
        <router-view />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const showBackButton = computed(() => route.path !== '/');

const goBack = () => {
    router.push('/');
};
</script>

<style scoped>
.app-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

.back-button {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    color: #667eea;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.back-button:hover {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(-2px);
}
</style>

