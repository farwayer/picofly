type Props = {
	title: string
	busy?: boolean
	onClick: () => void
}

export let Button = ({onClick, busy, title}: Props) => (
	<button onClick={onClick} disabled={busy}>
		<span className={busy ? 'off' : undefined}>{title}</span>
		{busy && <span className="spin"/>}
	</button>
)
