import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CardUnfold } from './components/CardUnfold/CardUnfold'
import { RouteLine } from './components/RouteLine/RouteLine'
import { Section } from './components/Section/Section'
import { Programme } from './components/Programme/Programme'
import { CompassStar, Divider, Rosette } from './components/Ornament'
import { InkLayer } from './components/Illustration/InkLayer'
import { useLenis } from './hooks/useLenis'
import { useReducedMotion } from './hooks/useReducedMotion'
import { T } from './copy'
import './styles/page.css'

gsap.registerPlugin(ScrollTrigger)

export function App() {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const overlay = useRef<HTMLDivElement>(null)

  // The page does not scroll until the invitation has been opened.
  useLenis(open)

  const onOpen = useCallback(() => setOpen(true), [])

  /* The document's own language and metadata. These live in index.html for
     Romanian, which is what a crawler or a link preview sees first; on /en
     the same markup is served, so they are corrected here. */
  useEffect(() => {
    document.documentElement.lang = T.htmlLang
    document.title = T.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', T.description)
  }, [])

  /* A real lock while the card is shut. Withholding the smooth-scroll
     instance is not enough on its own — native scrolling still works, so
     the page could be pushed out from under an unopened invitation. */
  useEffect(() => {
    if (open) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [open])

  /* Once open, the card is handed to the scroll: it lifts and fades over
     the first screen height while the page rises underneath. This is what
     replaces the dismiss button — you leave the invitation by reading on,
     not by closing it. */
  useEffect(() => {
    if (!open) return

    /* Reduced motion gets no scroll-driven fade, so the card has to be
       dismissed outright.

       Leaving this to the early return below was a bug that hid the entire
       site from anyone browsing with reduced motion switched on: the page
       unlocked and scrolled underneath, but the only thing that ever
       removed the fixed overlay was the ScrollTrigger this branch skips.
       The invitation stayed put and the scrollbar moved on its own. */
    if (reduced) {
      const tween = gsap.to(overlay.current, {
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.inOut',
      })
      return () => {
        tween.kill()
      }
    }

    const ctx = gsap.context(() => {
      gsap.to(overlay.current, {
        autoAlpha: 0,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.intro-spacer',
          start: 'top top',
          end: 'bottom 25%',
          scrub: 0.5,
        },
      })
    })

    /* A backstop, because the failure mode here is losing the whole site
       rather than losing an effect. If the scrub has not taken the overlay
       away by the time the reader is well past it, take it away. This only
       ever hides, so it cannot fight the scrub on the way back up. */
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.25 && overlay.current) {
        gsap.set(overlay.current, { autoAlpha: 0 })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // The route measures itself against document height, which only
    // settles once the lock is lifted and the page has its real length.
    ScrollTrigger.refresh()
    return () => {
      window.removeEventListener('scroll', onScroll)
      ctx.revert()
    }
  }, [open, reduced])

  return (
    <>
      <div className="paper-vignette" />

      <div className="intro-overlay" ref={overlay}>
        <CardUnfold onOpen={onOpen} />
      </div>

      <div className="page" data-open={open}>
        {/* The screen height you scroll through to leave the card behind. */}
        <div className="intro-spacer" aria-hidden />

        <RouteLine />

        <header className="masthead">
          <p className="caps caps-wide masthead-kicker">{T.masthead.kicker}</p>
          <h1 className="masthead-name">
            {T.masthead.nameBefore} <span className="amp">{T.masthead.nameAccent}</span>{' '}
            {T.masthead.nameAfter}
          </h1>
          <p className="caps masthead-dates">
            04 <span className="dot">·</span> 05 <span className="dot">·</span> 06{' '}
            {T.masthead.dates}
          </p>
          <CompassStar className="masthead-star" />
        </header>

        <main>
          <Section id="povestea" stop="01" title={T.story.title} side="left">
            {T.story.paragraphs.map((text) => (
              <p key={text.slice(0, 24)} data-reveal>
                {text}
              </p>
            ))}

            <div className="figure figure-plain" data-reveal>
              <InkLayer
                name="tandem"
                alt={T.story.altEmblem}
                sizes="(max-width: 720px) 70vw, 22rem"
              />
            </div>
          </Section>

          <Section id="programul" stop="02" title={T.programme.title} side="right">
            <Programme />
          </Section>

          <Section id="locurile" stop="03" title={T.places.title} side="left">
            <p data-reveal>{T.places.intro}</p>

            <div className="places" data-reveal>
              {T.places.items.map((place, i) => (
                <figure key={place.name} className="place">
                  <InkLayer
                    name={(['cetatea', 'casa-viscri', 'bike-inn'] as const)[i]!}
                    alt={T.places.alts[i]!}
                    sizes="(max-width: 720px) 80vw, 17rem"
                  />
                  <figcaption>
                    <span className="caps place-name">{place.name}</span>
                    <span className="place-note">{place.note}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>

          <Section id="detalii" stop="04" title={T.details.title} side="right">
            <dl className="facts" data-reveal>
              {T.details.facts.map((fact) => (
                <div key={fact.term}>
                  <dt className="caps">{fact.term}</dt>
                  <dd>{fact.detail}</dd>
                </div>
              ))}
            </dl>

            <div className="figure figure-plain" data-reveal>
              <InkLayer
                name="indicatoare"
                alt={T.details.altSignpost}
                sizes="(max-width: 720px) 55vw, 13rem"
              />
            </div>
          </Section>
        </main>

        <footer className="colophon">
          <InkLayer
            name="cuplu-camp"
            alt={T.colophon.altCouple}
            sizes="(max-width: 720px) 78vw, 26rem"
            className="colophon-couple"
          />

          <Divider className="colophon-rule" />

          <p className="caps caps-wide colophon-place">{T.colophon.villages}</p>

          <Rosette className="colophon-rosette" />
        </footer>
      </div>

      <div className="paper-grain" />
    </>
  )
}
