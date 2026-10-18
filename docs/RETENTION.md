# 보관 기간과 정리(파기) 방법

개인정보처리방침에 적은 기준: **고민 통계와 사용후기는 24개월**, 회원 정보·저장된 생년월일시·뽑기 기록은 **탈퇴 시까지**(탈퇴하면 즉시 삭제).

기간이 지난 데이터는 **분기에 한 번쯤** Supabase 대시보드 > SQL Editor 에서 아래를 Run 하세요. (먼저 `select` 로 몇 줄인지 확인하고 지우는 걸 권장해요)

```sql
-- 몇 줄이 지워질지 먼저 확인
select
  (select count(*) from public.concern_logs where created_at < now() - interval '24 months') as old_concerns,
  (select count(*) from public.reviews      where created_at < now() - interval '24 months') as old_reviews;

-- 지우기
delete from public.concern_logs where created_at < now() - interval '24 months';
delete from public.reviews      where created_at < now() - interval '24 months';
```

- 지우기 전에 통계가 필요하면 `/admin` 에서 CSV 를 먼저 내려받아 두세요. (CSV 에는 개인 식별 정보가 없어요)
- 기간(24개월)을 바꾸려면 `src/app/privacy/page.tsx` 의 보관 기간 문구, `LEGAL_REVISIONS`, 이 문서를 함께 고치세요.
- 동의 기록(`consent_version`, `consented_at`)은 `profiles` / `concern_logs` 에 같이 저장되어 해당 행과 함께 삭제돼요.
