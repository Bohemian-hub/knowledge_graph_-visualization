<template>
  <div class="gContainer">
    <!-- <d3graph /> -->
    <gSearch @getData="update" @getnames="getnames" @getlabels="getlabels" @getlinkTypes="getlinkTypes" :new_search_node="new_search_node" @receiveinputs="receiveinputs" />
    <d3graph :data="data" :names="names" :labels="labels" :linkTypes="linkTypes" @queryNode="queryNode" />
    <!-- 添加一个接入了chatGPT的问答系统 -->
    <qaByChatGPT :new_input="input" />

  </div>
</template>

<script>
import gSearch from '@/components/gSearch.vue'
import d3graph from '@/components/d3graph.vue'
import qaByChatGPT from '@/components/qaByChatGPT.vue'
// import gpt from '@/components/gpt.vue'
export default {
  components: {
    gSearch,
    d3graph,
    qaByChatGPT
  },
  data() {
    return {
      // d3jsonParser()处理 json 后返回的结果
      data: {
        nodes: [],
        links: []
      },
      names: [],
      labels: [],
      linkTypes: [],

      new_search_node: '',
      input:''
    }
  },
  methods: {
    queryNode(node_name) {
      console.log(node_name);
      /* 需要把这个数据传给搜索栏，让他进行搜索 */
      this.new_search_node = node_name
    },
    /* 根据选择的库，获取到的不同的图例数据 */
    /* 节点的中文名字 */
    getnames(names) {
      console.log(names)
      this.names = names
    },
    /* 根据选择的库，获取到的不同的图例数据 */
    /* 节点的英文名字 */
    getlabels(labels) {
      console.log(labels)
      this.labels = labels
    },
    /* 根据选择的库，获取到的不同的图例数据 */
    /* 所涉及到的关系 */
    getlinkTypes(linkTypes) {
      console.log(linkTypes)
      this.linkTypes = linkTypes
    },
    receiveinputs(input){
      this.input = input
    },
    // 视图更新
    update(json) {
      console.log('update')
      console.log(json)
      this.d3jsonParser(json.data, json.mode)
    },
    /*eslint-disable*/
    // 解析json数据，主要负责数据的去重、标准化
    d3jsonParser(json, mode) {
      const nodes = []
      const links = [] // 存放节点和关系
      const nodeSet = [] // 存放去重后nodes的id

      // 使用vue直接通过require获取本地json，不再需要使用d3.json获取数据
      // d3.json('./../data/records.json', function (error, data) {
      //   if (error) throw error
      //   graph = data
      //   console.log(graph[0].p)
      // })
      console.log(mode);
      for (let item of json) {
        for (let segment of item.p.segments) {
          // 重新更改data格式

          if (nodeSet.indexOf(segment.start.identity) == -1) {
            nodeSet.push(segment.start.identity)
            nodes.push({
              id: segment.start.identity,
              label: segment.start.labels[0],
              properties: segment.start.properties
            })
          }
          if (nodeSet.indexOf(segment.end.identity) == -1) {
            nodeSet.push(segment.end.identity)
            nodes.push({
              id: segment.end.identity,
              label: segment.end.labels[0],
              properties: segment.end.properties
            })
          }
          if (mode == 'rela') {
            /* 只在处理关系数据的时候加载关系 */
            links.push({
              source: segment.relationship.start,
              target: segment.relationship.end,
              type: segment.relationship.type,
              properties: segment.relationship.properties
            })
          }

        }
      }
      console.log(nodes)
      console.log(links)
      // this.links = links
      // this.nodes = nodes
      this.data = { nodes, links }
      // return { nodes, links }
    }
  }
}
</script>

<style lang="scss" scoped>
.gContainer {
  height: 100vh;
  position: relative;
  background-color: #9dadc1;

  overflow: hidden;
}
</style>
