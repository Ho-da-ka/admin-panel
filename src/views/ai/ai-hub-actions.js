export function describeFollowUpAction(alert) {
  const title = `跟进：${alert?.title || 'AI 提醒'}`
  const route = alert?.routeName
    ? { name: alert.routeName, query: alert.routeQuery || {} }
    : { name: 'dashboard' }

  return {
    title,
    message: [
      alert?.title || 'AI 提醒',
      alert?.desc || '',
      '',
      `建议动作：${alert?.suggestedAction || '请进入相关业务页面核对并处理。'}`
    ].filter((line) => line !== '').join('\n'),
    route,
    confirmText: '去处理'
  }
}
