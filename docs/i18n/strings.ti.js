// Tigrinya (Ge'ez script) chrome-text strings for the language toggle
// (ticket #31, part of spec #22). Pure data — a complete, linearly-readable
// copy deck. Keys here must exactly match docs/i18n/strings.en.js's keys
// (see the key-parity test in docs/i18n.test.js).
//
// NOTE for the translation reviewer: this is a best-effort machine-assisted
// draft (per spec #22's "Further Notes" — the implementing agent drafts this
// file, a human reviews the actual copy before merge). Please review for
// accuracy and tone before this ships.
//
// Scope: index.html's chrome text (ticket #31) plus about.html's prose
// (ticket #32) — the page's entire content, since about.html has no
// separate content/data text the way index.html's video titles/channel
// names do.
export const strings = {
  // #guide-toggle (docs/app.js openGuide()/closeGuide()) — also the
  // button's static initial text in index.html.
  guideToggleOpenLabel: "መደብ ▾",
  guideToggleCloseLabel: "ዕጸው ✕",

  // Guide panel cells (docs/app.js renderGuide()).
  nowLabel: "ሕጂ",
  nothingScheduledLabel: "ዝተመደበ የለን",

  // Corner badge empty state (docs/app.js showEmptyState()).
  nothingInLineupLabel: "ገና ኣብ መስርዕ የለን",

  // #unmute (docs/app.js toggleMute()) — also the button's static initial
  // text in index.html (the player starts muted).
  tapToMuteLabel: "🔊 ድምጺ ንምጥፋእ ጠውቕ",
  tapToUnmuteLabel: "🔇 ድምጺ ንምክፋት ጠውቕ",

  // #go-live (docs/app.js goLive()) — also the button's static initial text
  // in index.html (ticket #55, part of #46).
  goLiveLabel: "🔴 ናብ ቀጥታ ኺድ",

  // Offline/schedule-failure message (docs/offline-message.js + docs/app.js
  // renderScheduleMessage()).
  lineupFailureMessage: "መደብ ምጽዓን ኣይተኻእለን። ግንኙነትካ ረጋግጽ እሞ ደጊምካ ፈትን።",

  // iOS install hint (static markup in index.html's #ios-install-hint;
  // ios-install-hint-ui.js only toggles its visibility, never its text).
  // Contains trusted, developer-authored markup (<strong>, an aria-hidden
  // icon span) — rendered via innerHTML by i18n-ui.js, never from visitor
  // input. "Nahom Eri TV" stays untranslated in both languages (brand name).
  installHintHtml:
    'ነቲ Nahom Eri TV ኣፕሊኬሽን ንምትካል፡ <strong>ኣካፍል</strong> ዝብል ጠውቕ <span aria-hidden="true">⎋</span> ድሕሪኡ <strong>ናብ መጀመርታ ገጽ ወስኽ</strong> ዝብል ምረጽ።',
  installHintDismissAriaLabel: "መልእኽቲ ምትካል ዕጸው",

  // about.html prose (ticket #32). Best-effort draft — see the reviewer
  // note at the top of this file; please review before merge.
  aboutWhatItIsHeading: "እንታይነቱ",
  aboutWhatItIsIntro:
    "Nahom Eri TV ንኤርትራውያንን ንተጋሩ ዲያስፖራን ትሕዝቶ ዘቕርብ ናይ ስርጭት-ዓይነት ኣገልግሎት ድዩ። ልክዕ ከም ናይ ሓቂ ናይ ተለቪዥን ቻነል፡ ካብ ዝርዝር ቪድዮ ኣብ ክንዲ ምምራጽ፡ ኣብቲ ድሮ ዝካየድ ዘሎ ቻነል ኢኻ እትጽምበር። ነፍሲ ወከፍ ቻነል ብናይ ገዛእ ርእሱ ቀዋሚ፡ ተኸታታሊ መደብ ይሰርሕ፣ ስለዚ ኣብቲ ሓደ ህሞት ዝከታተሉ ዘለዉ ኩሎም ሓደ ዓይነት ነገር ይርእዩ። እዚ ኣገልግሎት ናብ ቻነላት ተኸፋፊሉ ዘሎ ኮይኑ፡ ነፍሲ ወከፎም ብገዛእ ርእሱ ኣርእስቲ ወይ ፈጣሪ ዝተኣከበ ኮይኑ፡ ብግዜ ገለ ተወሳኺ እናወሰኸ ዝኸይድ እዩ።",
  aboutNothingDownloaded:
    "ዋላ ሓንቲ ኣይወርድን፡ ኣይተዓቅብን፡ ወይ ዳግም ኣይስራዕን፦ ነፍሲ ወከፍ ቪድዮ ብቐጥታ ካብቲ ናይ YouTube ገዛእ ርእሱ ፕሌየር እዩ ዝጻወት፡ ስለዚ ፈጠርቲ ርኢቶታቶምን ቁጽጽር ናይቲ ዝሰቐልዎ ትሕዝቶን ይሕልዉ።",

  aboutWhoItsForHeading: "ንመን እዩ",
  aboutWhoItsForParagraph:
    "ነቲ ናይ ማሕበረሰቦም መርዓ፡ ባህሊ፡ ከምኡውን ናይ ኩሉ መዓልቲ ህይወት ብዘይ ምድላይ ክርእዩ ዝደልዩ ኤርትራውያንን ተጋሩ ዝዛረቡ ዲያስፖራ ተዓዘብትን — ካብ ወጻኢ ዝርከብ ሰብ ብቡን ዝሰምዕ፡ ስድራቤት ነቲ ናይ ገዛእ ርእሳ መርዓ እናተዳለወት ሓሳብ ትደሊ ዘላ፡ ንእሽቶ ተዓዛቢ ልምድታት ሎሚ ከመይ ከም ዝመስል ዝሓትት፡ ወይ ፈጣሪ ስራሑ ሰፊሕ ተዓዘብቲ ዝግብኦ።",

  aboutHowToUseHeading: "ብኸመይ ትጥቀመሉ",
  aboutUnmuteInstructionHtml:
    "ጥራይ ክፈቶ — ቻነል ብቕጽበት ይጅምር፡ ብመጀመርታ ብዘይ ድምጺ። ነቲ ናይ ድምጺ መኽፈቲ መልጎም ጠውቕ (ወይ <kbd>M</kbd> ጠውቕ) ድምጺ ንምክፋት።",
  aboutGuideInstructionHtml:
    "እንታይ ይካየድ ከምዘሎ ንምርኣይ ወይ ቻነል ንምቕያር፡ ነቲ መደብ ክፈቶ — ኣብቲ ናይ ስራሕ መሳርሒ <strong>መደብ</strong> ጠውቕ (ወይ <kbd>G</kbd> ጠውቕ)፡ ድሕርዚ ናብ ላዕሊ/ታሕቲ ዝቕይር ወይ ቀጥ ዝበለ ምንቅስቓስ ተጠቒምካ ኣብ መንጎ ቻነላት ንቀሳቐስ፡ ከምኡውን <kbd>Enter</kbd> ጠውቕ (ወይ ተንከፍ፡ ወይ ናብ የማን ኣንቀሳቕስ) ንምጽምባር። <kbd>Esc</kbd> ጠውቕ ነቲ መደብ ንምዕጻው።",
  aboutInstallInstruction:
    "ኣብ ተሌፎን፡ ንNahom Eri TV ልክዕ ከም ኣፕሊኬሽን ክትተክሎ ትኽእል ኢኻ — ነቲ ናይ ሓደ-ጠውቓ ምብጻሕን ቅጽበታዊ ምጽዓንን ኣብ መበገሲ ገጽካ ወስኾ፡ ዋላ ኣብ ድኹም ርክብ እውን።",
};
