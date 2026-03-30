export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/') {
    return navigateTo('/', { redirectCode: 301 })
  }
})
