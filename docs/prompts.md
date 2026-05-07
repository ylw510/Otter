# Prompt 说明

[English](prompts.en.md)

Prompt 采用版本化文本文件，放在 `server/prompts/`（如 `rewrite_v1.txt`、`explain_v1.txt`），不在 Python 源码中硬编码长文本。

## Prompt 角色

- `rewrite_v1`：将中文/不自然英文改写成地道英文，输出多风格 JSON
- `explain_v1`：面向中文技术用户的词汇解释

## 输入输出约定

- Rewrite：输入文本 + 风格列表，输出按风格键组织的 JSON
- Explain：输入词条 + 可选上下文句子，输出简洁纯文本解释

## 版本管理

- 使用 `PROMPT_VERSION_REWRITE` 与 `PROMPT_VERSION_EXPLAIN`
- 通过 `PromptLoader` 渲染
- 输出结构变化时应提升 prompt 版本
