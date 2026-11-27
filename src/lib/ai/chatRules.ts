/** 기준 문서(md)의 {{이름}} 자리를 실제 값으로 바꿔요. 값이 없는 자리가 있으면 바로 알 수 있게 던져요. */
export function renderChatRules(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_m, k: string) => {
    if (!(k in vars)) throw new Error(`기준 문서에 알 수 없는 자리표시자: {{${k}}}`);
    return vars[k];
  });
}
