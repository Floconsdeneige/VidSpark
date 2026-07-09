import { useEffect, useMemo, useState } from 'react'
import { useAccount } from '@/hooks/useAccount'
import { useSocial } from '@/hooks/useSocial'

/**
 * 私信中心（B站「消息」/抖音「私信」的一对一聊天）。
 * - 左栏：会话列表（按最近消息时间排序，未读红点）。
 * - 右栏：与选中对端的聊天窗 + 发送框；点开即标记已读。
 * - 新建私信：从真实账号列表里挑一个发起（即使还没有会话也能直接聊）。
 * 数据存于各账号的 dmConversations，切换账号自动隔离。
 */
export default function MessageCenter({
  open,
  initialPeerId,
  onClose,
  onOpenAccount,
}: {
  open: boolean
  initialPeerId?: string | null
  onClose: () => void
  onOpenAccount?: (id: string) => void
}) {
  const { accounts, activeId } = useAccount()
  const { dmConversations, sendDM, markDMRead } = useSocial()
  const [peerId, setPeerId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  // 打开时定位到指定对端；否则默认第一个会话
  useEffect(() => {
    if (!open) return
    setShowPicker(false)
    const target = initialPeerId ?? dmConversations[0]?.peerId ?? null
    setPeerId(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPeerId])

  // 切换/定位对端时标记已读
  useEffect(() => {
    if (open && peerId) markDMRead(peerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, peerId])

  const sortedConvs = useMemo(
    () =>
      [...dmConversations].sort(
        (a, b) => (b.messages[b.messages.length - 1]?.ts ?? 0) - (a.messages[a.messages.length - 1]?.ts ?? 0),
      ),
    [dmConversations],
  )

  const peer = accounts.find((a) => a.id === peerId) ?? null
  const conv = dmConversations.find((c) => c.peerId === peerId) ?? null

  // 可发起私信的账号：除自己以外的所有真实账号
  const candidates = accounts.filter((a) => a.id !== activeId)

  if (!open) return null

  const send = () => {
    const t = draft.trim()
    if (!t || !peerId) return
    sendDM(peerId, t)
    setDraft('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-3xl overflow-hidden rounded-t-3xl border border-border bg-background text-foreground sm:h-[80vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左栏：会话列表 */}
        <div className="flex w-40 shrink-0 flex-col border-r border-border sm:w-56">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <span className="text-sm font-semibold">私信</span>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-red-500"
              title="新建私信"
            >
              ✏️ 新
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedConvs.length === 0 && !showPicker && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">还没有会话</div>
            )}
            {sortedConvs.map((c) => {
              const unread = c.messages.filter((m) => !m.read).length
              const last = c.messages[c.messages.length - 1]
              return (
                <button
                  key={c.peerId}
                  onClick={() => {
                    setShowPicker(false)
                    setPeerId(c.peerId)
                  }}
                  className={`flex w-full items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left transition hover:bg-card ${
                    c.peerId === peerId ? 'bg-card' : ''
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-sm font-bold text-white">
                    {c.peerAvatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium">{c.peerName}</span>
                      {unread > 0 && (
                        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{last ? last.text : ''}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 新建私信：从账号列表挑选 */}
          {showPicker && (
            <div className="max-h-56 overflow-y-auto border-t border-border bg-card">
              {candidates.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">没有其他账号</div>
              ) : (
                candidates.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setPeerId(a.id)
                      setShowPicker(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-background"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-xs font-bold text-white">
                      {a.avatar}
                    </div>
                    <span className="truncate">{a.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 右栏：聊天窗 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            {peer ? (
              <button
                onClick={() => peer && onOpenAccount?.(peer.id)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-sm font-bold text-white">
                  {peer.avatar}
                </div>
                <span className="truncate font-semibold">{peer.name}</span>
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">选择一个会话</span>
            )}
            <button
              onClick={onClose}
              className="ml-auto rounded-full px-2 text-xl leading-none text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {peer && conv ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {conv.messages.map((m) => {
                  const mine = m.fromId === activeId
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'bg-red-600 text-white'
                            : 'bg-card text-foreground'
                        }`}
                      >
                        {m.text}
                        <div className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(m.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send()
                  }}
                  placeholder={`发消息给 @${peer.name}…`}
                  className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-red-500"
                />
                <button
                  onClick={send}
                  disabled={!draft.trim()}
                  className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              {peer ? '还没有消息，打个招呼吧～' : '从左侧选择一个会话，或点「✏️ 新」发起私信'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
