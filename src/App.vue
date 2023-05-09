<!--
 * @Date: 2021-07-27 21:55:50
 * @LastEditors: Bohemian-hub dongshangwl@gmail.com
 * @LastEditTime: 2023-05-09 11:10:44
 * @FilePath: /vue-d3-graph-main/src/App.vue
-->
<template>
  <div id="app">
    <div id="nav">
      <!-- <b> 导航部分 </b> | -->
      <router-link to="/"> 2D知识图谱</router-link> |
      <router-link to="/3dView"> 3D知识图谱</router-link>
    </div>
    <router-view/>
  </div>
</template>

<style lang="scss" scoped>
body {
  margin: 0;
  padding: 0;
  list-style: none;
  text-decoration: none;
  font-size: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;

}

#nav {
  margin: 0px;
  width: 200px;
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 1;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
