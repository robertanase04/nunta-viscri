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
          <Section id="povestea" stop="01" title="Casa Tănase" side="left">
            <p data-reveal>
              Ne-am cunoscut la cabinet, nu pe biciclete, însă timpul liber și
              vacanțele ne-au fost facilitate de biciclete încă din august 2021. De
              atunci ne-am vândut mașina și nu prea am mai coborât de pe ele. Am pedalat
              prin destule locuri, dar pe colinele dintre Saschiz și Viscri ne-am tot
              întors — pentru drumurile de pământ care nu duc nicăieri anume, pentru
              liniștea de la amiază, dar mai ales pentru oamenii care însuflețesc și
              îngrijesc această bucată din Transilvania. Îi veți cunoaște și voi pe o
              parte dintre ei.
            </p>
            <p data-reveal>
              Ne căsătorim aici, în septembrie. Nu într-o zi, ci în trei — pentru că
              drumul până la noi e lung și ar fi păcat să-l faceți degeaba.
            </p>

            <div className="figure figure-plain" data-reveal>
              <InkLayer
                name="tandem"
                alt="Cei doi miri pe tandem, sub stema Casei Tănase"
                sizes="(max-width: 720px) 70vw, 22rem"
              />
            </div>
          </Section>

          <Section id="programul" stop="02" title="Trei zile, trei sate săsești" side="right">
            <Programme />
          </Section>

          <Section id="locurile" stop="03" title="Locuri" side="left">
            <p data-reveal>
              Trei popasuri, trei zile diferite în trei sate săsești vecine. Pe toate le
              îndrăgim la fel de tare — nu ne-am putut decide la unul singur!
            </p>

            <div className="places" data-reveal>
              <figure className="place">
                <InkLayer
                  name="cetatea"
                  alt="Cetatea țărănească din Saschiz, văzută de sus"
                  sizes="(max-width: 720px) 80vw, 17rem"
                />
                <figcaption>
                  <span className="caps place-name">Saschiz</span>
                  <span className="place-note">
                    Veți fi aduși la Castle View, o casă săsească de la 1816, de unde vom
                    porni pe deal la Cetatea Țărănească Saschiz. Acolo spunem „DA”
                    răspicat și revenim la Castle View pentru o cină tradițională și o
                    petrecere de warm-up.
                  </span>
                </figcaption>
              </figure>

              <figure className="place">
                <InkLayer
                  name="casa-viscri"
                  alt="Casa săsească din Viscri de unde pornește alaiul"
                  sizes="(max-width: 720px) 80vw, 17rem"
                />
                <figcaption>
                  <span className="caps place-name">Viscri</span>
                  <span className="place-note">
                    Pornim de la Viscri 9, o casă săsească la cotitură pe ulița
                    principală. La Biserica Fortificată din Viscri ne vom împreuna
                    destinele și în temei spiritual. Apoi, cu tot alaiul, ajungem la
                    Viscri 125 unde — sperăm noi! — petrecem până dimineața.
                  </span>
                </figcaption>
              </figure>

              <figure className="place">
                <InkLayer
                  name="bike-inn"
                  alt="Bike Checkinn, punctul de plecare pentru tura de duminică"
                  sizes="(max-width: 720px) 80vw, 17rem"
                />
                <figcaption>
                  <span className="caps place-name">Bunești</span>
                  <span className="place-note">
                    A treia zi, după micul dejun, ne întâlnim la Bike Checkinn să ne
                    dregem cu cafea și limonade. Pe la unu-două dăm o tură cu bicicleta,
                    cât ne țin pedalele. Revenim la Bike Checkinn să ne îndopăm cu
                    gustări locale și, spre seară, încercuim un foc de tabără pe fundal
                    de muzică folk.
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
                  rămâneți și ne ocupăm de rest. Micul dejun va fi inclus sau opțional.
                </dd>
              </div>
              <div>
                <dt className="caps">Veniți cu copiii</dt>
                <dd>
                  Fiecare activitate din weekend e gândită să îi includă și pe ei.
                  Curțile sunt mari și avem pe cine ne baza să îi distreze.
                </dd>
              </div>
              <div>
                <dt className="caps">Dress code: „Albastru de Saschiz”</dt>
                <dd>
                  Albastrul de pe ceramica de Saschiz, în ce nuanță vă place. Purtați
                  ceva ușor și comod — se merge pe iarbă și pe piatră, iar seara, în
                  septembrie, dealurile își aduc aminte că e toamnă.
                </dd>
              </div>
              <div>
                <dt className="caps">Speech sau toast</dt>
                <dd>
                  Invitație deschisă pentru a împărtăși o poveste, un sfat, o glumă sau o
                  poză amuzantă cu noi. Cei fără frică de dentist sau de vorbit în public,
                  anunțați-o pe Cătălina Popoviciu în prealabil.
                </dd>
              </div>
              <div>
                <dt className="caps">Restricții alimentare sau muzicale?</dt>
                <dd>Let us know.</dd>
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
            name="cuplu-camp"
            alt="Cei doi miri pe un câmp de păpădii, cu bicicleta alături"
            sizes="(max-width: 720px) 78vw, 26rem"
            className="colophon-couple"
          />

          <Divider className="colophon-rule" />

          <p className="caps caps-wide colophon-place">Saschiz · Viscri · Bunești</p>

          <Rosette className="colophon-rosette" />
        </footer>
      </div>

      <div className="paper-grain" />
    </>
  )
}
