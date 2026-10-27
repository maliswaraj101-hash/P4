/** Pixel SM mark — same construction language as chanhdai's CD mark (MIT). */
export function SMMark(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 512 256"
      aria-hidden
      {...props}
    >
      <path
        fill="currentColor"
        d={[
          // S
          'M192 0H64v64h128V0ZM64 0H0v128h64V0ZM192 96H64v64h128V96ZM192 128h64v128H192V128ZM192 192H64v64h128v-64Z',
          // M
          'M288 0h64v256H288V0ZM448 0h64v256h-64V0ZM352 0h32v128H352V0ZM416 0h32v128H416V0ZM384 64h32v128H384V64Z',
        ].join('')}
      />
    </svg>
  )
}
