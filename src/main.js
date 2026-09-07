/* ============================================================
   QUATERNITY — PERSISTENT PRIMARY NAVIGATION
   ============================================================ */


/*
  The landing contains the full decorative ray construction.

  Once the joined four-heading navigation reaches the Q, fixed
  copies of the navigation and Quaternity bar take over.

  The decorative landing rays remain ordinary page content and
  naturally scroll away.

  Nothing accumulates beneath the persistent navigation.
*/


const qMark =
  document.querySelector('.q-mark')


const qShelf =
  document.querySelector('.q-shelf')


const stickyRays =
  document.querySelector('.sticky-rays')


const stickyCrownCore =
  document.querySelector('.sticky-crown-core')


const stickyStack =
  document.querySelector('.sticky-stack')


if (
  qMark
  && qShelf
  && stickyRays
  && stickyCrownCore
  && stickyStack
) {

  /*
    The persistent four-heading navigation.
  */
  const stickyPrimaryNav =
    stickyStack.querySelector('[data-sticky-nav]')


  /*
    Persistent Quaternity / social row.
  */
  const brandSticky =
    stickyStack.querySelector(
      '[data-sticky-for="brand"]'
    )


  /*
    Original landing navigation.

    Its four real heading cells remain the horizontal source of
    truth for the persistent copy.
  */
  const landingNavSource =
    document.querySelector('.landing-nav')


  const landingNavPanels =
    landingNavSource
      ? Array.from(
          landingNavSource.querySelectorAll(
            '[data-nav-for]'
          )
        )
      : []


  /*
    Original yellow landing field used to reconstruct the
    persistent crown behind the fixed navigation.
  */
  const landingSource =
    document.querySelector('.landing')


  /*
    The original Quaternity row.
  */
  const brandSource =
    document.querySelector(
      '[data-gate="brand"]'
    )


  /*
    Collect the four fixed outer ray fields.
  */
  const stickyRayItems =
    Array.from(
      stickyRays.querySelectorAll(
        '[data-sticky-ray-for]'
      )
    )


  const rayNames = [
    'contact',
    'listen',
    'about',
    'gigs',
  ]


  const sourceFrames =
    new Map(
      rayNames.map(
        (name) => [
          name,
          document.querySelector(`.frame-${name}`),
        ]
      )
    )


  /*
    Copy the real Quaternity/social contents into its persistent
    version so there remains one visual source of truth.
  */
  if (brandSource && brandSticky) {
    brandSticky.innerHTML =
      brandSource.innerHTML
  }


  /*
    Copy each original SVG wordmark into the matching persistent
    navigation cell.
  */
  const stickyNavLinks =
    stickyPrimaryNav
      ? Array.from(
          stickyPrimaryNav.querySelectorAll(
            '[data-sticky-nav-for]'
          )
        )
      : []


  if (landingNavSource) {

    stickyNavLinks.forEach(
      (stickyLink) => {

        const navName =
          stickyLink.dataset.stickyNavFor


        const sourceWord =
          landingNavSource.querySelector(
            `[data-nav-for="${navName}"] .nav-word`
          )


        const stickyWord =
          stickyLink.querySelector(
            '.sticky-nav-word'
          )


        if (sourceWord && stickyWord) {
          stickyWord.innerHTML =
            sourceWord.innerHTML
        }

      }
    )

  }


  /*
    Actual content sections determine which navigation heading
    receives the current-section outline.
  */
  const sectionOrder = [
    'gigs',
    'about',
    'listen',
    'contact',
  ]


  const contentSections =
    sectionOrder
      .map(
        (name) => ({
          name,
          section:
            document.getElementById(name),
        })
      )
      .filter(
        ({ section }) =>
          section
      )


  const contentSectionByName =
    new Map(
      contentSections.map(
        ({ name, section }) => [
          name,
          section,
        ]
      )
    )


  let updateQueued =
    false


  const updateCurrentSection = (
    stackBottom,
    navigationIsActive
  ) => {

    let currentSection =
      null


    if (navigationIsActive) {

      const probeY =
        stackBottom + 1


      contentSections.forEach(
        ({ name, section }) => {

          const sectionRect =
            section.getBoundingClientRect()


          if (sectionRect.top <= probeY) {
            currentSection =
              name
          }

        }
      )

    }


    stickyNavLinks.forEach(
      (stickyLink) => {

        const isCurrent =
          stickyLink.dataset.stickyNavFor
          === currentSection


        stickyLink.classList.toggle(
          'is-current',
          isCurrent
        )


        if (isCurrent) {
          stickyLink.setAttribute(
            'aria-current',
            'location'
          )
        } else {
          stickyLink.removeAttribute(
            'aria-current'
          )
        }

      }
    )

  }


  const updateStickyNavigation = () => {

    /*
      The fixed Q establishes the top of the persistent
      navigation system.
    */
    const qRect =
      qMark.getBoundingClientRect()


    const shelfTop =
      qRect.bottom


    /*
      Read the same overlap value used by the landing rays.

      This makes the original ray geometry and the persistent
      navigation share one exact relationship to the Q.
    */
    const rootStyles =
      getComputedStyle(
        document.documentElement
      )


    const qOverlapDepth =
      Number.parseFloat(
        rootStyles.getPropertyValue(
          '--q-overlap-depth'
        )
      ) || 0


    /*
      The ghost is exactly one frame thickness.

      This is 12px in the desktop system and follows the current
      responsive frame thickness automatically on smaller screens.
    */
    const ghostHeight =
      Number.parseFloat(
        rootStyles.getPropertyValue(
          '--ray-gap'
        )
      ) || 12


    const navTop =
      shelfTop
      - qOverlapDepth


    qShelf.style.top =
      `${shelfTop}px`


    /*
      Rebuild the original nested outer rays above the persistent
      navigation exactly as before.
    */
    const rayGeometry = []


    stickyRayItems.forEach(
      (stickyRay) => {

        const rayName =
          stickyRay.dataset.stickyRayFor


        const sourceFrame =
          sourceFrames.get(rayName)


        if (!sourceFrame) {
          return
        }


        const sourceRect =
          sourceFrame.getBoundingClientRect()


        const stableTop =
          sourceRect.top + window.scrollY


        stickyRay.style.top =
          `${stableTop}px`


        stickyRay.style.left =
          `${sourceRect.left}px`


        stickyRay.style.width =
          `${sourceRect.width}px`


        rayGeometry.push({
          stickyRay,
          stableTop,
          rayName,
        })

      }
    )


    /*
      Reconstruct the yellow landing center behind the persistent
      navigation.
    */
    let stableLandingTop =
      null


    if (landingSource) {

      const landingRect =
        landingSource.getBoundingClientRect()


      stableLandingTop =
        landingRect.top + window.scrollY


      stickyCrownCore.style.top =
        `${stableLandingTop}px`


      stickyCrownCore.style.left =
        `${landingRect.left}px`


      stickyCrownCore.style.width =
        `${landingRect.width}px`

    }


    /*
      Before the navigation engages, the fixed crown ends at the
      same vertical position where the persistent navigation will
      eventually rest.

      This leaves the Q overlap zone available to the scrolling
      landing rays instead of masking them down to the physical
      bottom of the emblem.
    */
    let stackBottom =
      navTop


    let navigationIsActive =
      false


    if (
      stickyPrimaryNav
      && brandSticky
      && landingNavPanels.length >= 2
      && brandSource
    ) {

      const firstPanelRect =
        landingNavPanels[0]
          .getBoundingClientRect()


      const lastPanelRect =
        landingNavPanels[
          landingNavPanels.length - 1
        ].getBoundingClientRect()


      const brandRect =
        brandSource.getBoundingClientRect()


      /*
        Preserve the exact left and right edges of the original
        joined heading bar when it becomes persistent.

        The row rests slightly behind the lower edge of the Q.
        This is now its REAL position rather than a later CSS
        transform.
      */
      stickyPrimaryNav.style.top =
        `${navTop}px`


      stickyPrimaryNav.style.left =
        `${firstPanelRect.left}px`


      stickyPrimaryNav.style.width =
        `${
          lastPanelRect.right
          - firstPanelRect.left
        }px`


      const primaryNavHeight =
        stickyPrimaryNav.offsetHeight


      const brandTop =
        navTop
        + primaryNavHeight


      /*
        Quaternity remains directly beneath the heading bar and
        retains the original landing bar's exact horizontal size.
      */
      brandSticky.style.top =
        `${brandTop}px`


      brandSticky.style.left =
        `${brandRect.left}px`


      brandSticky.style.width =
        `${brandRect.width}px`


      /*
        Switch to the fixed navigation at the exact instant that
        the original button row reaches its permanent resting
        position beneath the Q.

        Comparing top edge to top edge avoids any discrepancy
        caused by the brand row or navigation overlap.
      */
      navigationIsActive =
        firstPanelRect.top <= navTop


      stickyPrimaryNav.classList.toggle(
        'is-active',
        navigationIsActive
      )


      brandSticky.classList.toggle(
        'is-active',
        navigationIsActive
      )


      if (navigationIsActive) {
        stackBottom =
          brandTop
          + brandSticky.offsetHeight
      }

    } else {

      if (stickyPrimaryNav) {
        stickyPrimaryNav.classList.remove(
          'is-active'
        )
      }


      if (brandSticky) {
        brandSticky.classList.remove(
          'is-active'
        )
      }

    }


    /*
      The permanent navigation itself ends here.

      Ghost strips are added beneath this point, but the yellow
      crown and the original nested ray fields must continue to
      end here so they cannot paint over those strips.
    */
    const crownBottom =
      stackBottom


    /*
      Count how many section frames have reached the persistent
      crown.

      Each caught section adds one complete frame thickness to
      the nested closure beneath the navigation.

      The catch line moves downward as those frame closures
      accumulate.
    */
    let ghostCount =
      0


    if (navigationIsActive) {

      sectionOrder.forEach(
        (sectionName) => {

          const section =
            contentSectionByName.get(
              sectionName
            )


          if (!section) {
            return
          }


          const sectionRect =
            section.getBoundingClientRect()


          const catchLine =
            crownBottom
            + (
              ghostCount
              * ghostHeight
            )


          if (sectionRect.top <= catchLine) {
            ghostCount += 1
          }

        }
      )

    }


    /*
      The complete visible persistent stack includes all retained
      frame closures.
    */
    stackBottom =
      crownBottom
      + (
        ghostCount
        * ghostHeight
      )


    /*
      Current-section indication lives entirely in the four-word
      navigation.
    */
    updateCurrentSection(
      stackBottom,
      navigationIsActive
    )


    /*
      The yellow crown ends with the permanent navigation.

      Ghost strips exist beneath it and must remain visible rather
      than being covered by an extended yellow center.
    */
    if (stableLandingTop !== null) {
      stickyCrownCore.style.height =
        `${Math.max(
          0,
          crownBottom - stableLandingTop
        )}px`
    }


    /*
      The overall fixed crown includes the accumulated ghost area
      so the black exterior remains intact around each closing
      frame strip.
    */
    stickyRays.style.height =
      `${stackBottom}px`


    /*
      Extend the real nested frame fields through the accumulated
      closure area.

      Inner frames stop first while outer frames continue farther
      down. This preserves the color that was already surrounding
      each frame instead of exposing the black backing.

      With four accumulated frames:

      Gigs    extends 1 frame thickness
      About   extends 2 frame thicknesses
      Listen  extends 3 frame thicknesses
      Contact extends 4 frame thicknesses
    */
    rayGeometry.forEach(
      ({
        stickyRay,
        stableTop,
        rayName,
      }) => {

        const rayIndex =
          sectionOrder.indexOf(
            rayName
          )


        const retainedRows =
          rayIndex >= 0
            ? Math.min(
                ghostCount,
                rayIndex + 1
              )
            : 0


        const rayBottom =
          crownBottom
          + (
            retainedRows
            * ghostHeight
          )


        stickyRay.style.height =
          `${Math.max(
            0,
            rayBottom - stableTop
          )}px`

      }
    )


    updateQueued =
      false

  }


  const queueStickyUpdate = () => {

    if (updateQueued) {
      return
    }


    updateQueued =
      true


    window.requestAnimationFrame(
      updateStickyNavigation
    )
  }


  window.addEventListener(
    'scroll',
    queueStickyUpdate,
    { passive: true }
  )


  window.addEventListener(
    'resize',
    queueStickyUpdate
  )


  window.addEventListener(
    'load',
    queueStickyUpdate
  )


  /*
    Real images, video embeds, gig data, etc. may later change
    page geometry. Re-measure automatically when that occurs.
  */
  if ('ResizeObserver' in window) {

    const siteFrame =
      document.querySelector('.site-frame')


    if (siteFrame) {

      const resizeObserver =
        new ResizeObserver(
          queueStickyUpdate
        )


      resizeObserver.observe(
        siteFrame
      )

    }

  }


  updateStickyNavigation()

  setupSectionScrolling({
    qMark,
    stickyPrimaryNav,
    brandSticky,
    contentSections,
    updateStickyNavigation,
  })

}

/* ============================================================
   SECTION SCROLLING — EXISTING FRAME GEOMETRY IS UNCHANGED
   ============================================================ */
function setupSectionScrolling({
  qMark,
  stickyPrimaryNav,
  brandSticky,
  contentSections,
  updateStickyNavigation,
}) {
  if (!stickyPrimaryNav || !brandSticky || !contentSections.length) {
    return
  }

  const root = document.documentElement
  const sections = contentSections.map(({ section }) => section)
  const boxes = sections.map((section) => section.querySelector('.section-inner'))
  if (boxes.some((box) => !box)) return

  const contentBoxAt = (target) => {
    const box = target instanceof Element
      ? target.closest('.section-inner') : null
    return boxes.includes(box) ? box : null
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Interaction settings, not measurements of the existing design.
  const GESTURE_GAP_MS = 180
  const TRANSITION_MS = 360
  const SWIPE_THRESHOLD_PX = 32
  const EDGE_TOLERANCE_PX = 1

  let stops = [0]
  let moving = false
  let destination = 0
  let animation = 0
  let settleTimer = 0
  let resizeFrame = 0
  let wheelGesture = null
  let lastWheelTime = -Infinity
  let touch = null

  const closestStop = () => stops.reduce(
    (best, stop, index) =>
      Math.abs(stop - window.scrollY) < Math.abs(stops[best] - window.scrollY)
        ? index : best,
    0
  )

  const atEdge = (section, direction) => !section || (
    direction > 0
      ? section.scrollHeight - section.clientHeight - section.scrollTop
        <= EDGE_TOLERANCE_PX
      : section.scrollTop <= EDGE_TOLERANCE_PX
  )

  const go = (index, reset = false, instant = false) => {
    index = Math.max(0, Math.min(stops.length - 1, index))
    destination = index
    window.cancelAnimationFrame(animation)
    window.clearTimeout(settleTimer)

    if (reset && index > 0) boxes[index - 1].scrollTop = 0

    const start = window.scrollY
    const target = stops[index]
    const started = performance.now()
    moving = true

    const finish = () => {
      window.scrollTo(0, target)
      updateStickyNavigation()
      moving = false
    }

    if (instant || reducedMotion.matches || Math.abs(target - start) <= 1) {
      finish()
      return
    }

    const tick = (now) => {
      const progress = Math.min(1, (now - started) / TRANSITION_MS)
      const eased = 1 - Math.pow(1 - progress, 3)
      window.scrollTo(0, start + (target - start) * eased)
      if (progress < 1) animation = window.requestAnimationFrame(tick)
      else finish()
    }
    animation = window.requestAnimationFrame(tick)
  }

  const measure = (keepPosition = true) => {
    const index = moving ? destination : closestStop()
    root.classList.add('section-scroll-ready')
    updateStickyNavigation()
    const styles = getComputedStyle(root)
    const gap = Number.parseFloat(styles.getPropertyValue('--ray-gap'))
    const overlap = Number.parseFloat(styles.getPropertyValue('--q-overlap-depth'))
    const crownBottom = qMark.getBoundingClientRect().bottom - overlap
      + stickyPrimaryNav.offsetHeight + brandSticky.offsetHeight

    if (!Number.isFinite(gap) || !Number.isFinite(crownBottom)) return


    const landingHero = document.querySelector('.landing-hero')
    const nextGig = document.querySelector('.landing-next-gig')
    if (landingHero && nextGig) {
      const heroStyle = getComputedStyle(landingHero)
      const videoHeight = Math.max(0,
        landingHero.clientHeight
        - Number.parseFloat(heroStyle.paddingTop)
        - Number.parseFloat(heroStyle.paddingBottom)
        - Number.parseFloat(heroStyle.rowGap)
        - nextGig.getBoundingClientRect().height
      )
      landingHero.style.setProperty('--landing-video-height-limit', `${videoHeight}px`)
    }

    sections.forEach((section, position) => {
      // Match the existing catchLine, including its accumulated bands.
      // A 1px inset ensures fractional scroll positions cross that line.
      const catchTop = crownBottom + position * gap - EDGE_TOLERANCE_PX
      section.style.setProperty('--section-stop-top', `${catchTop}px`)
      section.style.setProperty(
        '--section-screen-height', `${Math.max(1, window.innerHeight - catchTop)}px`
      )
      const sectionStyle = getComputedStyle(section)
      const contentHeight = Math.max(1,
        window.innerHeight - catchTop
        - Number.parseFloat(sectionStyle.paddingTop)
        - Number.parseFloat(sectionStyle.paddingBottom)
      )
      section.style.setProperty('--section-content-height', `${contentHeight}px`)
      section.removeAttribute('tabindex')
      boxes[position].tabIndex = 0
      boxes[position].setAttribute('role', 'region')
      boxes[position].setAttribute('aria-label',
        `${contentSections[position].name} content`)
      section.scrollTop = 0

      if (section.id === 'listen') {
        const controls = section.querySelectorAll('.prototype-label, .media-tray')
        const controlsHeight = Array.from(controls).reduce((total, control) => {
          const controlStyle = getComputedStyle(control)
          return total + control.getBoundingClientRect().height
            + Number.parseFloat(controlStyle.marginTop)
            + Number.parseFloat(controlStyle.marginBottom)
        }, 0)
        // Keep a usable media area on very short screens; overflow remains accessible.
        section.style.setProperty('--listen-media-height',
          `${Math.max(120, contentHeight - controlsHeight)}px`)
      }
    })
    stops = [0, ...sections.map((section) =>
      section.getBoundingClientRect().top + window.scrollY
      - Number.parseFloat(section.style.getPropertyValue('--section-stop-top'))
    )]
    if (keepPosition) go(index, false, true)
    updateStickyNavigation()
  }

  const beginGesture = (direction) => ({
    index: closestStop(),
    direction,
    consumed: moving,
  })

  const moveGesture = (gesture, delta, allowTransition = true) => {
    if (gesture.consumed || moving || !allowTransition) return
    const direction = Math.sign(delta)
    gesture.consumed = true
    if (Math.abs(window.scrollY - stops[gesture.index]) > EDGE_TOLERANCE_PX) {
      go(gesture.index)
    } else if (direction === gesture.direction) {
      go(gesture.index + direction)
    }
  }

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || !event.cancelable) return
    if (!event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

    const direction = Math.sign(event.deltaY)
    const now = performance.now()
    const box = contentBoxAt(event.target)
    if (box) {
      // Native scrolling inside the box, including native wheel units.
      // Block chaining at BOTH edges, even when the box has no overflow.
      if (moving || atEdge(box, direction)) event.preventDefault()
      wheelGesture = { consumed: true }
      lastWheelTime = now
      return
    }

    event.preventDefault()
    if (!wheelGesture || now - lastWheelTime > GESTURE_GAP_MS) {
      wheelGesture = beginGesture(direction)
    }
    lastWheelTime = now
    moveGesture(wheelGesture, event.deltaY)
  }, { passive: false })

  window.addEventListener('touchstart', (event) => {
    touch = event.touches.length === 1 ? {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      lastY: event.touches[0].clientY,
      box: contentBoxAt(event.target),
      axis: null,
      gesture: null,
    } : null
  }, { passive: true })

  window.addEventListener('touchmove', (event) => {
    if (!touch || event.touches.length !== 1) return
    const point = event.touches[0]
    const dx = touch.x - point.clientX
    const dy = touch.y - point.clientY

    const deltaY = touch.lastY - point.clientY
    touch.lastY = point.clientY

    if (touch.box) {
      // The browser owns internal touch scrolling and its momentum.
      // An edge never hands this swipe to section navigation.
      if (event.cancelable && (moving ||
        (Math.abs(dy) > Math.abs(dx) && atEdge(touch.box, Math.sign(deltaY))))) {
        event.preventDefault()
      }
      return
    }

    if (!touch.axis && (dx || dy)) {
      touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      touch.gesture = beginGesture(Math.sign(dy))
    }
    if (touch.axis !== 'y' || !event.cancelable) return
    event.preventDefault()
    moveGesture(touch.gesture, dy, Math.abs(dy) >= SWIPE_THRESHOLD_PX)
  }, { passive: false })

  const endTouch = () => { touch = null }
  window.addEventListener('touchend', endTouch, { passive: true })
  window.addEventListener('touchcancel', endTouch, { passive: true })

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return
    if (event.key === ' ' && event.target.closest('button, a')) return
    const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key)
      ? (event.key === ' ' && event.shiftKey ? -1 : 1)
      : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0
    if (!direction && !['Home', 'End'].includes(event.key)) return

    const box = contentBoxAt(event.target)
    if (box) {
      const edgeDirection = event.key === 'Home' ? -1
        : event.key === 'End' ? 1 : direction
      if (moving || atEdge(box, edgeDirection)) event.preventDefault()
      return
    }

    event.preventDefault()
    if (event.repeat || moving) return
    if (event.key === 'Home' || event.key === 'End') {
      go(event.key === 'End' ? stops.length - 1 : 0)
    } else moveGesture(beginGesture(direction), direction)
  })

  const hashIndex = () => location.hash === '#top' || !location.hash ? 0
    : sections.findIndex((section) => `#${section.id}` === location.hash) + 1

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey
      || event.metaKey || event.shiftKey || event.altKey) return
    const link = event.target.closest('a[href]')
    if (!link || link.hasAttribute('download') || link.target === '_blank') return
    const hash = link.getAttribute('href')
    const index = hash === '#top' ? 0
      : sections.findIndex((section) => `#${section.id}` === hash) + 1
    if (hash !== '#top' && index === 0) return
    event.preventDefault()
    if (location.hash !== hash) history.pushState(null, '', hash)
    wheelGesture = null
    go(index, true)
  })

  window.addEventListener('hashchange', () => go(hashIndex(), true))
  window.addEventListener('popstate', () => go(hashIndex(), true))

  // Scrollbar dragging and focus-driven document scrolling still settle
  // on a section. The document remains the original scrolling page.
  window.addEventListener('scroll', () => {
    window.clearTimeout(settleTimer)
    if (!moving) settleTimer = window.setTimeout(() => {
      if (!touch && Math.abs(window.scrollY - stops[closestStop()]) > 1) {
        go(closestStop())
      }
    }, GESTURE_GAP_MS)
  }, { passive: true })

  const queueMeasure = () => {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(() => measure())
  }
  window.addEventListener('resize', queueMeasure)
  window.addEventListener('load', queueMeasure)
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(queueMeasure)
    observer.observe(stickyPrimaryNav)
    observer.observe(brandSticky)
    observer.observe(qMark)
    const landing = document.querySelector('.landing')
    if (landing) observer.observe(landing)
  }

  measure(false)
  go(location.hash ? hashIndex() : closestStop(), false, true)
}