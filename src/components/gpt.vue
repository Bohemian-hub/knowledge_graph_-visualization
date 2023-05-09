<template>
    <div class="container">
        <button @click="generateResponse">Get Response</button>
    </div>
</template>
  
  
<script lang=js>

import axios from 'axios'
export default {
    name: "gpt",
    data() {

    },

    methods: {
        async generateResponse() {
            try {
                const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: [{"role": "user", "content": "Hello!"}]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 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'
                    }
                })
                const responseData = response.data.choices[0].message.content
                console.log(responseData)
            } catch (error) {
                console.error(error)
            }
        }
    }

}


</script>
  
  
<style scoped>
.container {
    position: fixed;
    top: 0;
    left: 0;
}
</style>
  
  