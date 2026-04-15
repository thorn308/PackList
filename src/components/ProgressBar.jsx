export default function ProgressBar({ packed, total }) {
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100)
  const allDone = total > 0 && packed === total

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className={allDone ? 'text-[#D9A441] font-semibold' : 'text-[#F5F5F5]'}>
          {allDone ? '✓ All packed!' : `${packed} of ${total} packed`}
        </span>
        <span className="text-[#D6CFC2]/60">{pct}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: allDone ? '#7cc47a' : '#D9A441' }}
        />
      </div>
    </div>
  )
}
