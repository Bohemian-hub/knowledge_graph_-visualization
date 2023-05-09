<!--
 * @Date: 2023-04-26 13:45:48
 * @LastEditors: Bohemian-hub dongshangwl@gmail.com
 * @LastEditTime: 2023-04-26 17:05:18
 * @FilePath: /vue-d3-graph-main/src/components/qaByChatGPT.vue
-->
<template>
  <div class="qacontainer" id="qacontainer">
    <div class="qa_title">ChatGPT 辅助回答</div>
    <!-- 做两个框架为了美观 -->
    <div class="qa_not_scroll_bar">
      <!-- 下面的内容宽度95 -->
      <div class="qa_content">
        <p v-html="answer"></p>

      </div>
    </div>

    <div class="clear"></div>

  </div>
</template>
  
<script>
import axios from 'axios'
import { Loading } from 'element-ui';
export default {
  name: 'qaByChatGPT',
  data() {
    return {
      answer: "请在上方搜索框输入内容，这边为您提供更多相关信息哦！"
    };
  },
  props: ['new_input'],
  watch: {
    new_input: function (newVal, oldVal) {
      console.log('参数 myProp 改变了：', newVal)
      /* 数据变了，准备触发搜索 */
      this.input = newVal
      this.generateResponse()
    }
  },
  mounted() {
    console.log(this.input);

  },
  methods: {
    async generateResponse() {
      var options = {
        target:'#qacontainer',
        fullscreen: true
      }
      let loadingInstance = Loading.service(options);

      console.log(this.input);
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [{ "role": "system", "content": "用尽可能少的文字查询一下内容，并给回答中重点字词根据类型加上不同颜色，用<a style='color:red'></a>、<a style='color:'></a>这样前端的方式。" },{ "role": "user", "content": this.input }]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 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'
          }
        })
        const responseData = response.data.choices[0].message.content
        console.log(responseData)
        this.answer = responseData
        this.input = ''
          this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
          loadingInstance.close();
        });

      } catch (error) {
        console.error(error)
        this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
        loadingInstance.close();
      });

      }
    }
  },
}
</script>
  
<style lang="scss" scoped>
.clear {
  clear: both;
  width: 100%;
  height: 0px;
}

.qacontainer {
  width: 200px;

  background-color: rgba(242, 251, 255, 0.775);
  border-radius: 5px;
  position: fixed;
  left: 40px;
  bottom: 20px;
  z-index: 999;

  .qa_title {
    width: 100%;
    text-align: left;
    height: 30px;
    line-height: 30px;
    padding-left: 10px;
    font-weight: 600;
    font-size: 15px;
    color: rgba(100, 94, 94, 0.859);
  }

  .qa_not_scroll_bar {
    max-height: 300px;
    width: 90%;
    overflow: hidden;
    box-shadow: 0 5px 5px 10px rgba(191, 190, 190, 0.609);
    border: 1px solid rgba(119, 119, 119, 0.12);
    box-sizing: border-box;
    border-radius: 5px;
    margin: 10px 5% 10px;
    padding: 5px 5px 0 5px;
  }

  .qa_content {
    cursor: pointer;
    width: 187px;
    max-height: 300px;
    overflow-y: scroll;
    overflow-x: hidden;
    font-size: 13px;
    text-indent: 2em;
    text-align: left;
    color: rgb(49, 92, 144);
  }
}</style>