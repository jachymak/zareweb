// Guides for leaders (SPEC §4.11) — static content. `steps` and `note` are
// formatted text (<b>, <i>, <a href>, §4.4).

const HELP = 'https://napoveda.skaut.cz/skautis/jednotka/google'

// Shown above the guides.
export const GUIDES_NOTE =
  'Po každé změně ve skautISu (děti, vedoucí, kontakty) je potřeba web <b>synchronizovat ze skautISu</b> a <b>nahrát nový export osob</b> — obojí v Administraci → skautIS. Web si změny sám nenačte. Konference se aktualizuje sama každou noc.'

export const GUIDES = [
  {
    id: 'konference',
    title: 'E-mailová konference oddílu ve skautISu',
    intro:
      'Každý oddíl má svou konferenci (vlcusky@skaut.cz, skauti-skautky@skaut.cz). Členy do ní skautIS doplňuje sám podle pravidel — rodiče dětí a všechny vedoucí oddílu. Dětem samotným maily nechodí. Pravidla nastavuje správce oddílu ve skautISu.',
    steps: [
      'Ve skautISu otevři <b>Moje → Moje jednotka</b> (oddíl, ne středisko) → záložka <b>Google služby</b> → <b>Skupiny (konference)</b> a otevři detail konference.',
      'Na záložce <b>Automatická pravidla</b> nastav, že synchronizace osoby <b>přidává i odebírá</b>, a dej <b>Uložit</b>. Pak se z konference samy smažou i adresy dětí, které odešly.',
      '<b>Rodiče dětí:</b> „Vytvořit nové pravidlo“ (třeba „Rodiče“), úroveň <b>Pouze osoby z mé jednotky</b>, „Jedná se o funkci“ <b>Ne</b>. V detailu pravidla přidej typy kontaktu <b>E-mail matky</b>, <b>E-mail otce</b> a <b>E-mail jiného zákonného zástupce</b> a kategorie členství oddílu — u vlčušek <b>Vlče</b> a <b>Světluška</b>, u skautů <b>Skaut</b> a <b>Skautka</b>.',
      '<b>Vedoucí:</b> druhé pravidlo (třeba „Vedoucí“), úroveň <b>Pouze osoby z mé jednotky</b>, typ kontaktu <b>Hlavní e-mail osoby</b> — tak, aby v něm byli všichni vedoucí oddílu: podle funkce („Jedná se o funkci“ <b>Ano</b> — vedoucí oddílu, zástupce, rádci…), nebo podle kategorií <b>Rover</b> a <b>Ranger</b>.',
      '<b>Chtějí rodiče maily i pro dítě?</b> E-mail dítěte zůstává v jeho kontaktech, a navíc ho v záložce <b>Rodina</b> zopakuj jako zákonného zástupce <b>Jiný</b> s popisem <b>dítě</b> (jméno dítěte, jeho e-mail). Do konference se tak dostane pravidlem rodičů (E-mail jiného zákonného zástupce); web z toho pozná, že na e-mail dítěte mají chodit i e-maily o akcích — rodičem ho nedělá.',
      '<b>Vedoucí z druhého oddílu</b>, kteří chtějí dostávat i tuhle konferenci, přidej ručně: záložka <b>Členové</b> → <b>Přidání členů emailovou adresou</b>. Ručně přidané adresy synchronizace nikdy neodebere.',
      'Dole v sekci <b>Synchronizace</b> dej <b>Vynutit synchronizaci</b> a zkontroluj členy konference. Jinak se konference aktualizuje sama každou noc.',
    ],
    note: `Podrobně v nápovědě skautISu: <a href="${HELP}/automaticke-pridani-clenu-skupiny">automatická pravidla</a>, <a href="${HELP}/automaticka-pravidla-priklady">příklady pravidel</a>, <a href="${HELP}/pridani-clenu-skupiny">ruční přidání členů</a>.`,
  },
  {
    id: 'rodic-nechce-maily',
    title: 'Rodič nechce dostávat e-maily z konference',
    intro:
      'Kontakt na rodiče chceme mít dál (vedoucí ho mají v Kontaktech a v telefonu), jen mu nemají chodit hromadné maily — z konference ani z webu. E-mail rodiče proto patří jen do poznámky, ne mezi jeho kontakty.',
    steps: [
      'Ve skautISu otevři dítě → záložka <b>Rodina</b>. E-mail od rodiče smazat nejde, a tak rodiče <b>smaž</b> a přidej znovu („Přidat zákonného zástupce“, „Existující osoba“ <b>Ne</b>): jméno, příjmení, telefon jako kontakt a e-mail <b>jen do poznámky</b>.',
      'Má rodič u nás víc dětí? Udělej to u každého z nich.',
      'V konferenci oddílu dej <b>Vynutit synchronizaci</b> (nebo počkej do druhého dne) a zkontroluj, že adresa z členů zmizela.',
      'Stáhni nový export osob a nahraj ho na web (Administrace → skautIS → Kontakty z exportu). Web pak e-mail z poznámky ukáže vedoucím i rodičům, ale e-maily o akcích na něj neposílá.',
    ],
    note: 'Pozor u rodiče propojeného s existující osobou ve skautISu (má vlastní účet, je třeba sám vedoucí): smazáním se propojení zruší. Zpátky to vrátíš tak, že e-mail rodiči zase přidáš jako kontakt.',
  },
]
