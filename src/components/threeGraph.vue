<template>
  <div>
    <div id="3d-graph" class="three-graph"></div>
    <!-- 绘制图例 -->
    <div id="indicator">
      <!-- 利用item 遍历一个数组 利用index 遍历另外一个数组 -->
      <div v-for="(name, index) in names" :key="index">
        <span :data-state="states[index]" :data-index="index"
          :style="{ backgroundColor: states[index] === 'on' ? nodeColors[index] : '#aaa' }"></span>
        {{ name }}
      </div>
    </div>
    <!-- 绘制右边显示结果 -->
    <div id="info" v-show="selectNodeData.name !== undefined">
      <!-- <h4 :style="{ color: selectNodeData.color }">{{ selectNodeData.name }}</h4>
      <p v-for="(item, key) in selectNodeData.properties" :key="item">
        <span>{{ key }}</span>
        {{ item }}
      </p> -->
      <el-card :style="{ backgroundColor: selectNodeData.color }" class="node-card">
        <div slot="header" class="clearfix">
          <span>{{ selectNodeData.name }}</span>
          <el-button @click="btnEdit" style="float: right; padding: 3px 0;color: #409EFB;font-size: 15px;"
            type="text">编辑</el-button>
        </div>
        <div v-for="(item, key) in selectNodeData.properties" :key="item">
          <span style="margin-right: 8px;">{{ (nodeObjMap[key] ? nodeObjMap[key] : key) + ':' }}</span>
          <span style="text-align: right;"><b>{{ item }}</b></span>
        </div>
      </el-card>
    </div>
    <!-- 编辑框 -->
    <el-dialog :visible.sync="dialogFormVisible">
      <el-form :model="temp" label-position="right" label-width="86px" style="width: 500px; margin-left:50px;">
        <el-form-item v-for="(value, key) in temp" :key="key" :label="nodeObjMap[key] ? nodeObjMap[key] : key">
          <el-input v-model="temp[key]" :readonly="!isEdit" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelEdit">
          取消
        </el-button>
        <el-button type="primary" @click="doEdit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import ForceGraph3D from '3d-force-graph'
// threejs的精灵标签，用于文字的展示
import SpriteText from 'three-spritetext'
export default {
  name: 'threeGraph',
  props: {
    data: {
      type: Object,
      default: function () {
        return {
          nodes: [],
          links: []
        }
      }
    },
    /* eslint-disable */
    // 自定义图例（数组保证一一对应）
    // names		图例名称变量制作图标
    // labels		节点的标签名称（与records.json中保证相同）
    names: {
      type: Array
    },
    labels: Array,
    linkTypes: Array
  },
  mounted() {
    this.threeInit()
  },
  data() {
    return {
      // ForceGraph3D对象，供全局调用，实现动态更新
      Graph: {},
      // threeRender()最终展示到页面上的数据（节点隐藏功能）
      nodes: [],
      links: [],
      // 图例的名称、对应的颜色以及图例状态
      states: [],
      nodeColors: ['#FFC0CB', '#FFA07A', '#FFD700', '#98FB98', '#00FFFF', '#FF69B4', '#9370DB', '#00FA9A', '#1E90FF', '#FF8C00', '#7CFC00', '#FF00FF', '#6A5ACD', '#FFE4B5', '#DC143C', '#808080', '#FF1493', '#008B8B'],
      selectNodeData: {}, // 选中节点的详细信息展示
      temp: {}, // 临时存储编辑时的节点信息
      dialogFormVisible: false,
      isEdit: true,
      // 节点属性对应的标签名称
      nodeObjMap: {
        'name': '节点名称',
        'database': '所在数据库'
      }
    }
  },
  watch: {
    // 当请求到新的数据时，重新渲染
    data(newData, oldData) {
      console.log(newData, oldData)
      this.threeInit()
    }
  },
  methods: {
    // 视图更新
    update() {
      if (this.graph.length <= 20) {
        this.graph = require('../data/top5.json')
      } else {
        this.graph = require('../data/records.json')
      }
      // console.log(this.graph)
      console.log(this.graph.length)
      this.neoJsonParser(this.graph)
      // console.log(this.Graph)
      // 更新前清空DOM内canvas元素
      // 注意固定容器的宽高，防止渲染时容器塌陷
      document.getElementById('3d-graph').innerHTML = ''
      this.threeRender()

      // 更新数据暂不能用，卡死
      // this.threeUpdate({
      //   nodes: [],
      //   links: []
      // })
    },
    // 编辑当前选中节点
    btnEdit() {
      this.temp = Object.assign({}, this.selectNodeData.properties) // copy obj
      this.dialogFormVisible = true
      console.log(this.selectNodeData)
    },
    doEdit() {
      // console.log(this.data)
      let i = 0
      // 更新props的data 和 selectNodeData
      this.selectNodeData.name = this.temp.name
      this.selectNodeData.properties = this.temp
      for (let node of this.data.nodes) {
        // console.log(node.id === this.selectNodeData.id)
        // console.log(node.id)
        // console.log(this.selectNodeData.id)
        if (node.id == this.selectNodeData.id) {
          // this.$set(this.data.nodes, i, this.selectNodeData)
          // this.$set(this.nodes, i, this.selectNodeData)
          this.data.nodes[i].properties = this.temp
          this.nodes[i].properties = this.temp
          break
        }
        i++
      }
      this.dialogFormVisible = false
      this.threeInit()
      this.$message({
        message: '更新成功',
        type: 'success'
      })
    },
    cancelEdit() {
      this.dialogFormVisible = false
    },
    // d3初始化，包括数据解析、数据渲染
    threeInit() {
      this.links = this.data.links
      this.nodes = this.data.nodes
      this.threeRender()
      // 数据状态初始化
      this.stateInit()
    },
    // 数据状态初始化
    stateInit() {
      this.states = Array(this.names.length).fill('on')
    },
    threeRender() {
      // DOM初始化及数据挂载
      const elm = document.getElementById('3d-graph')
      this.Graph = ForceGraph3D()(elm)
        .graphData(this.data)

      // 设置画布样式、节点及关系样式、事件绑定等
      this.Graph.height(window.innerHeight).width(window.innerWidth)
        .backgroundColor('#252b32')
        // 节点样式和标签设置
        .nodeRelSize(7)
        .nodeColor(node => {
          let index = 0
          switch (node.label) {
            case this.labels[0]: break;
            case this.labels[1]: index = 1; break;
            case this.labels[2]: index = 2; break;
            case this.labels[3]: index = 3; break;
            case this.labels[4]: index = 4; break;
            case this.labels[5]: index = 5; break;
            case this.labels[6]: index = 6; break;
            case this.labels[7]: index = 7; break;
            case this.labels[8]: index = 8; break;
            case this.labels[9]: index = 9; break;
            case this.labels[10]: index = 10; break;
            case this.labels[11]: index = 11; break;
            case this.labels[12]: index = 12; break;
            case this.labels[13]: index = 13; break;
            case this.labels[14]: index = 14; break;
            case this.labels[15]: index = 15; break;
            case this.labels[16]: index = 16; break;
            case this.labels[17]: index = 17; break;
            default: index = 18; break;
          }
          return this.nodeColors[index]
        })
        // .nodeAutoColorBy('label')
        // 给节点添加文字
        // .nodeThreeObjectExtend(true)
        //下面是文字的样式，不要文字会不会就好一点
        // .nodeThreeObject(node => {
        //   const sprite = new SpriteText(node.properties.name)
        //   sprite.material.depthWrite = false // make sprite background transparent
        //   // 设置文字颜色
        //   let i = 0
        //   for (; i < this.labels.length; i++) {
        //     if (node.label === this.labels[i]) break
        //   }
        //   sprite.color = this.nodeColors[i]
        //   sprite.textHeight = 3;
        //   sprite.padding = [2, 2];
        //   sprite.fontSize = 20;
        //   sprite.fontWeight = 'bold';
        //   sprite.textAlign = 'center';
        //   sprite.textBaseline = 'middle';
        //   sprite.material.depthWrite = false;
        //   sprite.material.depthTest = false;

        //   // 将文字向上移动 5 个单位，向右移动 2 个单位
        //   sprite.position.set(5, 5, 5);

        //   return sprite
        // })
        .nodeThreeObjectExtend(true)

        .nodeOpacity(1) //节点的透明度
        // 节点事件绑定
        .onNodeHover(node => elm.style.cursor = node ? 'pointer' : null)
        .onNodeClick(node => {
          console.log(node)
          //设置#info h4样式的颜色为该节点的颜色，文本为该节点name
          this.$set(this.selectNodeData, 'id', node.id)
          this.$set(this.selectNodeData, 'name', node.properties.name)
          // 获取节点类型对应的颜色
          // let index = 0
          // switch(node.label) {
          //   case 'Enterprise': break;
          //   case 'Type': index = 1;break;
          //   case 'Region': index = 2;break;
          //   default: index = 3;break;
          // }
          let i = 0
          for (; i < this.labels.length; i++) {
            if (node.label === this.labels[i]) break
          }
          this.$set(this.selectNodeData, 'color', this.nodeColors[i])
          this.$set(this.selectNodeData, 'properties', node.properties)
        })
        // 关系样式

        .linkLabel((link) => {
          let label = link.properties.name;
          return label;
        })
        .linkColor('#8c322d')
        .linkWidth(0.2)
        .linkOpacity(1)
        .linkDirectionalArrowLength(3.5) //箭头长度
        .linkDirectionalArrowRelPos(1) //箭头位置偏移 source指向target
        // .linkCurvature(0.25) //曲度


      this.Graph.d3Force('charge').strength(-150)
  },
  threeUpdate(data) {
    this.Graph.graphData({
      data
    })
  },
  // 随机生成一个规模为N的图
  createRandomGraph(N = 300) {
    return {
      nodes: [...Array(N).keys()].map(i => ({ id: i })),
      links: [...Array(N).keys()]
        .filter(id => id)
        .map(id => ({
          source: id,
          target: Math.round(Math.random() * (id - 1))
        }))
    }
  }
},
}
</script>

<style lang="scss" scoped>
@media only screen and (max-width: 100%) {

  #info,
  #indicator {
    display: none !important;
  }
}

.three-graph {
  width: 100%;
  height: 800vh;
  background-color: #000;
  margin: 0px 0px;
  // border: 2px #fff solid;
}

#indicator {
  position: absolute;
  // left: 50px;
  // bottom: 30px;
  right: 3vw;
  top: 2vw;
  text-align: left;
  color: #f2f2f2;
  font-size: 14px;
  font-weight: bold;

  &>div {
    margin-bottom: 4px;
  }

  span {
    display: inline-block;
    width: 32px;
    height: 16px;
    position: relative;
    top: 2px;
    margin-right: 8px;
  }
}

/*悬浮节点的info样式*/
/*悬浮节点的info样式*/
#info {
  position: absolute;
  bottom: 40px;
  right: 30px;
  width: 270px;

  .node-card {
    border: 1px solid #9faecf;
    background-color: #00aeff6b;
    color: #000000;  //原来是，白色很好看，but估计教授看不太清
    text-align: left;

    // transition: background-color;
    // transition-delay: .3s;
    // transition-timing-function: ease;
    .el-card__header {
      border-bottom: 1px solid #50596d;
    }
  }
}

// #info {
//   position: absolute;
//   bottom: 40px;
//   right: 30px;
//   text-align: right;
//   width: 270px;
//   p {
//     color: #fff;
//     font-size: 12px;
//     margin-top: 0;
//     margin-bottom: 5px;
//   }
//   p span {
//     color: #888;
//     margin-right: 10px;
//   }
//   h4 {
//     color: #fff;
//   }
// }
</style>
