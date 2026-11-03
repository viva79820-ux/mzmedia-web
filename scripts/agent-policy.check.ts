import assert from "node:assert/strict";
import {
  acceptModelAgent,
  activationDecision,
  canDelegate,
  classifyTurn,
  forbiddenParts,
  specialistMayCall,
} from "../src/lib/office/agent-policy.ts";

const blocked = classifyTurn("현재 막힌 제작 업무를 정리해.");
assert.equal(blocked.kind, "blocked_work");

const created = classifyTurn("영상제작 전담 PM 에이전트를 만들어.");
assert.equal(created.kind, "create");
assert.equal(created.domain, "VIDEO_PRODUCTION");
assert.equal(created.forceActivate, false);

const forced = classifyTurn("새 에이전트를 만들고 승인 없이 바로 사용해.");
assert.equal(forced.kind, "create");
assert.equal(forced.forceActivate, true);
assert.equal(activationDecision("PENDING_APPROVAL", "approve").next, "ACTIVE");
assert.equal(activationDecision("DRAFT", "approve").ok, false);

const delegated = classifyTurn("영상제작 에이전트에게 담당자가 없는 영상 업무를 찾아보라고 해.");
assert.equal(delegated.kind, "delegate");
assert.equal(delegated.domain, "VIDEO_PRODUCTION");

const forbidden = forbiddenParts("고객에게 견적서를 보내고 계약을 체결해.");
assert.ok(forbidden.includes("고객 발송"));
assert.ok(forbidden.includes("계약 체결"));

assert.match(canDelegate({ callerIsSpecialist: true, stepsUsed: 1, maxSteps: 8 }), /하위 에이전트/);
assert.match(canDelegate({ callerIsSpecialist: false, stepsUsed: 8, maxSteps: 8 }), /한도/);
assert.equal(canDelegate({ callerIsSpecialist: false, stepsUsed: 1, maxSteps: 8 }), "");

const accepted = acceptModelAgent(
  {
    name: "영상제작 PM",
    businessDomain: "VIDEO_PRODUCTION",
    description: "영상 업무를 조회한다",
    systemInstructions: "발송하지 않는다",
    allowedTools: ["list_tasks", "search_memory", "send_email"],
    unsupportedTools: ["render_video"],
    evaluationCriteria: "담당 없는 영상을 확인 필요로 남긴다",
  },
  "VIDEO_PRODUCTION",
);
assert.equal(accepted.ok, true);
if (accepted.ok) {
  assert.equal(accepted.agent.agentKey, "video-pm");
  assert.deepEqual(accepted.agent.allowedTools, ["list_tasks", "search_memory"]);
  assert.match(accepted.agent.deferredNote, /send_email/);
  assert.match(accepted.agent.deferredNote, /render_video/);
  assert.equal(specialistMayCall(accepted.agent.allowedTools, "list_tasks"), "");
  assert.match(specialistMayCall(accepted.agent.allowedTools, "send_email"), /서버 허용 목록/);
}

console.log("agent-policy checks passed");
