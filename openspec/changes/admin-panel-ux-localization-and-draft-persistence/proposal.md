## Why

本轮联调中，管理后台出现了多处体验与一致性问题：
- 页面存在中英文混杂，日期控件未本地化。
- 表单编辑过程中切页或误关闭会丢失输入。
- 体测管理筛选交互效率偏低。
- 表单必填提示和前端校验不完整。

需要将这些对话中已实施的调整以 OpenSpec 方式沉淀，便于后续迭代复用。

## What Changes

- 全站管理后台文案统一为中文，并设置 Element Plus / Day.js 为中文本地化。
- 引入表单草稿机制（localStorage），支持查询条件与编辑表单自动保存。
- 明确“取消”操作语义：点击取消时清除该表单草稿并重置内容；其他场景继续保留草稿。
- 优化查询交互：体测管理中选择学员即自动查询，考勤筛选项变更时自动查询。
- 完善前端输入约束：学员监护人手机号格式、出生日期未来时间校验、必填项红色 `*` 提示。

## Capabilities

### Added Capabilities

- `form-draft-management`: 支持草稿持久化、清理与恢复。

### Modified Capabilities

- `ui-localization`: 统一中文文案与中文日期/组件语言环境。
- `data-query-interaction`: 查询动作由“手动触发为主”优化为“筛选变更即时触发 + 手动触发并存”。

## Impact

- 影响目录：`src/main.js`、`src/layouts`、`src/views/**`、`src/utils/draft.js`、`src/utils/validators.js`
- 用户收益：减少重复录入、降低误操作损失、提升查询效率与中文可读性。