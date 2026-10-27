export function FightFooter() {
  return (
    <div className="relative mt-10 select-none sm:mt-14" aria-hidden>
      <div className="pointer-events-none relative z-10 flex justify-center">
        <div
          className="flex max-w-full items-end overflow-hidden"
          style={{ width: 260, height: 130 }}
        >
          <img
            src="/duel.gif"
            alt=""
            loading="lazy"
            className="block -mb-px h-auto w-full mix-blend-multiply dark:mix-blend-normal"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      <div className="relative z-0 border-t border-line" />
    </div>
  )
}
