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
import './styles/page.css'

gsap.registerPlugin(ScrollTrigger)

export function App() {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const overlay = useRef<HTMLDivElement>(null)

  // The page does not scroll until the invitation has been opened.
  useLenis(open)

  const onOpen = useCallback(() => setOpen(true), [])

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
          <p className="caps caps-wide masthead-kicker">Pe colinele Transilvaniei</p>
          <h1 className="masthead-name">
            Noi doi, <span className="amp">vă chemăm</span> pe voi
          </h1>
          <p className="caps masthead-dates">
            04 <span className="dot">·</span> 05 <span className="dot">·</span> 06 septembrie 2026
          </p>
          <CompassStar className="masthead-star" />
        </header>

        <main>
          <Section id="povestea" stop="01" title="Casa Tanase" side="left">
            <p data-reveal>
              Ne-am cunoscut pe două biciclete și de atunci nu prea am mai coborât de
              pe ele. Am pedalat prin destule locuri, dar pe colinele dintre Saschiz și
              Viscri ne-am tot întors — pentru drumurile de pământ care nu duc nicăieri
              anume, pentru cetatea de pe deal și pentru liniștea de la ora șase seara.
            </p>
            <p data-reveal>
              Ne căsătorim aici, în septembrie. Nu într-o zi, ci în trei — pentru că
              drumul până la noi e lung și ar fi păcat să-l faceți degeaba.
            </p>

            <div className="figure figure-plain" data-reveal>
              <InkLayer
                name="tandem"
                alt="Isabella și Alin pe tandem, sub stema Casei Tanase"
                sizes="(max-width: 720px) 70vw, 22rem"
              />
            </div>
          </Section>

          <Section id="programul" stop="02" title="Trei zile" side="right">
            <p data-reveal>
              Nimic nu e obligatoriu în afară de sâmbătă la două și jumătate. Restul e
              la îndemâna voastră.
            </p>
            <Programme />
          </Section>

          <Section id="locurile" stop="03" title="Locurile" side="left">
            <p data-reveal>
              Trei popasuri, la câțiva kilometri unul de altul, pe cele mai frumoase
              drumuri din zonă.
            </p>

            <div className="places" data-reveal>
              <figure className="place">
                <InkLayer
                  name="cetatea"
                  alt="Cetatea fortificată din Saschiz, văzută de sus"
                  sizes="(max-width: 720px) 80vw, 17rem"
                />
                <figcaption>
                  <span className="caps place-name">Cetatea Saschiz</span>
                  <span className="place-note">
                    Biserica fortificată din secolul al XV-lea. Aici ne vedem vineri, la
                    Castle View, pentru cununia civilă.
                  </span>
                </figcaption>
              </figure>

              <figure className="place">
                <InkLayer
                  name="casa-viscri"
                  alt="Casa săsească din Viscri unde are loc petrecerea"
                  sizes="(max-width: 720px) 80vw, 17rem"
                />
                <figcaption>
                  <span className="caps place-name">Viscri 9</span>
                  <span className="place-note">
                    O casă săsească pe uliță în sus. Sâmbătă e ziua cea mare: cununia
                    religioasă, masa festivă și chef până se face lumină.
                  </span>
                </figcaption>
              </figure>

              <figure className="place">
                <InkLayer
                  name="bike-inn"
                  alt="Bike Check-Inn, punctul de plecare pentru tura de duminică"
                  sizes="(max-width: 720px) 80vw, 17rem"
                />
                <figcaption>
                  <span className="caps place-name">Bike Check-Inn</span>
                  <span className="place-note">
                    Duminică la prânz, cu cafea din dubă și biciclete pentru cine mai
                    are putere de pedalat.
                  </span>
                </figcaption>
              </figure>
            </div>
          </Section>

          <Section id="detalii" stop="04" title="Ce e bine să știți" side="right">
            <dl className="facts" data-reveal>
              <div>
                <dt className="caps">Mașina rămâne la cazare</dt>
                <dd>
                  Transportul îl asigurăm noi tot weekendul, între cazare și fiecare
                  popas. Inclusiv bicicletele — nu trebuie să veniți cu ale voastre.
                </dd>
              </div>
              <div>
                <dt className="caps">Cazările sunt deja rezervate</dt>
                <dd>
                  Nu trebuie să căutați nimic. Spuneți-ne doar câte nopți vreți să
                  rămâneți și ne ocupăm de rest.
                </dd>
              </div>
              <div>
                <dt className="caps">Veniți cu copiii</dt>
                <dd>
                  Fiecare activitate din weekend e gândită să meargă și cu ei. Curțile
                  sunt mari și avem pe cine ne baza.
                </dd>
              </div>
              <div>
                <dt className="caps">Dress code: „Albastru de Saschiz”</dt>
                <dd>
                  Albastrul de pe invitație, în ce nuanță vă place. Purtați ceva ușor și
                  comod — se merge pe iarbă și pe piatră, iar seara, în septembrie,
                  dealurile își aduc aminte că e toamnă.
                </dd>
              </div>
            </dl>

            <div className="figure figure-plain" data-reveal>
              <InkLayer
                name="indicatoare"
                alt="Indicator rutier spre Viscri, Saschiz și Bunești"
                sizes="(max-width: 720px) 55vw, 13rem"
              />
            </div>
          </Section>
        </main>

        <footer className="colophon">
          <InkLayer
            name="cuplu-inima"
            alt="Cele mai frumoase ture sunt cele pe care le facem împreună cu voi"
            sizes="(max-width: 720px) 70vw, 20rem"
            className="colophon-heart"
          />

          <Divider className="colophon-rule" />

          <InkLayer
            name="satul"
            alt=""
            sizes="(max-width: 720px) 60vw, 16rem"
            className="colophon-village"
          />

          <p className="caps caps-wide colophon-place">Viscri · Saschiz · Bunești</p>

          <Rosette className="colophon-rosette" />
        </footer>
      </div>

      <div className="paper-grain" />
    </>
  )
}
