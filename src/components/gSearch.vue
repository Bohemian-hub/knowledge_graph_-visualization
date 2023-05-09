<!--
 * @Date: 2021-07-27 21:55:50
 * @LastEditors: Bohemian-hub dongshangwl@gmail.com
 * @LastEditTime: 2023-05-09 11:27:11
 * @FilePath: /vue-d3-graph-main/src/components/gSearch.vue
-->
<template>
  <div class="search_bar">
    <!-- <el-button style="margin-top: 15px;" @click="query">图数据切换，动态更新</el-button> -->
    <el-autocomplete ref="autocomplete" style="width: 800px" v-model="input" :fetch-suggestions="querySearch"
      placeholder="请输入内容" :trigger-on-focus="false" @select="handleSelect" clearable>

      <!-- 在下面这个区域选择要查询的数据库，做到一个普遍适用性 -->
      <!-- 在选择了不同的数据库后，前端的准备数据需要更改：
        1.标签对应
        2.搜索加载数据
      -->
      <el-select v-model="mode" slot="prepend" placeholder="单实体查询" @change="chooseGraphDatabase">
        <el-option label="糖尿病" value="1"></el-option>
        <el-option label="VTE" value="2"></el-option>
        <el-option label="其他病等等" value="3"></el-option>
      </el-select>
      <el-button slot="append" type="success" icon="el-icon-search" @click="query">搜索</el-button>
    </el-autocomplete>
  </div>
</template>

<script>
/* 对待不同的数据库有不同的检索方式，因为数据库中包含的实体类型不同 */
import { get_neo4j_data, input_2_cql, data_format, node_format, search_load } from '../plugins/diabetes_neo4j_data_process'
import { vte_get_neo4j_data, vte_input_2_cql, vte_data_format, vte_node_format, vte_search_load } from '../plugins/vte_neo4j_data_process'
export default {
  name: 'gSearch',
  // props: {
  //   isShowPrepend: {
  //     type: Boolean,
  //     default: true
  //   }
  // },
  props: ['new_search_node'],
  watch: {
    new_search_node: function (newVal, oldVal) {
      console.log('参数 myProp 改变了：', newVal)
      /* 数据变了，准备触发搜索 */
      this.input = newVal
      this.query()
    }
  },
  data() {
    return {
      input: 'match p = ()-[]-() return p limit 300',
      mode: '1',
      // 后台请求到的json数据
      data: require('../data/top1.json'),
      results: [],
      /* 当前模式下的标签图例数据 */
      names: ['企业', '贸易类型', '地区', '国家'],
      labels: ['Disease', 'Type', 'Region', 'Country'],
      linkTypes: ['', 'type', 'locate', 'export']

    }
  },
  mounted() {
    /* 设置图例 */
    this.setGraphLabels()
    // this.$emit('getData', this.data)
    this.query()
    /* 设置搜索的预加载数据 */
    this.loadAll()
  },
  methods: {
    setGraphLabels() {
      if (this.mode == 1) {
        /* 糖尿病数据 */
        this.names =
          ['疾病', '原因', '症状', '检查',
            '检查值', '药物', '频率', '量', '方法',
            '治疗', '手术', '部位', '等级', '持续时间',
            '分类', '检查项目', '附加影响', '发病机理']
        this.labels =
          ['Disease', 'Reason', 'Symptom', 'Test',
            'Test_Value', 'Drug', 'Frequency', 'Amount', 'Method',
            'Treatment', 'Operation', 'Anatomy', "Level", 'Duration',
            'Class', 'Test_items', 'ADE', 'Pathogenesis',]

        this.linkTypes =
          ['', 'Test_Disease', 'Symptom_Disease', 'Treatment_Disease', 'Drug_Disease',
            'Anatomy_Disease', 'Frequency_Drug', 'Duration_Drug', 'Amount_Drug',
            'Method_Drug', 'Class_Disease', 'Test_items_Disease', 'Reason_Disease',
            'ADE_Drug', 'Pathogenesis_Disease', 'Operation_Disease', 'ADE_Disease',]
      } else if (this.mode == 2) {
        /* VTE数据 */
        this.names = ['症状', '疾病', '检查', '治疗', '药物', '原因', '注意事项'],
          this.labels = ['symptom', 'disease', 'test', 'treatment', 'durg', 'factor', 'matter'],
          this.linkTypes = ['', 'TrAD', 'TrAS', 'TeRD', 'TeBD'
        , 'TeRS', 'TeAS', 'DIS', 'SDD', 'FCS', 'DrAD', 'DrAS', 'DrTr', 'DM', 'SM']  //这个关系其实都没啥用暂时
      }

      /* 马上更新图例 */
      this.$emit('getnames', this.names)
      this.$emit('getlabels', this.labels)
      this.$emit('getlinkTypes', this.linkTypes)
    },
    /* 这里去搜索数据 */
    async query() {
      //搜索的时候要选择对用的数据库，根据模式进行匹配
      /* 搜索的时候提示应该收起来，但是没有收起来，这里把输入框suggestions置空，然后重新赋值 */
      this.$refs.autocomplete.suggestions = [];
      /* 下面这些搜索示例都是基于糖尿病的，如果遇到了其他的疾病系统，还需要改进一下 */
      /* 根据用户输入的信息，匹配对应的查询语句 */
      if (this.mode == 1) {
        /* 使用糖尿病的搜索匹配规则 */
        let res = input_2_cql(this.input)
        console.log(res.query, res.mode);

        /* 执行查询语句获取数据 */
        let result = await get_neo4j_data(res.query)
        console.log(result);

        /* 处理数据为通用绘图数据 */
        if (result.status == 200) {
          let data = result.result.records
          // console.log(data);
          if (res.mode == 'rela') {
            data = data_format(data)
          } else if (res.mode == 'node') {
            data = node_format(data)
          }
          console.log(data);

          this.data = {
            data: data,
            mode: res.mode
          }
          /* 把搜索到的数据传回去 */
          this.$emit('getData', this.data)
          this.$emit('receiveinputs', this.input)
        }
      } else if (this.mode == 2) {
        /* 使用vte的搜索匹配规则 */

        console.log("现在正在使用VTE的匹配规则和数据");
        let res = vte_input_2_cql(this.input)
        console.log(res.query, res.mode);

        /* 执行查询语句获取数据 */
        let result = await vte_get_neo4j_data(res.query)
        console.log(result);

        /* 处理数据为通用绘图数据 */
        if (result.status == 200) {
          let data = result.result.records
          // console.log(data);
          if (res.mode == 'rela') {
            data = vte_data_format(data)
          } else if (res.mode == 'node') {
            data = vte_node_format(data)
          }
          console.log(data);




          this.data = {
            data: data,
            mode: res.mode
          }
          /* 把搜索到的数据传回去 */
          this.$emit('getData', this.data)
        }
      }





    },
    chooseGraphDatabase() {
      /* 当前所使用的知识图谱 */
      console.log(this.mode)
      /* 重新设置一下图例 */
      this.setGraphLabels()
      /* 重新设置一下图例 */
      this.loadAll()
    },
    querySearch(queryString, cb) {
      var res = this.results
      var results = queryString ? res.filter(this.createFilter(queryString)) : res
      // 调用 callback 返回建议列表的数据
      cb(results)
    },
    createFilter(queryString) {
      return (res) => {
        return (res.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1)
      }
    },
    // 模拟加载数据
    loadAll() {
      /* 判断当前是什么病，使用不同的js里面的内容 */

      if (this.mode == 1) {
        this.results = search_load
      } else if (this.mode == 2) {
        this.results = vte_search_load
      }
    },
    handleSelect(item) {
      console.log(item)
    }
  }
}
</script>

<style lang='scss' scoped>
.el-select {
  width: 120px;
  // background-color: #fff;
}

.input-with-select .el-input-group__prepend {
  background-color: #6ecbf3;
}

.search_bar {
  width: 800px;
  position: fixed;
  left: calc(50% - 400px);
  top: 20px;
  z-index: 999;
}
</style>
