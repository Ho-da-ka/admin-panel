## MODIFIED Requirements

### Requirement: Admin panel language consistency
管理后台 MUST 统一提供中文界面文案和中文日期组件体验。

#### Scenario: Chinese locale bootstrap
- **WHEN** 用户进入管理后台
- **THEN** 系统 SHALL 使用中文 Element Plus 组件文案与中文日期显示

#### Scenario: No mixed critical labels
- **WHEN** 用户浏览登录、导航和核心业务页面
- **THEN** 系统 SHALL 不出现关键业务词的中英文混杂显示