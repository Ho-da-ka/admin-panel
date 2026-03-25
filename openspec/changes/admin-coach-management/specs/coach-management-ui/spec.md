## ADDED Requirements

### Requirement: Coach management page
管理后台 MUST 提供教练管理页面，支持列表、筛选、详情、新增、编辑和删除操作。

#### Scenario: Create coach from admin panel
- **WHEN** 管理员在教练页面填写合法信息并保存
- **THEN** 系统 SHALL 调用后端教练创建接口并刷新列表

#### Scenario: Delete coach from admin panel
- **WHEN** 管理员确认删除一个教练
- **THEN** 系统 SHALL 调用删除接口，并在删除成功后刷新列表

### Requirement: Course form coach selection
课程管理页面 MUST 能消费教练管理数据，减少自由输入错误。

#### Scenario: Select coach in course form
- **WHEN** 管理员打开课程创建或编辑弹窗
- **THEN** 系统 SHALL 提供教练姓名下拉选项，并允许选择后写入 `coachName`

#### Scenario: Preserve manual compatibility
- **WHEN** 课程存在历史自由录入教练姓名，或教练档案尚未建立
- **THEN** 系统 SHALL 仍允许手动输入并完成保存