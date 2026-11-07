import type { Element } from "@/lib/saju/constants";
import { EL_LABEL } from "@/lib/elementColor";

/** 오행 그림. 쇠는 금빛 동전이 아니라 회색빛 동전으로 보여줘요. */
export function ElIcon({ e }: { e: Element }) {
  return (
    <span aria-hidden="true" className={e === "metal" ? "grayscale brightness-110" : undefined}>
      {EL_LABEL[e].icon}
    </span>
  );
}

/** 그림 + 이름 (예: 🪙 쇠) */
export function ElIconName({ e }: { e: Element }) {
  return (
    <>
      <ElIcon e={e} /> {EL_LABEL[e].name}
    </>
  );
}
