import assert from "node:assert/strict";
import { acceptModelDraft, answerHome, fittingPublicReplies, linksForQuestion } from "../src/lib/home/answer.ts";

const company = answerHome("엠지미디어는 어떤 회사야?", []);
assert.equal(company.needsInquiry, false);
assert.match(company.markdown, /대구/);
assert.equal(company.links[0]?.href, "/about");

const products = answerHome("엠지미디어의 상품은?", []);
assert.equal(products.needsInquiry, false);
assert.match(products.markdown, /온라인마케팅/);
assert.equal(products.links.some((link) => link.href === "/services"), true);

const beauty = answerHome("우리 회사는 뷰티샵인데 어떤 광고 패키지를 추천해?", []);
assert.equal(beauty.needsInquiry, true);
assert.equal(beauty.usedReply, false);
assert.doesNotMatch(beauty.markdown, /블로그 20/);

const reused = answerHome("미용실인데 인스타 광고를 어떻게 하면 될까?", [
  {
    question: "우리 회사는 뷰티샵인데 어떤 광고 패키지를 추천해?",
    answer: "뷰티 매장은 시술 전후가 보이는 인스타그램과 지역 검색을 먼저 봅니다. 월 수량은 매장 상담 후 정합니다.",
  },
]);
assert.equal(reused.usedReply, true);
assert.match(reused.markdown, /인스타그램/);
assert.doesNotMatch(reused.markdown, /010/);

const other = answerHome("학원 블로그와 유튜브를 같이 어떻게 운영할까?", [
  {
    question: "우리 회사는 뷰티샵인데 어떤 광고 패키지를 추천해?",
    answer: "뷰티 매장 전용 설명입니다.",
  },
]);
assert.equal(other.usedReply, false);
assert.equal(other.needsInquiry, true);

const notes = fittingPublicReplies("미용실인데 인스타 광고를 어떻게 하면 될까?", [
  {
    question: "우리 회사는 뷰티샵인데 어떤 광고 패키지를 추천해?",
    answer: "뷰티 매장은 시술 전후가 보이는 인스타그램을 먼저 봅니다. 연락은 010-1111-2222 입니다.",
  },
]);
assert.equal(notes.length, 1);
assert.doesNotMatch(notes[0] ?? "", /010/);

const priced = acceptModelDraft({ markdown: "홈페이지는 150만원입니다. 상담 후 확정입니다.", needsInquiry: false }, "홈페이지 제작 비용은?");
assert.equal(priced, null);
const explained = acceptModelDraft(
  { markdown: "기업 홈페이지는 회사와 서비스를 소개하는 사이트입니다. 페이지 구성은 상담에서 정합니다.", needsInquiry: false },
  "홈페이지 제작 비용은?",
);
assert.equal(explained?.needsInquiry, true);
assert.match(explained?.markdown ?? "", /상담 후 확정/);
assert.equal(linksForQuestion("인스타그램 운영은 어떻게 하나요?")[0]?.href, "/services/online-marketing");

console.log("home answer checks passed");
