<template>
  <div
    class="
      bg-white
      shadow
      rounded-sm
      sm:rounded-md sm:overflow-hidden
      px-4
      py-6
      sm:px-6
    "
    v-on="$listeners"
  >
    <slot />
  </div>
</template>

<script>
export default {}
</script>
