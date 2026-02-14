## ADDED Requirements

### Requirement: Form draft persistence
系统 MUST 支持在表单编辑过程中自动保存草稿，并在重新打开后恢复。

#### Scenario: Preserve draft on non-cancel close
- **WHEN** 用户在编辑弹窗中输入后，发生非“取消”关闭或页面切换
- **THEN** 系统 SHALL 保留草稿并在下次打开时恢复

#### Scenario: Discard draft on explicit cancel
- **WHEN** 用户点击“取消”
- **THEN** 系统 SHALL 清空当前表单草稿并重置表单内容

### Requirement: Required field visual cue
系统 MUST 对必填字段提供醒目的红色 `*` 标识。

#### Scenario: Required indicator rendering
- **WHEN** 用户查看表单
- **THEN** 必填项标签 SHALL 呈现红色 `*`