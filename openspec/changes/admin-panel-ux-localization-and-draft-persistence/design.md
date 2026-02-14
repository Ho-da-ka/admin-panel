## Context

本次调整以“联调可用性”为核心，不引入新的前端框架或状态管理库，优先在现有 Vue3 + Element Plus 结构内迭代。

## Decisions

### Decision 1: 使用 localStorage 作为草稿存储
- **Rationale**: 实现成本低，覆盖刷新/路由切换后恢复场景。
- **Alternative**: 采用后端暂存接口，复杂度更高且超出本次范围。

### Decision 2: 将“取消”定义为显式放弃编辑
- **Rationale**: 用户明确点击取消时，期望退出并放弃本次输入。
- **Alternative**: 取消后仍保留草稿，会与用户预期冲突。

### Decision 3: 查询交互采用“自动 + 手动”并存
- **Rationale**: 高频筛选操作直接响应，同时保留查询按钮用于明确触发。
- **Alternative**: 全部改为自动查询可能导致复杂筛选时请求频繁。

## Risks / Trade-offs

- [Risk] 自动查询可能增加请求次数。  
  **Mitigation**: 当前筛选字段较少，后续如有需要可加防抖。
- [Risk] 草稿持久化可能带来旧数据残留。  
  **Mitigation**: 提供取消清空与提交后清空。

## Migration Plan

1. 完成本地化与文案统一。  
2. 引入草稿工具与各页面 watch 持久化。  
3. 补充取消行为和前端输入校验。  
4. 调整体测/考勤查询触发策略并验证构建通过。