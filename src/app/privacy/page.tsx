import type { Metadata } from "next";
import { ContactList, H2, LegalPage } from "@/components/legal/Legal";
import { LEGAL_REVISIONS } from "@/lib/siteInfo";

export const metadata: Metadata = {
  title: "개인정보처리방침 · 도유사주",
  description: "도유사주가 어떤 개인정보를 왜 받고, 얼마나 보관하는지 안내합니다.",
};

/* 이 문서는 현재 기능 기준의 초안이며 법률 검토를 받은 것이 아닙니다. 로그인·결제·AI 풀이·후기 기능이 붙을 때 해당 항목을 함께 고쳐야 합니다. */

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침">

      <p className="mt-4">
        &lsquo;도유사주&rsquo;(이하 &ldquo;서비스&rdquo;)는 생년월일시로 사주를 계산하고 풀이를 보여주기 위해 꼭
        필요한 정보만 받습니다. 아래에서 무엇을, 왜, 얼마나 오래 쓰는지 안내합니다.
      </p>
      <p className="mt-2">
        서비스는 「개인정보 보호법」 등 관련 법령을 지키며, 이용자의 권리를 보호하기 위해 이 방침을 만들어 공개합니다. 이 방침은 서비스를 이용하는 과정에서 처리되는 모든
        개인정보에 적용됩니다. 처리 목적이 바뀌면 관계 법령에 따라 별도의 동의를 받는 등 필요한 조치를 합니다.
      </p>
      <p className="mt-2">
        서비스는 위치정보(GPS 등 현재 위치), 얼굴 사진이나 지문 같은 신체 정보, 휴대전화 번호를 받지 않습니다. 그래서 위치기반서비스는 제공하지 않습니다.
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
              <td className="p-2 border border-brand-100">상대방의 생년월일(양력/음력)·태어난 시간(알면)·성별 (연락처는 받지 않아요. 이름은 회원이 &lsquo;기억해 둘게요&rsquo;로 저장할 때 붙이는 이름(실명 가능)만 받아요)</td>
              <td className="p-2 border border-brand-100">두 사람의 궁합 계산에만 쓰고, 계산이 끝나면 서버에 저장하지 않습니다. 다만 로그인한 회원이 &lsquo;이 상대방을 기억해 둘게요&rsquo;(미리 체크돼 있고 끌 수 있어요)를 켜 둔 채로 풀이를 보면 이름·별명(또는 생년월일)과 함께 저장해요(아래 2항 참고). 상대방 정보는 사용자가 상대방에게 알려도 괜찮다고 판단한 범위에서만 입력해 주세요</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 (카카오·구글·네이버·이메일 로그인 시)</td>
              <td className="p-2 border border-brand-100">카카오 회원번호·닉네임, 구글 계정 고유번호·이름 또는 네이버 회원 고유 ID·별명, 이메일 로그인 회원의 이메일 암호화 값(이메일 주소 원문은 저장하지 않아요)과 직접 정한 닉네임(선택)</td>
              <td className="p-2 border border-brand-100">로그인 상태 유지, 인사 표시, 회원 식별 (소셜 로그인에서는 이메일·프로필 사진·연락처를 받지 않아요)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 (이메일로 로그인할 때)</td>
              <td className="p-2 border border-brand-100">이메일 주소, 메일로 보낸 6자리 인증번호</td>
              <td className="p-2 border border-brand-100">인증번호 메일 발송과 본인 확인. 인증이 끝나도 이메일 주소 원문은 저장하지 않고, 서버만 아는 비밀키로 만든 암호화 값만 회원 식별에 써요. 인증번호는 서버에 저장하지 않고 10분이 지나면 쓸 수 없어요.</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">자동 생성 (로그인 회원)</td>
              <td className="p-2 border border-brand-100">뽑기 기록(날짜와 주제), 마지막 로그인 시각</td>
              <td className="p-2 border border-brand-100">&ldquo;매일 첫 1회 무료&rdquo; 횟수 계산, 이번 달 뽑기 횟수 표시</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">자동 저장 (로그인 회원이 도리 상담실을 쓸 때)</td>
              <td className="p-2 border border-brand-100">상담실 대화방: 내가 보낸 질문과 도리의 답, 풀이 요약, 그 풀이의 생년월일시·성별(상대방 정보 포함)</td>
              <td className="p-2 border border-brand-100">다시 로그인하거나 다른 기기에서도 대화를 이어 가기 위해 서버에 한 부 저장 (마지막 대화 후 30일 보관, 아래 2항)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">선택 (문의할 때)</td>
              <td className="p-2 border border-brand-100">문의 내용과 답장을 받을 이메일 주소 (이름·연락처는 받지 않아요)</td>
              <td className="p-2 border border-brand-100">문의 확인과 답변, 분쟁 처리 (처리 후 3년 보관, 아래 2항)</td>
            </tr>
            <tr>
              <td className="p-2 border border-brand-100">자동 생성 (모든 이용자)</td>
              <td className="p-2 border border-brand-100">접속 IP 주소와 요청 횟수(로그인 회원은 회원번호 포함)</td>
              <td className="p-2 border border-brand-100">짧은 시간에 요청이 몰리는 부정 이용을 막는 속도 제한. 대부분 1분(길어도 1시간) 단위로 세고 기록은 최대 2시간 뒤 자동 정리 대상이 되며, 다른 용도로 쓰지 않습니다</td>
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
              <td className="p-2 border border-brand-100">서비스 품질 개선. (선택으로 공개에 동의한 후기는 메인 화면에 이름 없이 게시) 로그인하지 않고 남긴 후기는 누구의 것인지 알 수 없어요</td>
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
        연락처·주소 같은 식별 정보는 사주 계산에 필요하지 않아 받지 않습니다. 이름은 회원이 기억해 둔 사람에 붙이는 이름(실명이나 별명)만 받습니다. 로그인은 카카오 간편 로그인만 쓰며 위 표의 항목만
        받습니다. 결제 기능은 아직 없으며, 추가될 때 받는 정보(예: 결제 내역)와 목적을 이 방침에 먼저 반영합니다.
      </p>

      <H2>2. 보관 기간과 파기</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          입력하신 생년월일시·성별과 '요즘 고민'(선택)은 풀이 결과를 만들기 위해 요청 처리 중에만 사용하며, 서비스 서버에 따로 저장하지
          않습니다. 다만 로그인한 회원의 도리 상담실 대화방은 아래 &lsquo;도리 상담실&rsquo; 항목대로 서버에 저장하고, 아래 네 가지는 <b>별도의 선택 동의를 한 경우에만</b> 저장합니다.
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
          (3) 내 보관함: 로그인한 회원이 &lsquo;보관함에 저장&rsquo;을 선택하면, 화면에 보인 풀이 결과(사주 네 기둥·오행·대운 등 풀이 내용과 도리의 한마디)를
          회원 계정에 저장해 다시 볼 수 있게 합니다. 입력하신 생년월일 원문은 따로 저장하지 않지만, 풀이 결과에는 생년월일시로 계산한 사주 정보가
          담겨 있습니다. 다시 볼 때는 새로 계산하거나 AI를 부르지 않습니다. 보관함에서 항목을 언제든 지울 수 있고 <b>회원 탈퇴 시 함께 삭제</b>됩니다.
          보관 기간은 지우시거나 탈퇴하실 때까지입니다.
        </li>
        <li>
          (4) 기억해 둔 다른 사람: 로그인한 회원이 궁합 등을 볼 때 &lsquo;이 상대방을 기억해 둘게요&rsquo;(미리 체크돼 있고 끌 수 있어요)를 켜 둔 채로 풀이를 보면, 상대방의 생년월일(양력/음력)·태어난
          시간(알면)·성별을 회원이 붙인 이름(실명이나 별명, 20자 이내, 안 붙이면 생년월일)과 함께 회원당 최대 10명까지 저장하고, 다음 궁합이나 다른 운세를 볼 때 눌러서 고르도록 불러옵니다. 연락처는
          받지 않으며, 실명을 적을 때는 그 사람이 알려도 괜찮다고 한 정보만 입력해 주세요. 로그인 창에서 한 명씩 언제든 지울 수 있고, <b>회원 탈퇴 시 함께 삭제</b>됩니다.
        </li>
        <li>
          카카오·구글·네이버·이메일 로그인 회원의 회원번호(고유번호, 이메일 로그인은 이메일의 암호화 값)·닉네임(이름)·뽑기 기록(날짜와 주제)·마지막 로그인 시각은 서비스 데이터베이스에 저장하며,
          <b>회원 탈퇴 시 지체 없이 모두 삭제</b>합니다. 로그인 화면의 &lsquo;회원 탈퇴&rsquo;에서 직접 탈퇴할 수 있어요. 카카오 계정 설정에서 이 서비스와의 연결을 끊거나 카카오 계정을 삭제한 경우에도 카카오의 알림을 받아 해당 회원 정보를 지체 없이 삭제합니다. 뽑기
          기록에는 생년월일시·성별·풀이 내용이 들어가지 않습니다.
        </li>
        <li>
          사용후기는 이용자가 직접 남길 때만 저장하며, 작성일로부터 24개월 보관한 뒤(또는 목적이 끝나면 그 전에) 지체 없이 파기합니다. 로그인한 상태로 남긴 후기는
          <b>회원 탈퇴 시 함께 삭제</b>되고, 로그인하지 않고 남긴 후기는 누구의 것인지 알 수 없어 삭제 요청을 받더라도 찾아서 지울 수 없습니다.
          후기 글에는 이름·연락처 등 개인정보를 적지 말아 주세요. 후기를 메인 화면에 공개하는 것은 후기를 남길 때 &lsquo;공개해도 좋아요&rsquo;를 직접 선택한 경우에만 하며, 이름과 회원 정보 없이 별점·후기 글·뽑은 운세 종류만 보여 드립니다. 공개한 후기는 회원 탈퇴 시 함께 내려가고, 로그인하지 않고 남긴 후기는 누구의 것인지 알 수 없어 삭제 요청을 받더라도 찾아서 지울 수 없습니다.
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
          &lsquo;도리 상담실&rsquo;의 대화방(풀이별로 나눠진 대화)은 내 브라우저(localStorage)에 저장되고, 로그인한 회원은 다시 로그인하거나 다른 기기에서도 이어 볼 수 있도록
          서비스 서버(Supabase)에도 한 부 저장돼요. 저장되는 것은 방 이름, 내가 보낸 질문과 도리의 답, 대화를 이어 가기 위한 풀이 요약과 그 풀이의 생년월일시·성별(상대방
          정보 포함)이에요. 서버 사본은 방마다 마지막 대화 후 30일이 지나면 자동으로 지워지고, 방은 최대 10개까지 두며, 목록의 &lsquo;삭제&rsquo;로 방을 지우면 서버
          사본도 함께 지워져요. 회원 탈퇴를 하면 서버의 대화방이 모두 지워지고, 로그아웃하면 이 기기의 대화방은 지워지지만 서버 사본은 30일 동안 남아 있어서 다시
          로그인하면 불러와요. 공용 기기에서는 이용 후 로그아웃해 주세요.
        </li>
        <li>
          앞으로 다른 기능으로 정보를 저장하게 되면, 저장 항목과 기간을 이 방침에 먼저 알리고 동의를 받습니다.
          보관 목적이 끝나면 지체 없이 파기합니다.
        </li>
      </ul>

      <p className="mt-3 font-bold text-gray-800">관계 법령에 따라 보관하는 정보 (유료 결제가 시작된 뒤 적용)</p>
      <p className="mt-1">현재는 베타 기간으로 결제가 없어 아래 정보를 보관하지 않습니다. 결제가 시작되면 법령이 정한 기간 동안 다른 정보와 분리해 보관하고, 그 목적으로만 쓰며, 기간이 끝나면 지체 없이 파기합니다.</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs border border-brand-100">
          <thead className="bg-brand-50 text-left">
            <tr>
              <th className="p-2 border border-brand-100">보관 항목</th>
              <th className="p-2 border border-brand-100">근거</th>
              <th className="p-2 border border-brand-100">기간</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border border-brand-100">계약 또는 청약철회 기록</td><td className="p-2 border border-brand-100">전자상거래 등에서의 소비자보호에 관한 법률</td><td className="p-2 border border-brand-100">5년</td></tr>
            <tr><td className="p-2 border border-brand-100">대금 결제 및 재화·서비스 공급 기록</td><td className="p-2 border border-brand-100">전자상거래 등에서의 소비자보호에 관한 법률</td><td className="p-2 border border-brand-100">5년</td></tr>
            <tr><td className="p-2 border border-brand-100">소비자 불만 또는 분쟁 처리 기록(문의 내용 포함)</td><td className="p-2 border border-brand-100">전자상거래 등에서의 소비자보호에 관한 법률</td><td className="p-2 border border-brand-100">3년</td></tr>
            <tr><td className="p-2 border border-brand-100">표시·광고에 관한 기록</td><td className="p-2 border border-brand-100">전자상거래 등에서의 소비자보호에 관한 법률</td><td className="p-2 border border-brand-100">6개월</td></tr>
            <tr><td className="p-2 border border-brand-100">거래 관련 장부와 증거 서류</td><td className="p-2 border border-brand-100">국세기본법</td><td className="p-2 border border-brand-100">5년</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-bold text-gray-800">파기 절차와 방법</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>보관 기간이 지났거나 처리 목적이 끝나 더 필요 없어진 정보는 지체 없이 파기합니다. 회원 탈퇴를 요청받으면 법령에 따라 보관해야 하는 정보를 뺀 나머지를 지체 없이 파기합니다.</li>
        <li>전자 파일은 복구하거나 다시 볼 수 없는 방법으로 데이터베이스에서 삭제합니다. 법령에 따라 보관하는 정보는 그 목적 외에는 쓰지 않습니다.</li>
      </ul>

      <div id="overseas">
        <H2>3. 처리 위탁과 국외 이전</H2>
      </div>
      <p>
        AI 풀이 문장을 만들 때 아래 정보를 AI 서비스에 전달합니다. 풀이를 요청하거나 도리 상담실에서 질문을 보내면 이 방침에 따라 전달되며,
        정보는 한국 밖(미국)에서 처리됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>이전받는 자: Anthropic, PBC (Claude API 제공사)</li>
        <li>이전되는 국가: 미국</li>
        <li>전달 항목: 사주 계산 결과와 성별, 이용자가 선택해서 적은 '요즘 고민' 내용, 도리 상담실에서 보낸 질문과 최근 대화 내용 (연락처는 전달하지 않아요. 풀이 대상에 붙인 이름·별명은 호칭을 위해 함께 전달될 수 있으니, 고민 칸과 상담실 질문에는 불필요한 개인정보를 적지 말아 주세요)</li>
        <li>이전 일시와 방법: 풀이를 요청하거나 도리 상담실에서 질문을 보낼 때마다, 정보통신망을 통해 암호화된 통신(HTTPS)으로 전달</li>
        <li>이용 목적: 풀이·상담 문장 생성</li>
        <li>보유·이용 기간: 우리는 전달 자체를 위해 내용을 따로 쌓아 두지 않습니다(회원이 저장하는 보관함·대화방은 위 2항). 받는 쪽의 보관 기간은 Anthropic의 정책(약관·개인정보 안내)에 따르며, 이를 우리가 직접 정할 수는 없어요.</li>
        <li>거부 방법과 불이익: 국외 이전을 원하지 않으면 AI 풀이와 도리 상담실을 쓰지 않으시면 되고, 이미 이용했더라도 언제든 &lsquo;문의&rsquo;로 삭제·중단을 요청할 수 있어요. AI 풀이를 쓰지 않으면 그 기능은 이용할 수 없습니다.</li>
      </ul>
      <p className="mt-2">회원 정보와 뽑기 기록을 저장하는 데이터베이스는 아래 업체의 서비스를 이용합니다.</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>맡기는 곳: Supabase, Inc. (미국 법인) — 데이터베이스 호스팅, 데이터는 대한민국(서울) 리전에 저장</li>
        <li>맡기는 항목: 카카오 회원번호·닉네임, 구글 고유번호·이름 또는 네이버 고유 ID·별명, 뽑기 기록(날짜·주제), 마지막 로그인 시각, (동의한 경우) 기억해 둔 생년월일시·고민 통계, (남긴 경우) 사용후기</li>
        <li>이용 목적: 회원 식별, 무료 횟수 계산, (동의한 경우) 생년월일시 기억과 고민 통계를 위한 저장</li>
        <li>보관 기간: 회원 탈퇴 시까지 (탈퇴하면 삭제)</li>
      </ul>
      <p className="mt-2">이메일로 로그인할 때 인증번호 메일을 보내는 데에는 아래 업체의 서비스를 이용합니다.</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>맡기는 곳(이전받는 자): Resend, Inc. (미국 법인) — 이메일 발송 서비스</li>
        <li>이전되는 국가: 미국</li>
        <li>맡기는 항목: 이용자가 적은 이메일 주소, 인증번호가 담긴 메일 내용</li>
        <li>이전 일시와 방법: 이메일 로그인에서 &lsquo;인증번호 받기&rsquo;를 누를 때마다 정보통신망을 통해 암호화된 통신(HTTPS)으로 전달</li>
        <li>이용 목적: 인증번호 메일 발송</li>
        <li>보유·이용 기간: 우리는 이메일 주소를 저장하지 않습니다. 업체는 발송 기록을 자체 정책에 따른 기간 동안 보관할 수 있으며, 이 기간은 우리가 직접 정할 수 없어요.</li>
        <li>거부 방법과 불이익: 이메일 로그인을 쓰지 않고 카카오·구글·네이버로 로그인하면 전달되지 않아요. 이메일 로그인은 이용할 수 없게 됩니다.</li>
      </ul>
      <p className="mt-2">
        카카오 로그인을 이용하면 로그인 인증은 ㈜카카오가, 구글 로그인을 이용하면 Google LLC(미국 법인)가, 네이버 로그인을 이용하면 네이버㈜가 처리하며, 이 서비스는
        인증이 끝난 뒤 위 표의 항목만 받아요. 이메일 로그인은 이 서비스가 직접 인증번호로 확인해요. 같은 사람이 카카오·구글·네이버·이메일로 각각 로그인하면 서로 다른 회원으로 취급돼요.
      </p>
      <p className="mt-2">서비스 화면과 서버를 인터넷에 올려 운영하는 데에는 아래 업체의 서비스를 이용합니다. 이 과정에서 접속 기록(IP 주소 등)이 업체의 서버 기록에 남을 수 있으며, 업체의 정책에 따른 기간 동안만 보관됩니다.</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>맡기는 곳: Vercel Inc. (미국 법인) — 웹사이트 호스팅</li>
        <li>이용 목적: 서비스 화면 제공, 오류 분석, 보안 관리</li>
      </ul>
      <p className="mt-2">위탁할 때는 위탁하는 일의 목적과 범위, 안전하게 지키는 방법, 다시 맡기는 것의 제한, 관리·감독, 손해배상 책임을 계약 등으로 정하고 「개인정보 보호법」 제26조에 따라 관리·감독합니다.</p>
      <p className="mt-2">
        서비스는 이용자의 동의 없이 개인정보를 처리 목적을 넘어 쓰거나 제3자에게 제공하지 않으며, 광고나 마케팅 목적으로 제공하지 않습니다. 다만 「개인정보 보호법」 등 법령에서
        허용하는 경우에는 예외로 합니다.
      </p>

      <H2>4. 이용자의 권리</H2>
      <p>이용자는 서비스에 다음 권리를 행사할 수 있습니다.</p>
      <ul className="list-disc pl-5 space-y-1 mt-1">
        <li>개인정보의 열람 요구</li>
        <li>개인정보의 정정 또는 삭제 요구</li>
        <li>개인정보 처리정지 요구</li>
        <li>개인정보 처리에 대한 동의 철회</li>
        <li>회원 탈퇴 (로그인 화면의 &lsquo;회원 탈퇴&rsquo;에서 직접 할 수 있어요)</li>
      </ul>
      <p className="mt-2">
        권리는 아래 7항의 문의 이메일로 행사할 수 있고, 법정대리인이나 위임받은 대리인을 통해서도 할 수 있습니다(이 경우 위임장 등 필요한 서류를 요청할 수 있어요).
        열람·정정·삭제·처리정지 요구는 「개인정보 보호법」에 따라 제한될 수 있고, 다른 법령에서 보존하도록 정한 정보는 그 기간 동안 삭제하지 못할 수 있습니다.
        로그인하지 않고 남긴 후기·고민 통계처럼 누구의 것인지 알 수 없는 정보는 찾아서 지울 수 없습니다.
      </p>
      <p className="mt-2">
        서비스는 만 14세 미만 아동의 회원가입을 받지 않으며, 아동의 정보는 수집하지 않는 것을 원칙으로 합니다. 만 14세 미만임을 알게 된 경우에는 법정대리인의 동의를 확인할 수
        없으면 해당 정보를 지체 없이 삭제합니다. 법정대리인은 아동의 개인정보에 대해 동의 철회와 열람·정정·삭제·처리정지를 요구할 수 있으며, 방법은 위와 같습니다.
      </p>

      <H2>5. 안전하게 지키기 위한 조치</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>모든 통신은 HTTPS로 암호화합니다.</li>
        <li>AI 서비스 접속 키는 서버에서만 사용하고 이용자 화면으로 내보내지 않습니다.</li>
        <li>필요한 최소한의 정보만 받고, 접근 권한은 운영에 필요한 사람으로 제한합니다.</li>
        <li>회원 정보를 저장하는 데이터베이스는 서버에서만 접근하고(이용자 화면에서 직접 열 수 없도록 행 단위 접근 제한을 켜 둡니다), 접속 키는 서버 안에서만 씁니다.</li>
        <li>로그인 상태 쿠키는 서명해서 위조할 수 없게 하고, 다른 사이트에서 오는 쓰기 요청을 막으며, 짧은 시간에 요청이 몰리면 제한합니다.</li>
        <li>방문자 구분 값은 서버에서 한 번 더 암호화(해시)해 저장해 원래 값을 알 수 없게 합니다.</li>
        <li>개인정보를 다루는 사람을 최소한으로 두고, 정보가 새어 나간 사실을 알게 되면 법령에 따라 지체 없이 이용자에게 알리고 필요한 조치를 합니다.</li>
      </ul>

      <H2>6. 쿠키와 비슷한 기술</H2>
      <p>
        서비스는 광고용 쿠키를 쓰지 않습니다. 뽑기 횟수·연속 방문 기록·고민 후속 안부·상담실 대화방(서버 사본은 위 2항)을 기억하기 위해 브라우저 저장소(localStorage)를 사용하며,
        브라우저 설정에서 차단하거나 삭제할 수 있어요. 차단해도 서비스는 이용할 수 있지만 횟수 표시는 유지되지 않습니다. 또한 방문자 수(Today/Total)를 세기 위해 브라우저가 만든 무작위 ID를 서버에서 한 번 더 암호화(해시)해 저장하며, 이름·연락처·IP 주소는 저장하지 않습니다. 같은 암호화 ID 로 어디서 방문했는지(직접 접속·친구 초대·접속 경로의 사이트 도메인)와 주요 버튼을 눌렀는지(한마디 보기, 뽑기, 로그인 버튼 등)를 이용 통계로만 기록하며, 생년월일·이름·직접 쓴 글은 담지 않고 회원 정보와도 연결하지 않습니다. 행동 기록은 90일 뒤 삭제합니다.
      </p>
      <p className="mt-2">
        서비스는 광고식별자를 수집하지 않고, 이용자를 따라다니는 맞춤형 광고에 정보를 쓰지 않으며, 방문 통계를 민감한 정보와 합치거나 특정 개인을 알아보는 데 쓰지 않습니다.
        브라우저에서 저장소를 지우거나 막는 방법은 다음과 같습니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-1">
        <li>Chrome: 설정 → 개인정보 및 보안 → 인터넷 사용 기록 삭제(쿠키 및 기타 사이트 데이터)</li>
        <li>Edge: 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터 관리 및 삭제</li>
        <li>Safari: 설정 → 개인정보 보호 → 모든 쿠키 차단 또는 웹사이트 데이터 관리</li>
      </ul>

      <H2>7. 개인정보 보호 문의와 권리침해 구제</H2>
      <p className="mt-1">서비스는 개인정보 처리를 총괄하고 이용자의 불만을 처리하기 위해 아래와 같이 개인정보 보호책임자를 둡니다. 문의·동의 철회·열람·정정·삭제·처리정지·불만은 아래 이메일로 보내 주세요. 접수하면 지체 없이 확인하고 처리합니다.</p>
      <p className="mt-2">개인정보 보호책임자: 서비스 운영자 · 문의 이메일:</p>
      <ContactList />
      <p className="mt-3 font-bold text-gray-800">권리침해 구제 기관</p>
      <p className="mt-1">아래 기관은 서비스와 별개의 기관입니다. 서비스의 처리에 대한 불만은 위 보호책임자에게 먼저 문의해 주세요.</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs border border-brand-100">
          <thead className="bg-brand-50 text-left">
            <tr>
              <th className="p-2 border border-brand-100">기관</th>
              <th className="p-2 border border-brand-100">연락처</th>
              <th className="p-2 border border-brand-100">웹사이트</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border border-brand-100">개인정보분쟁조정위원회</td><td className="p-2 border border-brand-100">1833-6972</td><td className="p-2 border border-brand-100">www.kopico.go.kr</td></tr>
            <tr><td className="p-2 border border-brand-100">개인정보침해신고센터</td><td className="p-2 border border-brand-100">국번없이 118</td><td className="p-2 border border-brand-100">privacy.kisa.or.kr</td></tr>
            <tr><td className="p-2 border border-brand-100">대검찰청</td><td className="p-2 border border-brand-100">국번없이 1301</td><td className="p-2 border border-brand-100">www.spo.go.kr</td></tr>
            <tr><td className="p-2 border border-brand-100">경찰청</td><td className="p-2 border border-brand-100">국번없이 182</td><td className="p-2 border border-brand-100">ecrm.police.go.kr</td></tr>
          </tbody>
        </table>
      </div>

      <H2>8. 방침이 바뀔 때</H2>
      <p>내용이 바뀌면 시행일을 갱신하고 이 페이지에 먼저 알립니다. 이용자에게 중요한 변경은 서비스 화면에서 따로 안내합니다.</p>
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
