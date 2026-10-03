export function prefetchIcons (icons) {
  const containerId = 'prefetch-icons-container'
  let parentContainer = document.getElementById(containerId)
  if (!parentContainer) {
    parentContainer = document.createElement('div')
    parentContainer.setAttribute('id', containerId)
    Object.assign(parentContainer.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '50px',
      height: '50px',
      transform: 'translateX(-100%)'
    })
    document.body.append(parentContainer)
  }
  for (const icon of icons) {
    const url = `${import.meta.env.BASE_URL}icons/${icon}.svg`
    const iconEl = document.createElement('div')
    Object.assign(iconEl.style, {
      background: `url(${url})`
    })
    parentContainer.append(iconEl)
  }
}
