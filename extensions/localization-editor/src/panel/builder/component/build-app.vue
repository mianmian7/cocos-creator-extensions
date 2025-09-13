<template>
    <Suspense>
        <template #default>
            <div>
                <Home></Home>
            </div>
        </template>
        <template #fallback>
            <div class="fallback">
                <ui-loading></ui-loading>
            </div>
        </template>
    </Suspense>
</template>

<script lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import type { CustomError } from '../../../lib/core/error/Errors';
import EventBusService from '../../../lib/core/service/util/EventBusService';
import { container } from 'tsyringe';
const eventBusService = container.resolve(EventBusService);
const HOME = defineAsyncComponent(() => import('./panel/build-home.vue'));

export default {
    components: {
        Home: HOME,
    },
    setup(){
        function onError(customError: CustomError){
            console.error(customError);
        }
        onMounted(() => {
            eventBusService.on('onCustomError', onError);
        });

        onUnmounted(() => {
            eventBusService.off('onCustomError', onError);
        });
    },

};
</script>
<style></style>