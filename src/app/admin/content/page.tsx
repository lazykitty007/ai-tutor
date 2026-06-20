import { Panel, Pill, ScreenShell } from "@/components/primitives";
import { getKnowledgeNodes } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const knowledgeNodes = await getKnowledgeNodes();

  return (
    <ScreenShell title="内容与知识图谱后台" action={<span>管理员</span>}>
      <div className="admin-grid">
        <Panel>
          <h3>内容管理</h3>
          <div style={{ display: "grid", gap: 14, marginTop: 28 }}>
            <div className="field-row"><strong>知识点</strong><span>{knowledgeNodes.length}</span></div>
            <div className="field-row"><strong>题目</strong><span>426</span></div>
            <div className="field-row"><strong>素材</strong><span>312</span></div>
            <div className="field-row"><strong>内容包</strong><span>6</span></div>
          </div>
        </Panel>
        <Panel>
          <div className="panel-title-row">
            <h3>汉字知识点</h3>
            <Pill>已发布 v1.0.0</Pill>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>知识点</th>
                <th>关系</th>
                <th>题目</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>林</td>
                <td>形似 / 主题</td>
                <td>12</td>
                <td>已发布</td>
              </tr>
              <tr>
                <td>木</td>
                <td>先修</td>
                <td>15</td>
                <td>已发布</td>
              </tr>
              <tr>
                <td>森</td>
                <td>形似</td>
                <td>9</td>
                <td>已发布</td>
              </tr>
              <tr>
                <td>休</td>
                <td>组词</td>
                <td>6</td>
                <td>草稿</td>
              </tr>
            </tbody>
          </table>
          <div className="report-grid" style={{ marginTop: 28 }}>
            <div className="mini-card">
              <strong>异常题目</strong>
              <p>“林”听音选字错误率偏高，需要检查干扰项。</p>
            </div>
            <div className="mini-card">
              <strong>内容包</strong>
              <p>基础识字包已通过校验，可灰度发布。</p>
            </div>
          </div>
        </Panel>
      </div>
    </ScreenShell>
  );
}
