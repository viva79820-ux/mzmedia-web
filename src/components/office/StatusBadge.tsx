import { STATUS_LABEL } from "@/lib/office/labels";
import type { Status } from "@/lib/office/types";

export default function StatusBadge({ status, paused }: { status: Status; paused?: number }) {
  return (
    <span className="actions">
      <span className={`badge ${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>
      {paused ? <span className="badge paused">일시중지</span> : null}
    </span>
  );
}
