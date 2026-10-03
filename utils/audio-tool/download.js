export function clickHrefAsAnchor (href, downloadAttr) {
  return new Promise((resolve, reject) => {
    const anchor = document.createElement('a')
    anchor.setAttribute('href', href)
    anchor.setAttribute('target', '_blank')
    if (downloadAttr) {
      anchor.setAttribute('download', downloadAttr)
    }
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    setTimeout(() => {
      anchor.remove()
      resolve()
    }, 100)
  })
}
