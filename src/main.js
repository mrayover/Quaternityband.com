/* ============================================================
   QUATERNITY — PROGRESSIVE STACKING NAVIGATION
   ============================================================ */


/*
  The original gates remain part of normal document flow.

  This script does NOT move them.

  Instead, it progressively reveals fixed-position copies as
  each original gate reaches its assigned resting position
  beneath the Q.

  Because each fixed copy measures its source gate directly,
  changes to frame widths, ray spacing, or responsive layout
  automatically carry through to the sticky navigation.
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
    Collect the fixed navigation items in their intended
    stacking order:
    Quaternity → Gigs → About → Listen → Contact
  */
  const stickyItems =
    Array.from(
      stickyStack.querySelectorAll('[data-sticky-for]')
    )


  /*
    Collect the four fixed ray bands.
  */
  const stickyRayItems =
    Array.from(
      stickyRays.querySelectorAll('[data-sticky-ray-for]')
    )


  /*
    The original landing element defines the exact dimensions
    of the fixed yellow center inside the persistent crown.
  */
  const landingSource =
    document.querySelector('.landing')


  /*
    Map each fixed ray to the original frame whose top edge it
    visually duplicates.

    The original nested frame remains the source of truth.
  */
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
    Build a map between each name and its ORIGINAL gate in
    normal document flow.

    Example:
    "gigs" → the original blue Gigs banner.
  */
  const sourceGates =
    new Map(
      Array.from(
        document.querySelectorAll('[data-gate]')
      ).map(
        (gate) => [
          gate.dataset.gate,
          gate,
        ]
      )
    )


  /*
    Quaternity contains more than a single word now.

    Copy the actual contents of the original brand bar into the
    fixed version so YouTube / Quaternity / Instagram remain one
    object and there is only one visual source of truth.
  */
  const brandSource =
    sourceGates.get('brand')


  const brandSticky =
    stickyStack.querySelector(
      '[data-sticky-for="brand"]'
    )


  if (brandSource && brandSticky) {
    brandSticky.innerHTML =
      brandSource.innerHTML
  }


  /*
    Prevent scroll events from performing repeated layout work
    faster than the browser can draw it.
  */
  let updateQueued =
    false


  const updateStickyStack = () => {

    /*
      The fixed Q determines the permanent bottom edge of the
      entire header crown.
    */
    const qRect =
      qMark.getBoundingClientRect()


    const shelfTop =
      qRect.bottom


    /*
      Keep the Q shelf permanently aligned with the Q.
    */
    qShelf.style.top =
      `${shelfTop}px`


    /*
      Measure the fixed nested rays now, but do not decide their
      bottom edge yet.

      Their final height depends on how many navigation bands
      have accumulated beneath the Q.
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
        })

      }
    )


    /*
      Fill the innermost portion of the permanent crown with the
      same yellow field used by the landing page.
    */
    if (landingSource) {

      const landingRect =
        landingSource.getBoundingClientRect()


      const stableLandingTop =
        landingRect.top + window.scrollY


      stickyCrownCore.style.top =
        `${stableLandingTop}px`


      stickyCrownCore.style.left =
        `${landingRect.left}px`


      stickyCrownCore.style.width =
        `${landingRect.width}px`


      stickyCrownCore.style.height =
        `${Math.max(
          0,
          shelfTop - stableLandingTop
        )}px`

    }


    let nextTop =
      shelfTop

    /*
      Later items may only join after every item before them has
      already joined.

      This guarantees the order can never become:
      Quaternity → About
      while Gigs is somehow missing.
    */
    let previousItemIsActive =
      true


    stickyItems.forEach(
      (stickyItem) => {

        const gateName =
          stickyItem.dataset.stickyFor


        const sourceGate =
          sourceGates.get(gateName)


        if (!sourceGate) {
          stickyItem.classList.remove(
            'is-active'
          )

          previousItemIsActive =
            false

          return
        }


        /*
          Measure the REAL original gate.

          This gives the fixed copy the exact same horizontal
          placement and width as the geometry currently rendered
          by the browser.
        */
        const sourceRect =
          sourceGate.getBoundingClientRect()


        /*
          Every accumulated item keeps the exact width and
          horizontal position of its original gate.

          This preserves the nested color structure naturally:
          the yellow Quaternity band remains inside the blue
          Gigs frame, leaving the blue ray visible on both sides.
        */
        stickyItem.style.left =
          `${sourceRect.left}px`


        stickyItem.style.width =
          `${sourceRect.width}px`


        stickyItem.style.top =
          `${nextTop}px`


        /*
          A gate becomes persistent once its original top edge
          reaches the next available stacking position.
        */
        const shouldStick =
          previousItemIsActive
          && sourceRect.top <= nextTop


        stickyItem.classList.toggle(
          'is-active',
          shouldStick
        )


        /*
          Once an item joins the stack, the next gate receives
          the position directly beneath it.
        */
        if (shouldStick) {

          const itemBottom =
            nextTop
            + stickyItem.offsetHeight

          nextTop =
            itemBottom

        } else {

          previousItemIsActive =
            false

        }

      }
    )


    /*
      Extend the complete nested color structure to the bottom
      of the currently accumulated navigation stack.

      Because the sticky headings sit above this layer, each
      heading replaces only the center of its corresponding ray
      while the outer colors continue naturally down its sides.
    */
    const stackBottom =
      nextTop


    stickyRays.style.height =
      `${stackBottom}px`


    rayGeometry.forEach(
      ({
        stickyRay,
        stableTop,
      }) => {

        stickyRay.style.height =
          `${Math.max(
            0,
            stackBottom - stableTop
          )}px`

      }
    )


    updateQueued =
      false
  }


  /*
    Schedule one update for the next browser paint rather than
    doing layout calculations directly inside every scroll event.
  */
  const queueStickyUpdate = () => {

    if (updateQueued) {
      return
    }


    updateQueued =
      true


    window.requestAnimationFrame(
      updateStickyStack
    )
  }


  /*
    Scroll:
    determine which gates have reached the stack.

    Resize:
    re-measure widths and horizontal positions.

    Load:
    catches restored scroll positions and initial layout.
  */
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
    If content later changes size because of loaded images,
    embeds, calendar data, etc., automatically re-check the
    geometry.

    This prevents us having to revisit the stacking engine when
    real content replaces the placeholders.
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


  /*
    Establish the correct state immediately.
  */
  updateStickyStack()

}