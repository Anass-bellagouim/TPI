import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

const TYPE_OPTIONS = ["", "جنحة", "مخالفة", "حوادث"];

function StatusBadge({ status }) {
  const s = (status || "pending").toLowerCase();
  const map = {
    pending: { cls: "badge badgePending", label: "في الانتظار" },
    processing: { cls: "badge badgeProcessing", label: "قيد المعالجة" },
    done: { cls: "badge badgeDone", label: "تم الاستخراج" },
    failed: { cls: "badge badgeFailed", label: "فشل الاستخراج" },
  };
  const m = map[s] || { cls: "badge badgePending", label: status || "pending" };

  return (
    <span className={m.cls} title={status || "pending"}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

export default function SearchDocuments() {
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [judgementNumber, setJudgementNumber] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [division, setDivision] = useState("");
  const [keyword, setKeyword] = useState("");

  const [pageData, setPageData] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const rows = useMemo(() => pageData?.data || [], [pageData]);

  const hasAnyFilter = useMemo(() => {
    return (
      type ||
      caseNumber.trim() ||
      judgementNumber.trim() ||
      judgeName.trim() ||
      division.trim() ||
      keyword.trim()
    );
  }, [type, caseNumber, judgementNumber, judgeName, division, keyword]);

  const canPrev = !isSearchMode && !!pageData?.prev_page_url;
  const canNext = !isSearchMode && !!pageData?.next_page_url;

  async function fetchList(url = "/documents") {
    setError(null);
    setInfo(null);

    try {
      setLoading(true);
      setIsSearchMode(false);

      const res = await api.get(url);
      setPageData(res.data);

      const count = res.data?.data?.length ?? 0;
      if (count === 0) setInfo("ما كايناش وثائق حالياً.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "وقع خطأ أثناء جلب لائحة الوثائق.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function doSearch(url = "/documents/search") {
    setError(null);
    setInfo(null);

    if (!hasAnyFilter) {
      await fetchList("/documents");
      return;
    }

    try {
      setLoading(true);
      setIsSearchMode(true);

      const params = {
        type: type || "",
        case_number: caseNumber.trim(),
        judgement_number: judgementNumber.trim(),
        judge_name: judgeName.trim(),
        division: division.trim(),
        keyword: keyword.trim(),
      };

      const res = await api.get(url, { params });

      const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
      setPageData({ data: dataArray });

      if (dataArray.length === 0) setInfo("ما لقيْنا حتى نتيجة بهاد البحث.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "وقع خطأ أثناء البحث.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    doSearch("/documents/search");
  }

  useEffect(() => {
    fetchList("/documents");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h2>الوثائق القضائية</h2>
          <p>
            افتراضياً كيبانو جميع الوثائق (pagination). استعمل البحث المتقدم للتصفية.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={onSubmit}>
          <div className="grid2">
            <div className="field">
              <div className="label">نوع القضية</div>
              <select
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t || "all"} value={t}>
                    {t || "الكل"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">رقم الملف</div>
              <input
                className="input"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="مثال: 2025/0001/7"
              />
            </div>

            <div className="field">
              <div className="label">رقم الحكم</div>
              <input
                className="input"
                value={judgementNumber}
                onChange={(e) => setJudgementNumber(e.target.value)}
                placeholder="مثال: 2024/9"
              />
            </div>

            <div className="field">
              <div className="label">اسم القاضي</div>
              <input
                className="input"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="مثال: محمد..."
              />
            </div>

            <div className="field">
              <div className="label">الشعبة</div>
              <input
                className="input"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="مثال: الشعبة الأولى"
              />
            </div>

            <div className="field">
              <div className="label">كلمة مفتاحية</div>
              <input
                className="input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="مثال: استئناف..."
              />
            </div>
          </div>

          <div className="rowActions" style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "..." : "بحث"}
            </button>

            <button
              className="btn btnSecondary"
              type="button"
              disabled={loading}
              onClick={() => {
                setType("");
                setCaseNumber("");
                setJudgementNumber("");
                setJudgeName("");
                setDivision("");
                setKeyword("");
                fetchList("/documents");
              }}
            >
              عرض الكل
            </button>
          </div>

          <div className="help" style={{ marginTop: 8 }}>
            إذا خليتي جميع الحقول فارغة ودرتي بحث → كيرجع list الافتراضية.
          </div>
        </form>
      </div>

      {info && (
        <div className="alert alertInfo card" style={{ marginBottom: 14 }}>
          {info}
        </div>
      )}
      {error && (
        <div className="alert alertError card" style={{ marginBottom: 14 }}>
          <strong>خطأ:</strong> {error}
        </div>
      )}

      <div className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>النوع</th>
                <th>رقم الملف</th>
                <th>رقم الحكم</th>
                <th>القاضي</th>
                <th>الشعبة</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.type || "—"}</td>
                  <td>{r.case_number || "—"}</td>
                  <td>{r.judgement_number || "—"}</td>
                  <td>{r.judge_name || "—"}</td>
                  <td>{r.division || "—"}</td>
                  <td>
                    <StatusBadge status={r.extract_status} />
                  </td>
                  <td>
                    <div className="rowActions">
                      <Link className="btn btnSecondary" to={`/documents/${r.id}`}>
                        عرض
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--muted)" }}>
                    لا توجد بيانات للعرض.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--muted)" }}>
                    جاري التحميل...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isSearchMode && pageData && (
          <div className="pager" style={{ marginTop: 12 }}>
            <div className="help">
              صفحة {pageData.current_page} / {pageData.last_page} — المجموع:{" "}
              {pageData.total}
            </div>

            <div className="rowActions">
              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canPrev || loading}
                onClick={() => fetchList(pageData.prev_page_url)}
              >
                السابق
              </button>

              <button
                className="btn btnSecondary"
                type="button"
                disabled={!canNext || loading}
                onClick={() => fetchList(pageData.next_page_url)}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {isSearchMode && (
          <div className="help" style={{ marginTop: 12 }}>
            نتائج البحث: {rows.length} (حد أقصى 50)
          </div>
        )}
      </div>
    </div>
  );
}
