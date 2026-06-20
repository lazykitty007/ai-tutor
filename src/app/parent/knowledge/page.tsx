import { redirect } from "next/navigation";
import { Panel, Pill, ProgressBars, ScreenShell } from "@/components/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { getKnowledgeNodes, getMasteryRecordsForActiveChild } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [knowledgeNodes, masteryRecords] = await Promise.all([
    getKnowledgeNodes(),
    getMasteryRecordsForActiveChild(user.id),
  ]);
  const node = knowledgeNodes.find((item) => item.id === "char-lin") || knowledgeNodes[0];
  const mastery = masteryRecords.find((item) => item.knowledgeId === node?.id);
  const masteryScore = mastery?.masteryScore ?? 0;

  if (!node) {
    throw new Error("Knowledge data is missing. Run npm run db:reset first.");
  }

  return (
    <ScreenShell title="知识点详情" action={<span>识字图谱</span>}>
      <div className="knowledge-grid">
        <Panel>
          <p className="section-label">当前知识点</p>
          <div className="char-stage" style={{ minHeight: 250, marginBottom: 28 }}>
            <strong>{node.title}</strong>
          </div>
          <h2>{node.pinyin || node.title} · {node.meaning}</h2>
          <p style={{ marginTop: 18 }}>掌握度 {masteryScore}%，最近练习中出现的薄弱点：{mastery?.weaknessTags.join("、") || "暂无"}。</p>
          <div style={{ marginTop: 28 }}>
            <ProgressBars value={Math.max(1, Math.round(masteryScore / 15))} total={7} />
          </div>
          <div className="mini-card" style={{ marginTop: 32 }}>
            <strong>下一步建议</strong>
            <p>先复习“木”，再加入“森”，帮助孩子理解字形结构。</p>
          </div>
        </Panel>
        <Panel>
          <h3>知识关系图</h3>
          <div className="knowledge-node-map">
            <span className="edge" style={{ left: 312, top: 260, width: 170, transform: "rotate(-18deg)" }} />
            <span className="edge" style={{ left: 312, top: 260, width: 170, transform: "rotate(24deg)" }} />
            <span className="edge" style={{ left: 312, top: 260, width: 170, transform: "rotate(58deg)" }} />
            <span className="node core" style={{ left: 270, top: 230 }}>林</span>
            <span className="node" style={{ left: 72, top: 150 }}>木</span>
            <span className="node" style={{ right: 94, top: 150 }}>森</span>
            <span className="node" style={{ left: 92, top: 390 }}>树</span>
            <span className="node" style={{ right: 112, top: 390 }}>休</span>
            <span style={{ position: "absolute", left: 250, top: 42 }}>
              <Pill>形似</Pill>
            </span>
            <span style={{ position: "absolute", right: 108, top: 310 }}>
              <Pill>主题：树木</Pill>
            </span>
          </div>
        </Panel>
      </div>
    </ScreenShell>
  );
}
