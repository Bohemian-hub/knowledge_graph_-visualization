/*
 * @Date: 2023-04-19 01:09:02
 * @LastEditors: Bohemian-hub dongshangwl@gmail.com
 * @LastEditTime: 2023-04-25 19:14:11
 * @FilePath: /vue-d3-graph-main/src/plugins/diabetes_neo4j_data_process.js
 */
// Neo4j connection settings
var neo4j = require("neo4j-driver");
export const search_load = [
    { value: '糖尿病的伴随症状', },
    { value: '糖尿病的发病原因', },

    /* 中英文的检索预加载 */
    { value: '疾病', },
    { value: '原因', },
    { value: '症状', },
    { value: '检查', },
    { value: '检查值', },
    { value: '药物', },
    { value: '频率', },
    { value: '量', },
    { value: '方法', },
    { value: '治疗', },
    { value: '手术', },
    { value: '部位', },
    { value: '等级', },
    { value: '持续时间', },
    { value: '分类', },
    { value: '检查项目', },
    { value: '附加影响', },
    { value: '发病机理', },

    { value: 'Disease', },
    { value: 'Reason', },
    { value: 'Symptom', },
    { value: 'Test', },
    { value: 'Test_Value', },
    { value: 'Drug', },
    { value: 'Frequency', },
    { value: 'Amount', },
    { value: 'Method', },
    { value: 'Treatment', },
    { value: 'Operation', },
    { value: 'Anatomy', },
    { value: 'Level', },
    { value: 'Duration', },
    { value: 'Class', },
    { value: 'Test_items', },
    { value: 'ADE', },
    { value: 'Pathogenesis', },
]
/* 这里涵盖了所有的实体类型，用户可以输入类型查询所有的实体 */
const node_class = {
    /* 中文版本的节点类型 */
    疾病: 'Disease',
    原因: 'Reason',
    症状: 'Symptom',
    检查: 'Test',
    检查值: 'Test_Value',
    药物: 'Drug',
    频率: 'Frequency',
    量: 'Amount',
    方法: 'Method',
    治疗: 'Treatment',
    手术: 'Operation',
    部位: 'Anatomy',
    等级: 'Level',
    持续时间: 'Duration',
    分类: 'Class',
    检查项目: 'Test_items',
    附加影响: 'ADE',
    发病机理: 'Pathogenesis',
    /* 英文版本的节点类型 */
    Disease: 'Disease',
    Reason: 'Reason',
    Symptom: 'Symptom',
    Test: 'Test',
    Test_Value: 'Test_Value',
    Drug: 'Drug',
    Frequency: 'Frequency',
    Amount: 'Amount',
    Method: 'Method',
    Treatment: 'Treatment',
    Operation: 'Operation',
    Anatomy: 'Anatomy',
    Level: 'Level',
    Duration: 'Duration',
    Class: 'Class',
    Test_items: 'Test_items',
    ADE: 'ADE',
    Pathogenesis: 'Pathogenesis'
}

var Chinese_rela_2_English = {
    '发病原因': 'Reason_Disease',
    '检查大类': 'Test_Disease',
    '检查细类': 'Test_items_Disease',
    '并发症': 'ADE_Disease',
    '病变部位': 'Anatomy_Disease',
    '使用药品': 'Drug_Disease',
    '发病机理': 'Pathogenesis_Disease',
    '伴随症状': 'Symptom_Disease',
    '手术治疗': 'Operation_Disease',
    '疾病类型': 'Class_Disease',
    '用药频率': 'Frequency_Drug',
    '用药周期': 'Duration_Drug',
    '用药数量': 'Amount_Drug',
    '用药方式': 'Method_Drug',
    '药物副作用': 'ADE_Drug',
};

export function get_neo4j_data(query) {
    /* 这里查询需要时间，封装一个promise异步接收结果 */
    return new Promise((resolve, reject) => {
        const neo4jUrl = "bolt://localhost:7687";
        const neo4jUser = "neo4j";
        const neo4jPassword = "12345678";

        // Create Neo4j driver
        const driver = neo4j.driver(
            neo4jUrl,
            neo4j.auth.basic(neo4jUser, neo4jPassword)
        );

        var session = driver.session();

        session
            .run(query, {})
            .then(function (data) {

                console.log("neo4j 结果", data);
                var result = {
                    status: 200,
                    notice: '查询成功',
                    result: data
                }
                session.close();
                resolve(result)
            })
            .catch(function (error) {
                var result = {
                    status: 400,
                    notice: '查询语句不合法',
                    result: error,
                }
                driver.close();
                resolve(result)
            });
    })
}

/* 这里的查询语句分为三种类型
    1.cql查询语句
    2.病,药
    4.药治的病
    5.病的（关系）
*/
export function input_2_cql(query) {
    // 判断字符串中是否包含 "match" 或 "return"（不区分大小写）
    /* 新增搜索模式，搜索一类实体 */
    let mode = 'rela'
    if (node_class[query] != undefined) {
        /* 如果用户查询的是一个类 */
        console.log("用户查询一类实体");
        /* 设置我要的数据格式是node */
        query = 'MATCH (n:' + node_class[query] + ') RETURN n limit 100'
        mode = 'node'
    } else if (query.toLowerCase().includes('match') || query.toLowerCase().includes('return')) {
        /* 注意这里暂时只支持查询关系的cql语句，如果要支持能查询节点的查询语句还需要对于语句做判断 */
        /* 说明这是一句简单的cql查询语句，直接返回就行了 */
    } else if (query.search("的") != -1 && query.search("治") == -1) {
        /* 如果里面只有 ”的“，那就切分 */
        var disease = query.split("的")[0]
        var relation = query.split("的").slice(-1)
        // 判断 Chinese_rela_2_English 数组中是否包含相关的中文关系
        // 定义正则表达式
        var regex = new RegExp(relation, 'i');
        var En_rela = 'Drug_Disease'
        // 遍历对象，查找匹配项
        for (var key in Chinese_rela_2_English) {
            if (regex.test(key)) {
                En_rela = Chinese_rela_2_English[key]; // 返回匹配的值
                break; // 如果找到匹配的项，就跳出循环
            }
        }
        console.log(En_rela);
        /* 包括下面的match cypher语句中的where限制当前的查询数据为糖尿病数据集的 */
        /* 条件：
        where n.database = "diabetes" and m.database = "diabetes"
        */
        query = 'MATCH p=(n)-[r:' + En_rela + ']->(m:Disease{name:"' + disease + '"}) where n.database = "diabetes" and m.database = "diabetes" RETURN p LIMIT 50';

    } else if (query.search("治") != -1 || query.search("什么病") != -1) {
        /* 如果里面有 ”治“，那就拿到前面的药 */
        var zhi = "治";
        var z = query.split(zhi);
        var drug = z[0]
        query = 'MATCH p=(n:Drug{name:"' + drug + '"})-[r:Drug_Disease]->(m) where n.database = "diabetes" and m.database = "diabetes" RETURN p LIMIT 50';

    } else {
        query = 'MATCH p = (n{name:"' + query + '"})-[]->(m) where n.database = "diabetes" and m.database = "diabetes" RETURN p UNION MATCH p = (n)-[]->(m{name:"' + query + '"}) where n.database = "diabetes" and m.database = "diabetes" RETURN p LIMIT 50'
    }
    let  res= {
        query:query,
        mode:mode
    }
    return res
}

export function data_format(data) {
    console.log(data);

    var data_arr = []
    for (let i in data) {
        // 这里的identity不是直接数字而是low,high,转化一下
        data[i]._fields[0].start.identity = data[i]._fields[0].start.identity.low
        data[i]._fields[0].end.identity = data[i]._fields[0].end.identity.low

        for (let j in data[i]._fields[0].segments) {
            data[i]._fields[0].segments[j].relationship.identity = data[i]._fields[0].segments[j].relationship.identity.low
            data[i]._fields[0].segments[j].relationship.start = data[i]._fields[0].segments[j].relationship.start.low
            data[i]._fields[0].segments[j].relationship.end = data[i]._fields[0].segments[j].relationship.end.low
        }

        let p = data[i]._fields[0]

        let item = {
            "p": p
        }
        data_arr.push(item)

    }

    return data_arr
}

export function node_format(data){
    console.log(data);
    var data_arr = []
    for(let j in data){
        
        let item = {
            "p": {
                "segments": [
                  {
                    "start": {
                      "identity": data[j]._fields[0].identity.low,
                      "labels": data[j]._fields[0].labels,
                      "properties": data[j]._fields[0].properties
                    },
                    "relationship": {
                        "identity": 0,
                        "start": data[j]._fields[0].identity.low,
                        "end": data[j]._fields[0].identity.low,
                        "type": "type",
                        "properties": {
                          "name": "类型"
                        }
                      },
                    "end": {
                        "identity": data[j]._fields[0].identity.low,
                        "labels": data[j]._fields[0].labels,
                        "properties": data[j]._fields[0].properties
                    }
                  }
                ],
                "length": 1.0
              },
        }
        data_arr.push(item)
    }


    return data_arr
}


/* 下面是一个函数用来判断当前的查询语句是返回一个节点还是一个关系 */
/* 这个部分暂时没有实现，后面再考虑这个步骤，chatGPT并没有给出可行的方案 */
function isReturnNodes(query) {
    const regex = /\breturn\s+(.*)\s+limit\b/i;
    const matches = regex.exec(query);
    if (matches) {
      const returnClause = matches[1];
      if (returnClause.match(/\s*\w+\.?\w*\s*$/) && !returnClause.includes('-')) {
        // 返回单个节点，不包含连线符号
        return true;
      } else if (returnClause.includes('-') && !returnClause.includes(',')) {
        // 返回单个连线，不包含逗号
        return false;
      } else {
        // 其他情况，返回 default
        return true;
      }
    } else {
      // 没有找到 return 子句，返回 default
      return true;
    }
  }