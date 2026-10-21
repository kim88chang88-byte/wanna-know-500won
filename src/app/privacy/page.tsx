import type { Metadata } from "next";
import { ContactList, H2, LegalPage } from "@/components/legal/Legal";
import { LEGAL_REVISIONS, OPERATOR } from "@/lib/siteInfo";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 도리 운세 사주",
  description: "도리 운세 사주가 어떤 개인정보를 왜 받고, 얼마나 보관하는지 안내합니다.",
};

/* 이 문서는 현재 기능 기준의 초안이며 법률 검토를 받은 것이 아닙니다. 로그인·결제·AI 풀이·후기 기능이 붙을 때 해당 항목을 함께 고쳐야 합니다. */

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침">

      <p className="mt-4">
        &lsquo;도리 운세 사주&rsquo;(이하 &ldquo;서비스&rdquo;)는 생년월일시로 사주를 계산하고 풀이를 보여주기 위해 꼭
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
              <td className="p-2 border border-brand-100">선택 (궁합 리포트를 볼 때)</td>
              <td className="p-2 border border-brand-100">상대방의 생년월일(양력/음력)·태어난 시간(알면)·성별 (이름·연락처는 받지 않아요)</td>
              <td className="p-2 border border-brand-100">두 사람의 궁합 계산에만 쓰고, 계산이 끝나면 서버에 저장하지 않아요. 상대방 정보는 사용자가 상대방에게 알려도 괜찮다고 판단한 범위에서만 입력해 주세요</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 (카카오·구글·네이버 로그인 시)</td>
              <td className="p-2 border border-brand-100">카카오 회원번호·닉네임, 구글 계정 고유번호·이름 또는 네이버 회원 고유 ID·별명</td>
              <td className="p-2 border border-brand-100">로그인 상태 유지, 인사 표시, 회원 식별 (이메일·프로필 사진·연락처는 받지 않아요)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">자동 생성 (로그인 회원)</td>
              <td className="p-2 border border-brand-100">뽑기 기록(날짜와 주제), 마지막 로그인 시각</td>
              <td className="p-2 border border-brand-100">&ldquo;매일 첫 1회 무료&rdquo; 횟수 계산, 이번 달 뽑기 횟수 표시</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 동의 (로그인 회원)</td>
              <td className="p-2 border border-brand-100">생년월일(양력/음력)·태어난 시간(알면)·성별</td>
              <td className="p-2 border border-brand-100">다음부터 같은 정보를 다시 입력하지 않도록 기억 (&lsquo;기억하기&rsquo;에 동의한 경우에만)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 동의 (로그인 여부 무관)</td>
              <td className="p-2 border border-brand-100">고른 고민 버튼, 직접 적은 고민 글(200자 이내), 나이대, 성별, 날짜, 뽑기 주제</td>
              <td className="p-2 border border-brand-100">서비스 개선을 위한 고민 통계 (&lsquo;통계에 써도 좋아요&rsquo;에 동의한 경우에만. 생년월일은 남기지 않아요)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 (후기를 남길 때)</td>
              <td className="p-2 border border-brand-100">별점, 아쉬운 점(고른 항목), 한 줄 후기(200자 이내), 뽑은 자판기 종류, 작성 시각 (로그인한 경우에만 회원과 연결)</td>
              <td className="p-2 border border-brand-100">서비스 품질 개선. 로그인하지 않고 남긴 후기는 누구의 것인지 알 수 없어요</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">자동 저장(내 기기)</td>
              <td className="p-2 border border-brand-100">오늘/이번 달 뽑기 횟수 (로그인하지 않았을 때)</td>
              <td className="p-2 border border-brand-100">&ldquo;매일 첫 1회 무료&rdquo; 안내 표시</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2">
        이름, 연락처, 주소 같은 식별 정보는 사주 계산에 필요하지 않아 받지 않습니다. 로그인은 카카오 간편 로그인만 쓰며 위 표의 항목만
        받습니다. 결제 기능은 아직 없으며, 추가될 때 받는 정보(예: 결제 내역)와 목적을 이 방침에 먼저 반영합니다.
      </p>

      <H2>2. 보관 기간과 파기</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          입력하신 생년월일시·성별과 '요즘 고민'(선택)은 풀이 결과를 만들기 위해 요청 처리 중에만 사용하며, 서비스 서버에 따로 저장하지
          않습니다. 다만 아래 두 가지는 <b>별도의 선택 동의를 한 경우에만</b> 저장합니다.
        </li>
        <li>
          (1) 생년월일시 기억하기: 로그인한 회원이 동의하면 생년월일(양력/음력)·태어난 시간·성별을 회원당 1건 저장하고, 다음 이용 때 질문지를
          미리 채워 드립니다. 로그인 창의 &lsquo;기억한 정보 지우기&rsquo;로 언제든 지울 수 있고, <b>회원 탈퇴 시 함께 삭제</b>됩니다.
        </li>
        <li>
          (2) 고민 통계: 동의하면 고른 고민 버튼·직접 적은 고민 글·나이대·성별·날짜·주제를 저장해 서비스 개선 통계로 씁니다. 생년월일은 저장하지
          않습니다. 로그인 상태에서 동의한 기록은 회원과 연결되어 <b>탈퇴 시 함께 삭제</b>되고, 로그인하지 않고 동의한 기록은 누구의 것인지 알 수
          없는 형태로 저장되어 삭제 요청을 받더라도 찾아서 지울 수 없습니다. 고민 글에는 이름·연락처 등 개인정보를 적지 말아 주세요. 보관 기간은
          수집일로부터 24개월이며, 기간이 지나거나 통계 목적이 끝나면 지체 없이 파기합니다.
        </li>
        <li>
          카카오·구글·네이버 로그인 회원의 회원번호(고유번호)·닉네임(이름)·뽑기 기록(날짜와 주제)·마지막 로그인 시각은 서비스 데이터베이스에 저장하며,
          <b>회원 탈퇴 시 지체 없이 모두 삭제</b>합니다. 로그인 화면의 &lsquo;회원 탈퇴&rsquo;에서 직접 탈퇴할 수 있어요. 카카오 계정 설정에서 이 서비스와의 연결을 끊거나 카카오 계정을 삭제한 경우에도 카카오의 알림을 받아 해당 회원 정보를 지체 없이 삭제합니다. 뽑기
          기록에는 생년월일시·성별·풀이 내용이 들어가지 않습니다.
        </li>
        <li>
          사용후기는 이용자가 직접 남길 때만 저장하며, 작성일로부터 24개월 보관한 뒤(또는 목적이 끝나면 그 전에) 지체 없이 파기합니다. 로그인한 상태로 남긴 후기는
          <b>회원 탈퇴 시 함께 삭제</b>되고, 로그인하지 않고 남긴 후기는 누구의 것인지 알 수 없어 삭제 요청을 받더라도 찾아서 지울 수 없습니다.
          후기 글에는 이름·연락처 등 개인정보를 적지 말아 주세요. 후기를 사이트에 공개하게 되면 따로 안내하고 동의를 받습니다.
        </li>
        <li>
          로그인 상태는 쿠키(최대 30일, 서명되어 위조할 수 없는 값)로 유지되며, 로그아웃하거나 브라우저에서 쿠키를 지우면
          사라집니다. 카카오·구글·네이버에서 받은 접근 토큰은 저장하지 않습니다. 구글 로그인에서는 이메일과 프로필 사진을 요청하지 않습니다.
        </li>
        <li>
          로그인하지 않았을 때의 뽑기 횟수는 내 브라우저(localStorage)에만 저장되고 서버로 보내지 않아요. 브라우저의 사이트
          데이터를 지우면 사라집니다.
        </li>
        <li>
          연속 방문 기록(결과를 받은 날짜)과 고민 후속 안부(고른 고민 항목의 이름과 날짜, 직접 쓴 글은 제외)도 내
          브라우저(localStorage)에만 저장되고 서버로 보내지 않아요. 안부 카드의 &lsquo;기록 지우기&rsquo;나 브라우저 사이트
          데이터 삭제로 언제든 지울 수 있어요.
        </li>
        <li>
          앞으로 다른 기능으로 정보를 저장하게 되면, 저장 항목과 기간을 이 방침에 먼저 알리고 동의를 받습니다.
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
        <li>전달 항목: 사주 계산 결과와 성별, 이용자가 선택해서 적은 '요즘 고민' 내용 (이름·연락처는 전달하지 않아요. 고민 칸에 개인정보를 적지 말아 주세요)</li>
        <li>이용 목적: 풀이 문장 생성</li>
        <li>전달 시점과 방법: 풀이를 요청할 때, 암호화된 통신(HTTPS)으로 전달</li>
      </ul>
      <p className="mt-2">회원 정보와 뽑기 기록을 저장하는 데이터베이스는 아래 업체의 서비스를 이용합니다.</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>맡기는 곳: Supabase, Inc. (미국 법인) — 데이터베이스 호스팅, 데이터는 대한민국(서울) 리전에 저장</li>
        <li>맡기는 항목: 카카오 회원번호·닉네임, 구글 고유번호·이름 또는 네이버 고유 ID·별명, 뽑기 기록(날짜·주제), 마지막 로그인 시각, (동의한 경우) 기억해 둔 생년월일시·고민 통계, (남긴 경우) 사용후기</li>
        <li>이용 목적: 회원 식별, 무료 횟수 계산, (동의한 경우) 생년월일시 기억과 고민 통계를 위한 저장</li>
        <li>보관 기간: 회원 탈퇴 시까지 (탈퇴하면 삭제)</li>
      </ul>
      <p className="mt-2">
        카카오 로그인을 이용하면 로그인 인증은 ㈜카카오가, 구글 로그인을 이용하면 Google LLC(미국 법인)가, 네이버 로그인을 이용하면 네이버㈜가 처리하며, 이 서비스는
        인증이 끝난 뒤 위 표의 항목만 받아요. 같은 사람이 카카오·구글·네이버로 각각 로그인하면 서로 다른 회원으로 취급돼요.
      </p>
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
        서비스는 광고용 쿠키를 쓰지 않습니다. 뽑기 횟수·연속 방문 기록·고민 후속 안부를 기억하기 위해 브라우저 저장소(localStorage)를 사용하며,
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
      <p className="mt-2">
        선택 동의(생년월일시 기억하기, 고민 통계)를 하시면 동의한 시각과 당시 동의 문구의 버전을 함께 기록합니다. 동의가 있었음을 확인하고 문구가 바뀐 뒤에도
        과거 동의를 구분하기 위한 용도로만 쓰며, 해당 정보와 함께 삭제됩니다.
      </p>
      <p className="mt-3 font-bold text-gray-800">개정 이력</p>
      <ul className="list-disc pl-5 space-y-1" data-testid="legal-revisions">
        {LEGAL_REVISIONS.map((r) => (
          <li key={r.date}>
            {r.date}: {r.note}
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
