## ADDED Requirements
### Requirement: Training Record Admin Page
系统 SHALL 在管理后台提供训练记录管理页面，支持训练数据录入、编辑与筛选查询。

#### Scenario: Filter training records
- **WHEN** 管理员或教练选择学员、课程或日期范围
- **THEN** 系统展示符合条件的训练记录列表

#### Scenario: Create training record
- **WHEN** 用户填写完整表单并提交
- **THEN** 系统创建训练记录并刷新列表

#### Scenario: Edit training record
- **WHEN** 用户编辑已有训练记录并提交
- **THEN** 系统保存变更并刷新列表
