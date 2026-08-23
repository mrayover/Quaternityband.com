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

}