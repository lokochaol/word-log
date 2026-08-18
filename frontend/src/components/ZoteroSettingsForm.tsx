"use client";

import { useState, useTransition } from "react";
import { HudFrame } from "@/components/HudFrame";
import { Spinner } from "@/components/LoadingSpinner";
import { removeZoteroSettingsAction, saveZoteroSettingsAction } from "@/app/settings/actions";
import type { ZoteroCredentialSummary } from "@/lib/zoteroCredentials";

function formatDate(date: Date) {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ZoteroSettingsForm({ initial }: { initial: ZoteroCredentialSummary | null }) {
  const [summary, setSummary] = useState(initial);
  const [apiKey, setApiKey] = useState("");
  const [libraryId, setLibraryId] = useState(initial?.libraryId ?? "");
  const [libraryType, setLibraryType] = useState(initial?.libraryType ?? "user");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveZoteroSettingsAction({ apiKey, libraryId, libraryType });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setApiKey("");
      setSummary({ libraryId, libraryType, updatedAt: new Date() });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  function disconnect() {
    startTransition(async () => {
      await removeZoteroSettingsAction();
      setSummary(null);
      setLibraryId("");
      setLibraryType("user");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {summary && (
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface-alt px-3 py-2">
          <span className="font-mono text-[11px] text-ink">
            連携済み — ライブラリID {summary.libraryId}（{summary.libraryType === "group" ? "グループ" : "個人"}）
            <span className="ml-2 text-ink-faint">最終更新 {formatDate(summary.updatedAt)}</span>
          </span>
          <button
            onClick={disconnect}
            disabled={pending}
            className="font-mono text-[10px] text-ink-soft transition-colors hover:text-accent disabled:opacity-50"
          >
            連携解除
          </button>
        </div>
      )}

      <p className="text-xs text-ink-soft">
        <a
          href="https://www.zotero.org/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          zotero.org/settings/keys
        </a>
        でAPIキーを発行し、下記に入力してください。検索して使うだけなら読み取り権限で十分ですが、
        検索でヒットしなかった文献をその場でZoteroに新規登録したい場合は「Write Access」も有効にしてください。
      </p>

      <LabeledInput
        label="APIキー"
        value={apiKey}
        onChange={setApiKey}
        placeholder={summary ? "変更する場合のみ入力" : "Zoteroで発行したAPIキー"}
        type="password"
      />
      <LabeledInput label="ライブラリID（userID）" value={libraryId} onChange={setLibraryId} placeholder="例: 1234567" />

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">ライブラリ種別</label>
        <div className="flex gap-2">
          {(["user", "group"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setLibraryType(t)}
              className={`rounded-full border px-3 py-1 font-mono text-[10.5px] transition-colors ${
                libraryType === t
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft hover:border-line-strong"
              }`}
            >
              {t === "user" ? "個人" : "グループ"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-mono text-[10.5px] text-accent">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={pending || !libraryId.trim() || (!summary && !apiKey.trim())}
          className="btn-sheen flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-on-accent transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
        >
          {pending && <Spinner size="xs" />}
          {pending ? "保存中…" : saved ? "保存しました" : "保存"}
        </button>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[9.5px] tracking-wider text-ink-faint uppercase">{label}</label>
      <HudFrame active={false} innerClassName="rounded-lg px-3 py-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-xs text-ink placeholder:text-ink-soft focus:outline-none"
        />
      </HudFrame>
    </div>
  );
}
