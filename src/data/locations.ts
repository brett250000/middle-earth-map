export type LocationCategory =
  | "settlement"
  | "stronghold"
  | "landmark"
  | "realm"
  | "wilderness";

export type Location = {
  id: string;
  name: string;
  region: string;
  category: LocationCategory;
  /** Pixel coords on the atlas image (from top-left). */
  x: number;
  y: number;
  summary: string;
  lore: string;
};

/** Image pixel size — keep in sync with scripts/generate-maps.mjs */
export const MAP_WIDTH = 4096;
export const MAP_HEIGHT = 3072;

export const locations: Location[] = [
  {
    id: "hobbiton",
    name: "Hobbiton",
    region: "The Shire",
    category: "settlement",
    x: 860,
    y: 960,
    summary: "A peaceful hobbit village among the green hills of the Shire.",
    lore: "Home of Bilbo and Frodo Baggins, Hobbiton sits along the Water near Bywater. Its round doors, tidy gardens, and unhurried ways mark the heart of hobbit-country—far from the shadows gathering in the East.",
  },
  {
    id: "bree",
    name: "Bree",
    region: "Eriador",
    category: "settlement",
    x: 680,
    y: 600,
    summary: "A crossroads town of Men and hobbits at the edge of the wild.",
    lore: "Bree stands where the East Road meets the Greenway. The Prancing Pony inn has long welcomed travellers—rangers, dwarves, and those who prefer not to give their true names.",
  },
  {
    id: "weathertop",
    name: "Weathertop",
    region: "Eriador",
    category: "landmark",
    x: 780,
    y: 560,
    summary: "A windswept hill crowned by the ruins of Amon Sûl.",
    lore: "Once a great watchtower of Arnor, Weathertop overlooks the East Road. Its broken stones remember kings—and the night Frodo was wounded by a Nazgûl blade.",
  },
  {
    id: "rivendell",
    name: "Rivendell",
    region: "Eriador",
    category: "stronghold",
    x: 1520,
    y: 800,
    summary: "Imladris—Elrond’s hidden refuge in a deep mountain valley.",
    lore: "Called the Last Homely House east of the Sea, Rivendell is a sanctuary of lore, counsel, and healing. Here the Fellowship of the Ring was formed beneath waterfalls and starlight.",
  },
  {
    id: "grey-havens",
    name: "Grey Havens",
    region: "Lindon",
    category: "settlement",
    x: 460,
    y: 880,
    summary: "Mithlond, where Elven ships depart for the Undying Lands.",
    lore: "At the Gulf of Lune the Grey Havens keep the last great harbours of the Elves in Middle-earth. From these quays the white ships sail west, and with them pass ages of memory.",
  },
  {
    id: "moria",
    name: "Moria",
    region: "Misty Mountains",
    category: "stronghold",
    x: 1020,
    y: 720,
    summary: "Khazad-dûm—the vast dwarven halls beneath the mountains.",
    lore: "Once the greatest realm of Durin’s folk, Moria fell to shadow after the awakening of Durin’s Bane. Its dark roads still run from west-gate to east, through chambers of stone and fire.",
  },
  {
    id: "lothlorien",
    name: "Lothlórien",
    region: "Rhovanion",
    category: "realm",
    x: 1120,
    y: 820,
    summary: "The Golden Wood, ruled by Galadriel and Celeborn.",
    lore: "In Lothlórien time seems to linger. Mallorn trees rise in gold and silver, and the Lady’s Mirror offers glimpses of what was, and what may yet be.",
  },
  {
    id: "mirkwood",
    name: "Mirkwood",
    region: "Rhovanion",
    category: "wilderness",
    x: 1340,
    y: 560,
    summary: "A vast forest darkened by ancient enchantment.",
    lore: "Once Greenwood the Great, the wood grew perilous under the shadow of Dol Guldur. Spiders, paths that vanish, and the halls of Thranduil lie within its depths.",
  },
  {
    id: "erebor",
    name: "Erebor",
    region: "Rhovanion",
    category: "stronghold",
    x: 1560,
    y: 340,
    summary: "The Lonely Mountain, kingdom under the mountain of Durin’s heirs.",
    lore: "Erebor held the hoard of Smaug until Thorin’s company reclaimed it. Dale thrives again at its feet, and the mountain stands as a beacon of dwarven restoration in the North.",
  },
  {
    id: "isengard",
    name: "Isengard",
    region: "Rohan",
    category: "stronghold",
    x: 980,
    y: 1020,
    summary: "A ring of stone about Orthanc, once Saruman’s seat of power.",
    lore: "Within the circle of Isengard rose the tower Orthanc. From here Saruman bred armies and broke the land with industry—until the Ents marched, and the waters swallowed his works.",
  },
  {
    id: "edoras",
    name: "Edoras",
    region: "Rohan",
    category: "settlement",
    x: 1760,
    y: 1780,
    summary: "Capital of the Mark, crowned by the Golden Hall of Meduseld.",
    lore: "Edoras rises on a green hill above the plains of Rohan. Meduseld’s roof shines like gold at sunset, and from its steps the kings of the Horse-lords look out upon their wide realm.",
  },
  {
    id: "helms-deep",
    name: "Helm’s Deep",
    region: "Rohan",
    category: "stronghold",
    x: 1000,
    y: 1140,
    summary: "The fortress in the gorge of Aglarond, last refuge of Rohan.",
    lore: "Behind the Deeping Wall stands the Hornburg. In the War of the Ring, Théoden’s people held here against Saruman’s host until dawn and the forest of Huorns decided the battle.",
  },
  {
    id: "minas-tirith",
    name: "Minas Tirith",
    region: "Gondor",
    category: "stronghold",
    x: 2040,
    y: 2160,
    summary: "The White City—seven-tiered capital of Gondor.",
    lore: "Built against Mount Mindolluin, Minas Tirith guards the crossing of Anduin. Its white walls and high citadel have endured siege and despair, awaiting the return of the King.",
  },
  {
    id: "osgilath",
    name: "Osgiliath",
    region: "Gondor",
    category: "settlement",
    x: 1400,
    y: 1400,
    summary: "Ruined former capital straddling the River Anduin.",
    lore: "Once the chief city of Gondor, Osgiliath fell to war and flood. In the last years of the Third Age its broken bridges became a bitter front between Men and the hosts of Mordor.",
  },
  {
    id: "minas-morgul",
    name: "Minas Morgul",
    region: "Mordor",
    category: "stronghold",
    x: 1560,
    y: 1360,
    summary: "The Tower of Sorcery, once Minas Ithil of Gondor.",
    lore: "Captured by the Nazgûl, the moonlit city became a place of dread. From its gates the Morgul-road climbs toward Cirith Ungol and the passes into Mordor.",
  },
  {
    id: "mount-doom",
    name: "Mount Doom",
    region: "Mordor",
    category: "landmark",
    x: 2480,
    y: 2100,
    summary: "Orodruin—the fiery mountain where the One Ring was forged.",
    lore: "In the heart of Mordor, Orodruin’s Cracks of Doom alone could unmake the Ring. Upon its slopes the fate of the Third Age was decided in fire and surrender.",
  },
  {
    id: "barad-dur",
    name: "Barad-dûr",
    region: "Mordor",
    category: "stronghold",
    x: 1840,
    y: 1320,
    summary: "The Dark Tower—Sauron’s fortress in the Land of Shadow.",
    lore: "Raised with the power of the Ring, Barad-dûr commanded Mordor with an Eye that missed little. When the Ring perished, the tower’s foundations failed, and the shadow was cast down.",
  },
  {
    id: "black-gate",
    name: "Black Gate",
    region: "Mordor",
    category: "landmark",
    x: 1600,
    y: 1220,
    summary: "Morannon—the fortified entrance to Mordor in the northwest.",
    lore: "Where the Ephel Dúath and Ered Lithui meet, the Black Gate seals Mordor. Armies have broken upon it; few have passed unbidden into the plain of Gorgoroth.",
  },
  {
    id: "fangorn",
    name: "Fangorn Forest",
    region: "Rohan",
    category: "wilderness",
    x: 1060,
    y: 960,
    summary: "Ancient woodland of the Ents, oldest living beings of Middle-earth.",
    lore: "Fangorn is deep, slow, and watchful. Treebeard and his kin remember ages before the kingdoms of Men—and when roused, the forest itself may march to war.",
  },
  {
    id: "dead-marshes",
    name: "Dead Marshes",
    region: "Between Gondor & Mordor",
    category: "wilderness",
    x: 1480,
    y: 1280,
    summary: "Treacherous wetlands haunted by faces of the long-dead.",
    lore: "North of the Morannon lie pools that mirror lights and fallen warriors of ancient battles. Travellers are warned not to follow the candles—or look too long into the water.",
  },
];

export const categoryLabels: Record<LocationCategory, string> = {
  settlement: "Settlement",
  stronghold: "Stronghold",
  landmark: "Landmark",
  realm: "Realm",
  wilderness: "Wilderness",
};
