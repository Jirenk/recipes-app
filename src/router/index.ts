import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecipeView from '../views/RecipeView.vue'
import CookingView from '../views/CookingView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/recipe/:id', component: RecipeView },
    { path: '/recipe/:id/cook', component: CookingView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
