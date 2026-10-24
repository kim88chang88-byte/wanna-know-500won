/** 약관/방침 페이지에서 함께 쓰는 서비스 정보입니다. 운영자 정보가 정해지면 여기만 고치면 돼요. */
export const SERVICE_NAME = "도리 운세 사주";
export const CONTACT_EMAILS = ["kim88chang88@gmail.com"] as const;
export const LEGAL_EFFECTIVE_DATE = "2026년 10월 25일";
/** 방침 개정 이력 (최신이 위). 내용이 바뀔 때마다 한 줄 추가하고 시행일을 함께 고쳐요. */
export const LEGAL_REVISIONS = [
  { date: "2026년 10월 25일", note: "문의 이메일을 하나(kim88chang88@gmail.com)로 정리하고, 운영자 표기를 단순하게 바꿨어요." },
  { date: "2026년 10월 19일", note: "카카오 계정에서 서비스 연결을 끊으면 저장된 회원 정보가 자동으로 삭제된다는 안내를 추가했어요." },
  { date: "2026년 10월 18일", note: "생년월일시 기억하기(선택), 고민 통계(선택), 사용후기 수집 항목과 보관 기간을 추가하고, 동의 기록(시각·동의서 버전) 저장을 안내했어요." },
  { date: "2026년 10월 16일", note: "최초 시행" },
] as const;
/** 동의 문구가 바뀌면 올려요. profiles / concern_logs 에 동의 당시 버전이 함께 남아요. */
export const CONSENT_VERSION = "2026-10-18";
