import openai from "@/services/openai";
import db from "@/services/db"

// 讓前端的資料庫的資料的API
export async function GET() {
    // 取得vocab-ai集合內的所有文件 並定義由最新台到最舊
    const docList = await db.collection("vocab-ai").orderBy("createdAt", "desc").get()
    // 準備要回應的資料
    const vocabList = []
    // 將取得的文件一個一個取出
    docList.forEach(doc => {
        // console.log("一筆文件", doc)
        // console.log("一筆資料", doc.data())
        const result = doc.data()

        // 將result放入vocabList
        vocabList.push(result)
    })
    // 將vocabList回傳給前端
    return Response.json(vocabList)
}
export async function POST(req) {
    const body = await req.json();
    console.log("body:", body);
    const { userInput, language } = body;
    // 透過gpt-4o-mini模型讓AI回傳相關單字
    // 文件連結：https://platform.openai.com/docs/guides/text-generation/chat-completions-api?lang=node.js
    // JSON Mode: https://platform.openai.com/docs/guides/text-generation/json-mode?lang=node.js
    const systemPrompt = `請作為一個單字聯想AI根據所提供的單字聯想5個相關單字`;
    const prompt = `請作為一個單字聯想5個相關單字並放在JSON中

    # 例如：
    主題：水果
    語言: English

    # 回應範例：
    {
                wordList: ["Apple", "Banana", "Cherry", "Date", "Elderberry"],
                zhWordList: ["蘋果", "香蕉", "櫻桃", "棗子", "接骨木"],
              }
    主題：${userInput}
    語言: ${language}
    `;

    const openAIReqBody = {
        messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": prompt }
        ],
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
    };
    const completion = await openai.chat.completions.create(openAIReqBody);
    // 將ai回傳的字串轉換為物件
    const payload = JSON.parse(completion.choices[0].message.content);
    console.log("payload:", payload);
    console.log("payload的型別:", typeof payload);
    // 準備要回傳給前端的資料
    const result = {
        title: userInput,
        payload,
        language,
        createdAt: new Date().getTime(),
    };
    // 把result存到vocab-ai集合內
    await db.collection(`vocab-ai`).add(result);
    // 把result傳給前端
    return Response.json(result);
}