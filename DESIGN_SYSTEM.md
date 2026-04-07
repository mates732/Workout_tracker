# VPULZ Workout Logger — Design System & Specification

## Design System

### Barevná paleta

|Token |Hex / Hodnota |Použití |
|------------|------------------------|------------------------------------------|
|`bg` |`#1B1212` |Hlavní pozadí (deep black) |
|`bgDark` |`#0F0F0F` |Tmavší vrstvy |
|`bgDeep` |`#0A0A0A` |Nejhlubší pozadí, top bar |
|`card` |`rgba(255,255,255,0.07)`|Karty cviků |
|`cardBorder`|`rgba(255,255,255,0.1)` |Okraje karet |
|`text` |`#F9F6EE` |Primární text (bone white) |
|`textMuted` |`rgba(249,246,238,0.5)` |Sekundární text |
|`textDim` |`rgba(249,246,238,0.25)`|Popisky, labely |
|`accent` |`#F9F6EE` |Tlačítka, názvy cviků, CTA |
|`green` |`#AFE1AF` |Dokončený set (celý řádek) |
|`danger` |`#E05A3A` |Destructive akce (delete, discard, remove)|

### Gradienty

Pozadí aplikace i home screenu používá diagonální gradient:
`linear-gradient(155deg, #0A0A0A 0%, #1B1212 55%, #0F0F0F 100%)`

Top bar: `rgba(10,10,10,0.94)` + `backdropFilter: blur(20px)`

### Typografie

- Font: `-apple-system, 'SF Pro Display', sans-serif`
- Labely sloupců: uppercase, 10px, fontWeight 800
- Titulky v bottom sheetu: bold (`<strong>`)
- Hodnoty v inputech: 14px, fontWeight 700
- Ikony: výhradně SVG, žádné emoji

-----

## Screeny

### 1. Active Workout — Blank Start

Výchozí stav při startu prázdného workoutu.

**Prvky:**

- **Top Bar** (sticky)
  - Minimize button + "Log Workout" (vlevo)
  - Elapsed timer — kompaktní, jako Apple Dynamic Island (střed)
  - Finish button (vpravo)

- **Main Area** (prázdné)
  - Velké tlačítko **"+ Add Exercise"** (centrované)

**Chování:**
- Klik na "Add Exercise" → otevře Exercise Picker Bottom Sheet
- Výběr cviku → přidá se do seznamu s jedním prázdným setem
- Workout běží continuálně (timer se inkrementuje)

---

### 2. Exercise Card (Prázdný Set)

Každé cvičení je karta s těmito prvky:

**Header:**
- Kruhový avatar s iniciálami
- Název cviku — bone white, bold, **klikatelný** → Exercise Detail
- ⋮ menu → Exercise Action Bottom Sheet

**Sub-header:**
- Inline notes field (placeholder "Add notes here…")
- Rest Timer toggle — cykluje: OFF → 60s → 90s → 120s → OFF

**Set Tabulka (1. set — prázdný):**

|Sloupec |Obsah |Funkce |
|--------|------|-------|
|SET |`1` (číslo) |Zobrazuje se normálně, zatím bez kliknutí |
|PREVIOUS |— |Skryto (nevím z čeho) |
|KG |Input field |`inputMode="decimal"`, placeholder "0" |
|REPS |Input field |`inputMode="numeric"`, placeholder "0" |
|✓ |Checkbox |Toggle — při kliknutí se **zamkne celý řádek** |

**Když je set prázdný (všechna pole):**
- SET číslo se zobrazuje normálně
- Inputy jsou prázdné a editovatelné

**Když kliknu checkmark → set se **lockne**:**
- Background řádku → zelená (#AFE1AF)
- KG, REPS inputy → read-only (disabled)
- SET číslo → скрyte se set type menu (nezobraž se kliknutím)
- ✓ button → **zůstane interactive** (lze unchecknout)
- Zbylý text a border se přebarví na zelenou

**Swipe to Delete (POUZE pro locked sety):**
- Swipe vlevo (delta > 50px) → odhalí červené Delete tlačítko
- Swipe zpět → skryje delete tlačítko
- **Nejsou viditelné delete tlačítka,** pouze po swipe

**Add Set Button:**
- Pod setem(y) je tlačítko "＋ Add Set"
- Přidá nový prázdný řádek (všechna pole volná)

-----

### 3. Set Type Menu (POUZE pro ODEMČENÉ sety)

Kliknutím na SET číslo se otevře animované popup menu.

|Typ |Tag |
|-----------|-----------|
|Normal Set |`1` |
|Warmup Set |`W` |
|Drop Set |`D` |
|Failure Set|`F` |

**Pozn:** Toto menu se **neobjevuje u zamčených setů**.

-----

### 4. Exercise Detail

Kliknutím na název cviku se otevře full-screen overlay.

**Taby:**
- **Info** — popis, ilustrace placeholder, tipy
- **History** — mock data posledních 3 sessions

-----

### 5. Exercise Picker

Bottom sheet (85vh). Režimy: `add` / `replace`.

- Vyhledávací pole (live filter)
- Cviky seskupeny podle svalové skupiny
- Řádek: avatar, název, skupina

**20 cviků v knihovně:** Squat, Deadlift, Deadlift (Trap Bar), Bench Press, Overhead Press, Pull-Up, Barbell Row, Romanian Deadlift, Leg Press, Bulgarian Split Squat, Hip Thrust, Incline Bench Press, Cable Row, Lat Pulldown, Dumbbell Curl, Tricep Pushdown, Lateral Raise, Face Pull, Calf Raise, Plank

-----

### 6. Compact Timer (Apple Dynamic Island Style)

Minimální timer zobrazený v top baru (střed).

- Malá, kompaktní animace
- MM:SS formát
- Kliknutí → otevře Stopwatch Bubble (úplné timerové ovládání)

**Stopwatch Bubble** (modální overlay):
- Velký číselník MM:SS
- Start / Stop (zelená/červená)
- Lap / Reset
- Scrollable seznam lapů
- Close button

-----

### 7. Exercise Action Bottom Sheet

Slide-up sheet. Vyvolán přes ⋮ ikonu.

|Akce |Funkce |
|-----------------|-------------------------------------|
|Reorder Exercises|Placeholder |
|Replace Exercise |Otevře Exercise Picker (replace mode) |
|Add To Superset |Placeholder |
|Remove Exercise |Confirm → smaže celou kartu |

-----

### 8. Confirm Dialogy

Pro: Finish Workout, Discard Workout, Remove Exercise.

- Tmavé pozadí s blur
- Nadpis + popis
- Cancel + Confirm (danger verze = červené)

-----

## Datový Model

```javascript
Workout {
  startTime: Date
  exercises: Exercise[]
}

Exercise {
  id: string
  name: string
  notes: string
  restTimer: null | 60 | 90 | 120
  sets: Set[]
}

Set {
  id: string
  kg: number | null
  reps: number | null
  completed: boolean
  type: "normal" | "warmup" | "dropset" | "failure"
  previous: { kg: number, reps: number } | null
}
```

**State:** React `useState` — bez localStorage, bez persistence.

-----

## Seed Data (demo)

Při "Start Blank Workout" se **nepřidávají automaticky žádné cviky**. Workspace je prázdný.

**Uložené rutiny (pro budoucnost):**
- Push Day A: Bench Press, OHP, Incline Bench, Lateral Raise, Tricep Pushdown
- Pull Day A: Deadlift, Barbell Row, Lat Pulldown, Cable Row, Dumbbell Curl
- Leg Day A: Squat, RDL, Bulgarian Split Squat, Leg Press, Calf Raise

-----

## Animace & Přechody

|Prvek |Animace |
|---------------|----------------------------------------------------------|
|Bottom Sheet |`transform translateY` + `cubic-bezier(.32,1,.56,1)` 300ms|
|Exercise Picker|Stejné |
|Set Type Menu |`scale` + `translateY` 180ms ease |
|Swipe to delete|`translateX` 200ms ease |
|Checkmark row |`background` 250ms transition |
|Confirm dialog |`backdropFilter: blur(5px)` |
|Compact Timer |Fade in/out 150ms |

-----

## Technická omezení

- Single `.jsx` file, default export
- React hooks: `useState`, `useEffect`, `useRef`, `useCallback`
- Tailwind + inline styles
- Bez `<form>` tagů
- Max šířka: 430px, centrovaný
- Bez localStorage — ephemeral state

-----

## Co není implementováno (backlog)

- Reorder Exercises (drag & drop)
- Add To Superset
- Settings obrazovka
- Backend persistence
- Video/foto
- Push notifikace
- Statistiky a grafy
