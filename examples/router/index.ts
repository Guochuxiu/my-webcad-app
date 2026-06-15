import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue';
import WebcadTemplate from '../views/WebcadTemplate.vue';
import twodCanvas from '../views/2D_canvas.vue';
import threedCanvas from '../views/3D_canvas.vue';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: {
            title: '主页'
        }
    },
    {
        path: '/template',
        name: 'webcad-template',
        component: WebcadTemplate,
        meta: {
            title: 'webcad-template'
        }
    },
    {
        path: '/2D_canvas',
        name: '2D_canvas',
        component: twodCanvas,
        meta: {
            title: '2D_canvas'
        }
    },
    {
        path: '/3D_canvas',
        name: '3D_canvas',
        component: threedCanvas,
        meta: {
            title: '3D_canvas'
        }
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title as string;
    }
    next();
});

export default router;

