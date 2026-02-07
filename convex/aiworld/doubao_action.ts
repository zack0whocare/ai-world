/**
 * 豆包 AI Action - 在 Convex Action 中调用豆包 API
 * Action 可以使用 fetch()，但不能直接访问数据库
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

// 豆包 API 配置
export const DOUBAO_CONFIG = {
  apiKey: "75a9b8e7-3c4d-4b31-a991-b99f2eaaba2c",
  baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  model: "doubao-seed-1-8-251228",
  temperature: 0.8,
  maxTokens: 1500,
  topP: 0.9,
};

/**
 * 调用豆包 API（Action）
 */
export const callDoubaoAI = action({
  args: {
    systemPrompt: v.string(),
    userPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("🌐 [Action] 开始调用豆包 API...");
      
      const response = await fetch(`${DOUBAO_CONFIG.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DOUBAO_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: DOUBAO_CONFIG.model,
          messages: [
            {
              role: "system",
              content: args.systemPrompt,
            },
            {
              role: "user",
              content: args.userPrompt,
            },
          ],
          temperature: DOUBAO_CONFIG.temperature,
          max_tokens: DOUBAO_CONFIG.maxTokens,
          top_p: DOUBAO_CONFIG.topP,
        }),
      });

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

      const aiResponse = data.choices[0].message.content;
      console.log("✅ [Action] 豆包 API 调用成功");
      
      return {
        success: true,
        response: aiResponse,
      };
    } catch (error: any) {
      console.error("❌ [Action] 豆包 API 调用失败:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * 解析 AI 响应（支持 JSON 和纯文本）
 */
export function parseAIResponse(aiResponse: string): any {
  try {
    // 尝试提取 JSON（支持 markdown 代码块）
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                     aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // 验证必需字段
      if (parsed.action) {
        return parsed;
      }
    }

    // 如果无法解析为 JSON，尝试从文本中提取关键信息
    const actionMatch = aiResponse.match(/action["\s:]+(\w+)/i);
    const targetMatch = aiResponse.match(/target["\s:]+(\w+)/i);
    const reasonMatch = aiResponse.match(/reason["\s:"]+([^"}\n]+)/i);

    if (actionMatch) {
      return {
        action: actionMatch[1],
        target: targetMatch ? targetMatch[1] : null,
        reason: reasonMatch ? reasonMatch[1].trim() : "AI 决策",
      };
    }

    // 默认返回等待
    return {
      action: "wait",
      reason: "AI 响应解析失败",
    };
  } catch (error) {
    console.error("解析 AI 响应失败:", error);
    return {
      action: "wait",
      reason: "解析失败",
    };
  }
}
