/**
 * 豆包 AI 客户端 - AI World Extension
 * 使用豆包 1.8 模型进行智能体决策
 */

/**
 * 豆包 API 配置
 */
export const DOUBAO_CONFIG = {
  apiKey: "75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c",
  baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  model: "doubao-seed-1-8-251228",
  temperature: 0.8, // 提高创造性
  maxTokens: 1500,
  topP: 0.9,
  timeout: 15000, // 15秒超时
};

/**
 * 调用豆包 API
 */
export async function callDoubaoAPI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: any[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOUBAO_CONFIG.timeout);

    const response = await fetch(`${DOUBAO_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOUBAO_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: DOUBAO_CONFIG.model,
        messages: messages,
        temperature: DOUBAO_CONFIG.temperature,
        max_tokens: DOUBAO_CONFIG.maxTokens,
        top_p: DOUBAO_CONFIG.topP,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `豆包 API 调用失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("豆包 API 返回格式错误");
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("豆包 API 调用超时");
    }
    throw error;
  }
}

/**
 * 解析 AI 响应（支持 JSON 和纯文本）
 */
export function parseAIResponse(response: string): any {
  try {
    // 尝试提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // 如果没有 JSON，尝试解析文本
    const lines = response.split("\n").filter((line) => line.trim());
    const result: any = {};

    for (const line of lines) {
      if (line.includes("action") || line.includes("行动")) {
        if (line.includes("gather") || line.includes("采集")) {
          result.action = "gather";
        } else if (line.includes("build") || line.includes("建造")) {
          result.action = "build";
        } else if (line.includes("trade") || line.includes("交易")) {
          result.action = "trade";
        } else if (line.includes("explore") || line.includes("探索")) {
          result.action = "explore";
        } else if (line.includes("move") || line.includes("移动")) {
          result.action = "move";
        } else {
          result.action = "wait";
        }
      }

      if (line.includes("reason") || line.includes("原因")) {
        result.reason = line.split(/[:：]/)[1]?.trim() || "AI 决策";
      }
    }

    if (!result.action) {
      result.action = "wait";
      result.reason = "等待更好的时机";
    }

    return result;
  } catch (error) {
    console.error("解析 AI 响应失败:", error);
    return {
      action: "wait",
      reason: "解析失败，等待下次决策",
    };
  }
}

/**
 * 测试豆包 API 连接
 */
export async function testDoubaoConnection(): Promise<boolean> {
  try {
    const response = await callDoubaoAPI(
      "请用一句话介绍你自己",
      "你是一个 AI 助手"
    );
    console.log("✅ 豆包 API 连接成功:", response);
    return true;
  } catch (error: any) {
    console.error("❌ 豆包 API 连接失败:", error.message);
    return false;
  }
}
