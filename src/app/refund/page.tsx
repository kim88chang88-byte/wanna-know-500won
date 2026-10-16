import type { Metadata } from "next";
import { ContactList, H2, LegalPage } from "@/components/legal/Legal";
import { SERVICE_NAME } from "@/lib/siteInfo";

export const metadata: Metadata = {
  title: `환불 안내 | ${SERVICE_NAME}`,
  description: `${SERVICE_NAME} 환불 안내`,
};

/* 이 문서는 초안이며 법률 검토를 받은 것이 아닙니다. 결제 기능을 열기 전에 검토해 주세요. */

export default function RefundPage() {
  return (
    <LegalPage title="환불 안내">
      <p className="mt-4">
        현재는 베타 테스트 기간이라 결제가 발생하지 않습니다. 아래는 유료 결제가 시작된 뒤 적용되는 기준이에요.
      </p>

      <H2>1. 환불해 드리는 경우</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>결제했지만 결과(캡슐 또는 리포트)가 제공되지 않았거나, 시스템 오류로 정상적으로 열람할 수 없는 경우</li>
        <li>같은 건이 중복으로 결제된 경우</li>
        <li>제공된 내용이 안내한 상품 내용(예: 10쪽 리포트)과 현저히 다른 경우</li>
        <li>결제 후 결과를 열어보기 전에 취소를 요청한 경우</li>
      </ul>

      <H2>2. 환불이 어려운 경우</H2>
      <p>
        결과를 열람하기 시작하면 디지털 콘텐츠의 제공이 시작된 것이라, 단순 변심으로 인한 환불은 어려울 수 있어요(전자상거래법상
        디지털 콘텐츠 청약철회 제한). 이 내용은 결제 전에 결제 화면에서 다시 안내합니다. 풀이 내용이 기대와 다르다는 이유만으로는
        환불되지 않지만, 위 1번에 해당하면 열람 후에도 환불합니다.
      </p>

      <H2>3. 환불 요청 방법</H2>
      <p>아래 이메일로 결제 일시, 결제 수단, 결제 금액과 사유를 보내주세요.</p>
      <ContactList />

      <H2>4. 처리 기간</H2>
      <ul className="list-disc pl-5 space-y-1">
        <li>접수 후 영업일 기준 3일 이내에 환불 가능 여부를 안내합니다.</li>
        <li>환불이 결정되면 결제했던 수단으로 환불하며, 카드사·결제대행사 사정에 따라 실제 반영까지 며칠 더 걸릴 수 있어요.</li>
      </ul>

      <H2>5. 무료 뽑기</H2>
      <p>무료로 제공되는 뽑기는 환불 대상이 아닙니다.</p>
    </LegalPage>
  );
}
