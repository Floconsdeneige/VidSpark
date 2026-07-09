import { useState } from 'react'
import { useAccount } from '@/hooks/useAccount'

const AVATARS = ['😎', '🦊', '🐱', '🐼', '🚀', '🌟', '🔥', '🍉', '👾', '🐯', '🦄', '🌈']

export default function AccountGate() {
  const { accounts, login, register } = useAccount()
  const [showReg, setShowReg] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [bio, setBio] = useState('')

  const submit = () => {
    if (!name.trim()) return
    register(name, avatar, bio)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <div className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <span className="text-red-500">●</span> VidSpark
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          登录或创建一个本地账号 · 数据仅保存在此浏览器
        </p>

        {!showReg ? (
          <>
            <div className="space-y-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => login(a.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition hover:border-red-500"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-lg font-bold text-white">
                    {a.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{a.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.bio || '本地账号'}</div>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReg(true)}
              className="mt-4 w-full rounded-full bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500"
            >
              + 创建新账号
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">昵称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                placeholder="给自己起个名字"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">头像</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl transition ${
                      avatar === a ? 'border-red-500 bg-background' : 'border-transparent hover:border-border'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">个性签名</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={80}
                placeholder="一句话介绍自己…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReg(false)}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm transition hover:bg-background"
              >
                返回
              </button>
              <button
                onClick={submit}
                disabled={!name.trim()}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                注册并登录
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
