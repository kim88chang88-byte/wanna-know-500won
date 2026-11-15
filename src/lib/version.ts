export interface DeployInfo {
  /** 커밋 번호 앞 7자리. 배포 환경이 아니면 "local" */
  sha: string;
  /** 커밋 설명의 첫 줄 */
  message: string;
  /** 배포 환경 이름 (production / preview / development) */
  env: string;
  /** 이 배포를 빌드한 시각 (ISO). 모르면 null */
  builtAt: string | null;
}

/** 지금 돌아가는 배포가 어느 커밋인지. 관리자 점검 화면에 보여 줘서 "내가 고친 게 반영됐는지" 확인하게 해요. */
export function deployInfo(env: Record<string, string | undefined>, builtAt: string | null = null): DeployInfo {
  const sha = (env.VERCEL_GIT_COMMIT_SHA ?? "").trim().slice(0, 7);
  const message = (env.VERCEL_GIT_COMMIT_MESSAGE ?? "").split("\n")[0].trim().slice(0, 120);
  return { sha: sha || "local", message, env: (env.VERCEL_ENV ?? env.NODE_ENV ?? "development").trim(), builtAt };
}
