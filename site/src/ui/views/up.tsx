let toTop = () => scrollTo({top: 0})

export default function Up() {
  return (
    <button class="up" aria-label="To the top" onClick={toTop}>↑</button>
  )
}
