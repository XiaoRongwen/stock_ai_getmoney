import { Request, Response } from "express";
import axios from "axios";
import { env } from "@/config/env";

const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

/**
 * POST /api/ai/analyze
 * 对单条电报做 AI 解读，流式 SSE 返回
 * body: { content: string, title?: string }
 */
export const analyze = async (req: Request, res: Response): Promise<void> => {
  const { content, title } = req.body as { content: string; title?: string };

  if (!content) {
    res.status(400).json({ code: 400, message: "缺少 content 参数" });
    return;
  }

  const text = title ? `标题：${title}\n内容：${content}` : content;

  const prompt = `你是深耕A股市场的资深宏观+行业策略分析师，拥有多年二级市场投研经验，擅长解读政策、行业快讯、产业新闻、数据公告、市场消息。
请基于我提供的【财联社电报/实时快讯原文】，进行客观、中立、全面、简洁易懂的专业解读，严格围绕以下维度结构化输出，逻辑清晰、重点突出、不废话、不主观吹踩、不夸大预期：

一、核心信息提炼
1. 事件本质、发布主体、关键时间、核心数据/政策条款/事件要点；
2. 区分短期临时消息&中长期产业趋势消息，明确消息属性（利好/利空/中性/边际变化）。

二、细分影响分析
1. 整体A股大盘：情绪面、资金面、风险偏好、市场整体走势潜在影响；
2. 直接关联板块/概念/细分赛道：明确受益方向、承压方向、无影响领域；
3. 上下游产业链、关联细分行业、龙头标的逻辑传导关系；
4. 影响时效：短期脉冲影响 / 中期趋势催化 / 长期行业格局改变。

三、相关个股梳理（必须写：**标准全称+股票代码**）
1. 核心受益标的：按“公司全称（代码）”列出，说明受益逻辑；z
2. 潜在承压标的：按“公司全称（代码）”列出，说明承压原因；
3. 行业龙头/人气标的：补充1-3只，格式同上；
4. 代码规范：
   - 沪市主板：600/601/603/605开头（如贵州茅台（600519））
   - 科创板：688开头（如中芯国际（688981））
   - 深市主板：000/001/002开头（如比亚迪（002594））
   - 创业板：300/301开头（如宁德时代（300750））

四、投资者实操关注点
1. 重点跟踪的板块、题材、关键数据、后续政策落地预期；
2. 潜在风险点：政策变数、落地不及预期、利好兑现、资金出逃、行业利空隐忧；
3. 不同投资风格建议：短线博弈机会、中线配置逻辑、长线价值参考；
4. 操作提醒：回避方向、仓位把控、不要盲目追涨杀跌等理性投资提示。

五、补充总结
用1-2句话高度概括本次消息的整体定性与后市核心博弈逻辑。

解读要求：
1. 语言专业通俗，拒绝空话套话、杜绝过度臆测，一切基于原文内容；
2. 结构清晰分点作答，排版整洁，方便快速阅读；
3. 客观中立，理性区分确定性利好/利空与边际预期差；
4. 若原文信息有限，如实说明信息不足，不强行延伸编造观点；
5. 个股部分**必须标注标准全称+正确6位代码**，不得简写、不得错码。

待解读电报内容：${text}`;

  // SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // 禁用 nginx/proxy 缓冲
  res.flushHeaders();

  try {
    const response = await axios.post(
      ARK_URL,
      {
        model: env.ARK_MODEL,
        stream: true,
        plugins: [{ id: "browsing", version: "1.0" }],
        messages: [
          {
            role: "system",
            content:
              "你是专业的 A 股市场分析师，擅长解读财经新闻对市场的影响。",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${env.ARK_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout: 60000,
      },
    );

    // 逐 chunk 转发，每次写入后立即 flush，确保前端实时收到
    response.data.on("data", (chunk: Buffer) => {
      res.write(chunk);
      // 强制刷新缓冲区，让浏览器立即收到数据
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    });

    response.data.on("end", () => res.end());
    response.data.on("error", (err: Error) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (err: any) {
    const msg =
      err?.response?.data?.error?.message ?? err.message ?? "请求失败";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }

  // 客户端断开时不报错
  req.on("close", () => res.end());
};
