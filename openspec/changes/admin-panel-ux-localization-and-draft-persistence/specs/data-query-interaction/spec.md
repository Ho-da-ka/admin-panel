## MODIFIED Requirements

### Requirement: Efficient filter-to-query interaction
系统 MUST 支持筛选条件变更后的快速查询反馈。

#### Scenario: Fitness records auto query by student
- **WHEN** 用户在体测管理中切换学员筛选
- **THEN** 系统 SHALL 自动触发体测记录查询，无需再次点击查询按钮

#### Scenario: Attendance filters trigger query
- **WHEN** 用户在考勤管理中变更学员、课程或日期筛选
- **THEN** 系统 SHALL 自动刷新查询结果