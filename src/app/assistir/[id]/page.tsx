'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle]       = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [fetching, setFetching] = useState(true)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout>>()
  const [playing, setPlaying]       = useState(false)
  const [muted, setMuted]           = useState(false)
  const [progress, setProgress]     = useState(0)
  const [duration, setDuration]     = useState(0)
  const [volume, setVolume]         = useState(1)
  const [showCtrl, setShowCtrl]     = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user || !id) return
    const sb = createClient()
    sb.from('content').select('title,video_url').eq('id', id).single().then(({ data }) => {
      setTitle(data?.title || '')
      setVideoUrl(data?.video_url || '')
      setFetching(false)
    })
  }, [user, id])

  const showControls = useCallback(() => {
    setShowCtrl(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { if (playing) setShowCtrl(false) }, 3000)
  }, [playing])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
  }

  if (loading || fetching) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#000' }}>
        <div style={{ width:32, height:32, border:'2px solid #333', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div
      style={{ position:'relative', height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', cursor:'none' }}
      onMouseMove={showControls}
      onClick={togglePlay}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width:'100%', height:'100%', objectFit:'contain' }}
          onTimeUpdate={() => { const v = videoRef.current; if (v) { setProgress(v.currentTime); setDuration(v.duration) } }}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={() => { const v = videoRef.current; if (v) setDuration(v.duration) }}
        />
      ) : (
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64 }}>🎬</div>
          <p style={{ color:'#fff', fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:20, marginTop:16 }}>{title}</p>
          <p style={{ color:'#888', fontFamily:"'Open Sans',sans-serif", marginTop:8 }}>URL de vídeo não configurada</p>
        </div>
      )}

      {/* Controls */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between',
          background:'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.85) 100%)',
          opacity: showCtrl ? 1 : 0, transition:'opacity 0.3s', cursor:'default',
          pointerEvents: showCtrl ? 'auto' : 'none',
        }}
      >
        {/* Top */}
        <div style={{ padding:'16px 24px', display:'flex', alignItems:'center', gap:16 }}>
          <Link href="/" style={{
            display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.5)',
            borderRadius:10, padding:'8px 16px', color:'#fff', textDecoration:'none',
            fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600,
          }}>← Voltar</Link>
          <span style={{ color:'#fff', fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:16 }}>{title}</span>
        </div>

        {/* Bottom */}
        <div style={{ padding:'16px 24px' }}>
          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ color:'#ccc', fontSize:13, fontFamily:"'Open Sans',sans-serif", minWidth:40, textAlign:'right' }}>{formatTime(progress)}</span>
            <input type="range" min={0} max={duration||0} value={progress} step={1} style={{ flex:1 }}
              onChange={e => { const v = Number(e.target.value); if (videoRef.current) videoRef.current.currentTime = v; setProgress(v) }} />
            <span style={{ color:'#ccc', fontSize:13, fontFamily:"'Open Sans',sans-serif", minWidth:40 }}>{formatTime(duration)}</span>
          </div>
          {/* Buttons */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={togglePlay} style={{
              width:40, height:40, borderRadius:'50%', background:'#fff', border:'none',
              cursor:'pointer', fontSize:16, fontFamily:"'Inter',sans-serif", fontWeight:700,
            }}>{playing ? '⏸' : '▶'}</button>
            <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(progress + 10, duration) }}
              style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:20 }}>⏭</button>
            <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }}
              style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:20 }}>{muted ? '🔇' : '🔊'}</button>
            <input type="range" min={0} max={1} step={0.05} value={volume} style={{ width:80 }}
              onChange={e => { const v = Number(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v }} />
            <div style={{ flex:1 }} />
            <button onClick={() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() }}
              style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:20 }}>⛶</button>
          </div>
        </div>
      </div>
    </div>
  )
}
