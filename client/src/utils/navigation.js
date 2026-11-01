export function scrollToElement(id) {
  if (!id || typeof document === 'undefined') {
    return false
  }

  const element = document.getElementById(id)
  if (!element) {
    return false
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

export function navigateTo(navigate, link) {
  if (!link) {
    return
  }

  if (link.startsWith('#')) {
    scrollToElement(link.slice(1))
    return
  }

  if (link.startsWith('/#')) {
    const id = link.slice(2)
    if (scrollToElement(id)) {
      return
    }
    navigate('/')
    return
  }

  if (link.startsWith('/?')) {
    const params = new URLSearchParams(link.slice(2))
    const focus = params.get('focus')
    if (focus && scrollToElement(focus)) {
      return
    }
  }

  navigate(link)
}
