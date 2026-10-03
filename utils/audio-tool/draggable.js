import { watch, onBeforeUnmount } from 'vue'

export function useDraggableEl (elRef, options = {}) {
  const {
    clickTriggerDistance = 3,
    buttonWhich = 1,
    onDrag,
    onDragStart,
    onDragStop,
    onClick
  } = options

  let dragStartX
  let dragStartY
  let isWithinClickDistance

  const elTriggerEvents = [ 'touchstart', 'mousedown' ]
  const windowEvents = [ 'blur', 'mouseup', 'mousemove', 'touchmove', 'touchend', 'touchcancel' ]
  const applyWindowEvents = (register = true) => {
    windowEvents.forEach(event => {
      if (register) {
        window.addEventListener(event, onEvent, { capture: true })
      } else {
        window.removeEventListener(event, onEvent, { capture: true })
      }
    })
  }

  const onEvent = (event) => {
    let { clientX, clientY } = event
    if (/mouse/.test(event.type) && event.which !== buttonWhich) {
      return
    } else if (/touch/.test(event.type)) {
      if (!/touch(end|cancel)/.test(event.type) && event.targetTouches.length !== 1) {
        return
      }
      const targetTouch = event.targetTouches[0]
      if (targetTouch) {
        clientX = targetTouch.clientX
        clientY = targetTouch.clientY
      }
    }
    if (/(touch|mouse)move/.test(event.type)) {
      const x = clientX
      const y = clientY
      const dragDistanceX = Math.abs(x - dragStartX)
      const dragDistanceY = Math.abs(y - dragStartY)
      const dragDistance = Math.sqrt(dragDistanceX * dragDistanceX + dragDistanceY * dragDistanceY)
      if (dragDistance >= clickTriggerDistance) {
        isWithinClickDistance = false
      }
      if (typeof onDrag === 'function') {
        onDrag({
          x,
          y,
          dragDistance,
          dragDistanceX,
          dragDistanceY,
          dragStartX,
          dragStartY
        })
      }
    } else if (elTriggerEvents.includes(event.type)) {
      dragStartX = clientX
      dragStartY = clientY
      isWithinClickDistance = true
      applyWindowEvents()
      if (typeof onDragStart === 'function') {
        onDragStart({ dragStartX, dragStartY })
      }
    } else if (/(touch(end|cancel)|mouseup)/.test(event.type)) {
      if (typeof onDragStop === 'function') {
        onDragStop({ x: clientX, y: clientY })
      }
      if (isWithinClickDistance && typeof onClick === 'function') {
        onClick()
      }
      cleanup()
    } else if (event.type === 'blur') {
      if (event.target === window) {
        if (typeof onDragStop === 'function') {
          onDragStop({})
        }
        cleanup()
      }
    }
  }

  const cleanup = (el) => {
    if (el) {
      elTriggerEvents.forEach(event => {
        el.removeEventListener(event, onEvent)
      })
    }
    applyWindowEvents(false)
  }

  watch(elRef, (newValue, oldValue) => {
    if (oldValue) {
      cleanup(oldValue)
    }
    if (newValue) {
      elTriggerEvents.forEach(event => {
        newValue.addEventListener(event, onEvent)
      })
    }
  })

  onBeforeUnmount(() => cleanup(elRef.value))
}
