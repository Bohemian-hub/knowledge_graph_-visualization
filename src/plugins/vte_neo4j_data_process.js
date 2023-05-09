/*
 * @Date: 2023-04-19 01:09:02
 * @LastEditors: Bohemian-hub dongshangwl@gmail.com
 * @LastEditTime: 2023-04-25 22:06:34
 * @FilePath: /vue-d3-graph-main/src/plugins/vte_neo4j_data_process.js
 */
// Neo4j connection settings
var neo4j = require("neo4j-driver");
export const vte_search_load = [
    { value: '肺结核的表现症状', },
    { value: '肺栓塞的发病原因', },

    /* 中英文的检索预加载 */
    /* 这里涵盖了各种实体 */
    { value: '症状', },
    { value: '疾病', },
    { value: '检查', },
    { value: '治疗', },
    { value: '药物', },
    { value: '原因', },
    { value: '注意事项', },

    { value: 'symptom', },
    { value: 'disease', },
    { value: 'test', },
    { value: 'treatment', },
    { value: 'drug', },
    { value: 'factor', },
    { value: 'matter', },

]
/* 这里涵盖了所有的实体类型，用户可以输入类型查询所有的实体 */
const node_class = {
    /* 中文版本的节点类型 */
    症状: 'symptom',
    疾病: 'disease',
    检查: 'test',
    治疗: 'treatment',
    药物: 'durg',
    原因: 'factor',
    注意事项: 'matter',

    /* 英文版本的节点类型 */
    symptom: 'symptom',
    disease: 'disease',
    test: 'test',
    treatment: 'treatment',
    durg: 'durg',
    factor: 'factor',
    matter: 'matter',

}

var Chinese_rela_2_English = {
    '可治疗于': 'TrAD',  //治疗手段可施加到一种疾病上面
    '可治疗于': 'TrAS',  //治疗手段可施加到一种症状上面
    '可以证实': 'TeRD',  //检查可以查出病
    '需要检查': 'TeBD',  //病需要做什么检查
    '可发现': 'TeRS',    //检查可以查出症状
    '需要检查': 'TeAS',
    '导致': 'DIS',
    '可能被诊断为': 'SDD',
    '可导致': 'FCS',
    '可治疗疾病': 'DrAD', //一种药可治疗什么疾病
    '可治疗症状': 'DrAS', //一种药可治疗什么症状
    '可用于': 'DrTr',
    '疾病应该注意': 'DM',
    '症状应该注意': 'SM',
};

export function vte_get_neo4j_data(query) {
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
    1.查节点
    2.语句查询
    5.病的（关系）
*/
export function vte_input_2_cql(query) {
    // 判断字符串中是否包含 "match" 或 "return"（不区分大小写）
    /* 新增搜索模式，搜索一类实体 */
    let mode = 'rela'
    if (node_class[query] != undefined) {
        /* 如果用户查询的是一个类 */
        /* 直接返回这类节点的星云 */
        console.log("用户查询一类实体");
        /* 设置我要的数据格式是node */
        query = 'MATCH (n:' + node_class[query] + ') RETURN n limit 100'
        mode = 'node'
    } else if (query.toLowerCase().includes('match') || query.toLowerCase().includes('return')) {
        /* 说明这是一句简单的cql查询语句，直接返回就行了 */
    } else if(query.search(" ") != -1){
        /* 这里再加一个空格版本的 */
        /* 有空格就试试，和上面基本是一样的 */
        var entity_name = query.split(" ")[0]  //拿到空格前面的实体。
        var relation = query.split(" ").slice(-1)
                // 判断 Chinese_rela_2_English 数组中是否包含相关的中文关系
        // 定义正则表达式
        var regex = new RegExp(relation, 'i');
        var En_rela = 'DrAD'
        // 遍历对象，查找匹配项
        for (var key in Chinese_rela_2_English) {
            if (regex.test(key)) {
                En_rela = Chinese_rela_2_English[key]; // 返回匹配的值
                break; // 如果找到匹配的项，就跳出循环
            }
        }
        console.log(En_rela);
        /* 包括下面的match cypher语句中的where限制当前的查询数据vte的数据集 */
        /* 条件：
        where n.database = "vte" and m.database = "vte",
        然后这里查找条件是实体名称对应，关系对应就OK了
        */
        query = 'MATCH p=(n)-[r:' + En_rela + ']->(m) where n.database = "vte" and m.database = "vte" and n.name = "' + entity_name + '" RETURN p UNION MATCH p=(n)-[r:' + En_rela + ']->(m) where n.database = "vte" and m.database = "vte" and m.name = "' + entity_name + '" RETURN p LIMIT 50';

    }else {
        /* 直接查这个实体 */
        query = 'MATCH p = (n{name:"' + query + '"})-[]->(m) where n.database = "vte" and m.database = "vte" RETURN p UNION MATCH p = (n)-[]->(m{name:"' + query + '"}) where n.database = "vte" and m.database = "vte" RETURN p LIMIT 50'
    }
    let  res= {
        query:query,
        mode:mode
    }
    return res
}


export function vte_data_format(data) {
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
           /* 主要是vte数据中的关系没有创建属性，我的糖尿病数据是创建了关系的属性：name的 */
          /* 现在加一个关系属性name */
          data[i]._fields[0].segments[j].relationship.properties = {
            /* 下面是用我之前定义的中文关系和英文关系的对应对象中，根据英文关系找到中文关系 */
            name:Object.keys(Chinese_rela_2_English).find(key => Chinese_rela_2_English[key] === data[i]._fields[0].segments[j].relationship.type)
          }

        }

        let p = data[i]._fields[0]

        let item = {
            "p": p
        }
        data_arr.push(item)

    }

    return data_arr
}

export function vte_node_format(data){
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