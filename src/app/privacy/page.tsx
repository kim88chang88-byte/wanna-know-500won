import type { Metadata } from "next";
import { ContactList, H2, LegalPage } from "@/components/legal/Legal";
import { OPERATOR } from "@/lib/siteInfo";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 꽃거지의 신묘한 사주",
  description: "꽃거지의 신묘한 사주가 어떤 개인정보를 왜 받고, 얼마나 보관하는지 안내합니다.",
};

/* 이 문서는 현재 기능 기준의 초안이며 법률 검토를 받은 것이 아닙니다. 로그인·결제·AI 풀이·후기 기능이 붙을 때 해당 항목을 함께 고쳐야 합니다. */

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침">

      <p className="mt-4">
        &lsquo;꽃거지의 신묘한 사주&rsquo;(이하 &ldquo;서비스&rdquo;)는 생년월일시로 사주를 계산하고 풀이를 보여주기 위해 꼭
        필요한 정보만 받습니다. 아래에서 무엇을, 왜, 얼마나 오래 쓰는지 안내해요.
      </p>

      <H2>1. 받는 정보와 사용 목적</H2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-brand-100">
          <thead className="bg-brand-50 text-left">
            <tr>
              <th className="p-2 border border-brand-100">구분</th>
              <th className="p-2 border border-brand-100">항목</th>
              <th className="p-2 border border-brand-100">목적</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-brand-100">필수</td>
              <td className="p-2 border border-brand-100">
                생년월일(양력/음력, 윤달 여부), 성별
              </td>
              <td className="p-2 border border-brand-100">사주(만세력) 계산과 풀이 제공</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택</td>
              <td className="p-2 border border-brand-100">태어난 시간</td>
              <td className="p-2 border border-brand-100">시주 계산 (입력하지 않으면 시주는 표시되지 않아요)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">자동 저장(내 기기)</td>
              <td className="p-2 border border-brand-100">오늘/이번 달 뽑기 횟수</td>
              <td className="p-2 border border-brand-100">&ldquo;매일 첫 1회 무료&rdquo; 안내 표시</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2">
        이름, 연락처, 주소 같은 식별 정보는 사주 계산에 필요하지 않아 받지 않습니다. 현재 서비스는 로그인과 결제 기능이
        없으며, 이 기능이 추가될 때 받는 정보(예: 로그인 계정 식별값, 결제 내역)와 목적을 이 방침에 먼저 반영합니다.
      </p>

      <H2>2. 보관 기간과 파기</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          입력하신 생년월일시와 성별은 풀이 결과를 만들기 위해 요청 처리 중에만 사용하며, 서비스 서버에 따로 저장하지
          않습니다. (현재 기준)
        </li>
        <li>
          뽑기 횟수는 내 브라우저(localStorage)에만 저장되고 서버로 보내지 않아요. 브라우저의 사이트 데이터를 지우면
          사라집니다.
        </li>
        <li>
          나중에 결과 보관함 같은 기능으로 정보를 저장하게 되면, 저장 항목과 기간을 이 방침에 먼저 알리고 동의를 받습니다.
          보관 목적이 끝나면 지체 없이 파기합니다.
        </li>
      </ul>

      <H2>3. 처리 위탁과 국외 이전</H2>
      <p>
        AI 풀이 문장을 만들 때 계산된 사주 정보(생년월일시에서 나온 간지 등)를 AI 서비스에 전달합니다. 이 기능은 아직
        준비 중이며, 제공을 시작하면 아래 내용으로 운영합니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>받는 곳: Anthropic, PBC (미국) — Claude API</li>
        <li>전달 항목: 사주 계산 결과와 성별 (이름·연락처는 전달하지 않아요)</li>
        <li>이용 목적: 풀이 문장 생성</li>
        <li>전달 시점과 방법: 풀이를 요청할 때, 암호화된 통신(HTTPS)으로 전달</li>
      </ul>
      <p className="mt-2">그 밖에 개인정보를 광고나 마케팅 목적으로 제3자에게 제공하지 않습니다.</p>

      <H2>4. 이용자의 권리</H2>
      <p>
        본인의 정보에 대해 열람, 정정, 삭제, 처리 정지를 요청할 수 있고, 동의는 언제든 철회할 수 있습니다. 아래 문의처로
        연락해 주세요. 만 14세 미만 아동의 정보는 수집하지 않는 것을 원칙으로 합니다.
      </p>

      <H2>5. 안전하게 지키기 위한 조치</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>모든 통신은 HTTPS로 암호화합니다.</li>
        <li>AI 서비스 접속 키는 서버에서만 사용하고 이용자 화면으로 내보내지 않습니다.</li>
        <li>필요한 최소한의 정보만 받고, 접근 권한은 운영에 필요한 사람으로 제한합니다.</li>
      </ul>

      <H2>6. 쿠키와 비슷한 기술</H2>
      <p>
        서비스는 광고용 쿠키를 쓰지 않습니다. 뽑기 횟수를 기억하기 위해 브라우저 저장소(localStorage)를 사용하며,
        브라우저 설정에서 차단하거나 삭제할 수 있어요. 차단해도 서비스는 이용할 수 있지만 횟수 표시는 유지되지 않습니다.
      </p>

      <H2>7. 개인정보 보호 문의</H2>
      <p>운영자: {OPERATOR}</p>
      <p className="mt-1">문의 이메일:</p>
      <ContactList />
      <p className="mt-2">
        개인정보 침해 신고나 상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118) 등에서도 받을 수 있어요.
      </p>

      <H2>8. 방침이 바뀔 때</H2>
      <p>내용이 바뀌면 시행일을 갱신하고 이 페이지에 먼저 알립니다. 이용자에게 중요한 변경은 서비스 화면에서 따로 안내해요.</p>
    </LegalPage>
  );
}
