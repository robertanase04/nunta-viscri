import { useCallback, useState } from 'react'
import { CardUnfold, SEEN_KEY, shouldPlayIntro } from './components/CardUnfold/CardUnfold'
import { RouteLine } from './components/RouteLine/RouteLine'
import { Section } from './components/Section/Section'
import { Programme } from './components/Programme/Programme'
import { CompassStar, Divider, Rosette, Swallow } from './components/Ornament'
import { InkLayer } from './components/Illustration/InkLayer'
import { useLenis } from './hooks/useLenis'
import './styles/page.css'

export function App() {
  const [introPlaying, setIntroPlaying] = useState(() => shouldPlayIntro())
  useLenis()

  const replay = useCallback(() => {
    sessionStorage.removeItem(SEEN_KEY)
    window.scrollTo({ top: 0 })
    setIntroPlaying(true)
  }, [])

  return (
    <>
      <div className="paper-vignette" />

      {introPlaying && <CardUnfold onDone={() => setIntroPlaying(false)} />}

      <div className="page">
        <RouteLine />

        <header className="masthead">
          <p className="caps caps-wide masthead-kicker">Viscri, Transilvania</p>
          <h1 className="masthead-name">
            Isabella <span className="amp">&amp;</span> Alin
          </h1>
          <p className="caps masthead-dates">04 · 05 · 06 septembrie 2026</p>
          <CompassStar className="masthead-star" />
        </header>

        <main>
          <Section id="povestea" stop="01" title="Povestea" side="left">
            <p data-reveal>
              Ne-am cunoscut pe două biciclete, la capătul unui drum care nu ducea
              nicăieri anume. De atunci am pedalat prin destule locuri, dar în Viscri
              ne-am tot întors — pentru liniștea de la ora șase seara, pentru dealurile
              care nu se termină și pentru oamenii care ne-au primit ca și cum ne-ar fi
              știut dintotdeauna.
            </p>
            <p data-reveal>
              Ne căsătorim aici, în septembrie. Nu într-o zi, ci în trei — pentru că
              drumul până în Viscri e lung și ar fi păcat să-l faceți degeaba.
            </p>
          </Section>

          <Section id="programul" stop="02" title="Programul" side="right">
            <p data-reveal>
              Trei zile, fără grabă. Nimic nu e obligatoriu în afară de sâmbătă la patru.
            </p>
            <Programme />
          </Section>

          <Section id="viscri" stop="03" title="Viscri" side="left">
            <p data-reveal>
              Un sat săsesc de vreo șaptezeci de case, cu o biserică fortificată din
              secolul al XIII-lea în mijloc. Nu are semafor, nu are supermarket și, în
              cele mai bune seri, nu are nici semnal. Cununia va fi în curtea bisericii.
            </p>

            <div className="figure" data-reveal>
              <InkLayer
                name="layer-castle"
                alt="Biserica fortificată din Viscri, văzută dinspre deal"
                sizes="(max-width: 720px) 90vw, 46vw"
              />
              <p className="caps figure-caption">Cetatea, dinspre miazăzi</p>
            </div>

            <dl className="facts" data-reveal>
              <div>
                <dt className="caps">Cum ajungeți</dt>
                <dd>
                  3 ore cu mașina din București, 1 oră și jumătate din Sibiu, 40 de minute
                  din Sighișoara. Ultimii 7 kilometri sunt de piatră — se merge încet, dar
                  se merge cu orice mașină.
                </dd>
              </div>
              <div>
                <dt className="caps">Unde dormiți</dt>
                <dd>
                  Am ținut pentru voi camere în casele din sat. Scrieți-ne în formularul de
                  mai jos câte locuri vă trebuie și ne ocupăm noi de rest.
                </dd>
              </div>
            </dl>
          </Section>

          <Section id="detalii" stop="04" title="Câteva lucruri practice" side="right">
            <dl className="facts" data-reveal>
              <div>
                <dt className="caps">Cum ne îmbrăcăm</dt>
                <dd>
                  Elegant, dar cu picioarele pe pământ — la propriu. Curtea bisericii e cu
                  iarbă, iar drumul până acolo e de piatră. Lăsați tocurile subțiri acasă și
                  veți fi mult mai fericiți la miezul nopții.
                </dd>
              </div>
              <div>
                <dt className="caps">Ce merită pus în bagaj</dt>
                <dd>
                  Ceva gros pentru seară — în septembrie, la ora unsprezece, dealurile își
                  aduc aminte că e toamnă. Pantofi comozi pentru duminică. Și un aparat de
                  fotografiat, dacă mai aveți unul cu film.
                </dd>
              </div>
              <div>
                <dt className="caps">Copiii</dt>
                <dd>Sunt bineveniți toți. Curtea e mare și avem pe cine să ne bazăm.</dd>
              </div>
              <div>
                <dt className="caps">Daruri</dt>
                <dd>
                  Prezența voastră e destul. Dacă totuși insistați, ne strângem pentru un
                  acoperiș nou la casa din sat.
                </dd>
              </div>
            </dl>
          </Section>

        </main>

        <footer className="colophon">
          <Swallow className="colophon-bird" />
          <Divider className="colophon-rule" />
          <blockquote className="colophon-quote">
            Cele mai bune drumuri
            <br />
            sunt cele pe care le facem împreună.
          </blockquote>
          <Divider className="colophon-rule" />

          <InkLayer
            name="haystacks"
            alt=""
            sizes="(max-width: 720px) 60vw, 280px"
            className="colophon-hay"
          />

          <p className="caps caps-wide colophon-place">Viscri, Transilvania</p>

          <button type="button" className="caps replay" onClick={replay}>
            Revezi deschiderea
          </button>

          <Rosette className="colophon-rosette" />
        </footer>
      </div>

      <div className="paper-grain" />
    </>
  )
}
