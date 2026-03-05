export type SponsorTier = {
  name: string;
  price: number;
  freeGolfers: number;
  includesGolf: boolean;
  description: string;
  category?: string;
};

export type SportConfig = {
  slug: string;
  name: string;
  title: string;
  description: string;
  date: string;
  schedule: { time: string; label: string }[];
  location: string;
  address: string;
  cost: number;
  costIncludes: string;
  attire: string;
  proceedsBenefit: string;
  contactEmail: string;
  contactPhone?: string;
  heroImage: string;
  galleryImages: { title: string; url: string }[];
  sponsorTiers: SponsorTier[];
  hasFirstYearAlumniFree: boolean;
  db: { name: string; registrations: string; sponsors: string };
  stripeProductPrefix: string;
};

const football: SportConfig = {
  slug: "football",
  name: "Football",
  title: "45th Annual Football Alumni Golf Outing",
  description:
    "Join football alumni and friends at the 45th Annual Football Alumni Golf Outing for a day on the green followed by a meal, drinks, and post-golf awards.",
  date: "Friday, July 17, 2026",
  schedule: [
    { time: "8:30 a.m.", label: "Registration and open practice range" },
    { time: "9:30 a.m.", label: "Shotgun Start" },
    { time: "2:00 p.m.", label: "Post-Golf Awards, meal, beverages, raffle, awards" },
  ],
  location: "The Meadows Golf Course",
  address: "4645 W Campus Dr. Allendale, MI 49401",
  cost: 150,
  costIncludes:
    "18 holes and cart, range balls, brats, hot dogs, beverages, post-golf meal, and awards",
  attire: "Golf/Casual/Laker Gear",
  proceedsBenefit: "GVSU Football Program",
  contactEmail: "schmidtk@gvsu.edu",
  heroImage:
    "https://res.cloudinary.com/dazxax791/image/upload/v1772735821/IMG_3666_oa7jpu_l5vnui.jpg",
  galleryImages: [
    { title: "Group photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545301/IMG_3597_kv7jix.jpg" },
    { title: "Coach Wooster", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545301/IMG_3605_jetpkk.jpg" },
    { title: "Group photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545301/IMG_3601_llhbcc.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545301/IMG_3606_om9qjf.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545301/IMG_3658_zlehhz.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545301/IMG_3655_q3012r.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545302/IMG_3620_tc7odv.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545303/IMG_3700_eb8f81.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545303/IMG_3731_uze2ez.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545303/IMG_3766_zq8tzn.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772735821/IMG_3666_oa7jpu_l5vnui.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545303/IMG_3720_s7qnwd.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545302/IMG_3684_e7pne6.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545302/IMG_3625_qqboxq.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545302/IMG_3690_se5teq.jpg" },
    { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1754545302/IMG_3663_htuwu5.jpg" },
    { title: "Stadium View", url: "https://res.cloudinary.com/dazxax791/image/upload/v1741934404/popsilhfutww1ita2wjo.jpg" },
    { title: "Previous Year with Coaches", url: "https://res.cloudinary.com/dazxax791/image/upload/f_auto,q_auto/ku9ne1qkkqvdstpfso1d" },
    { title: "Golf Ball Close-Up", url: "https://res.cloudinary.com/dazxax791/image/upload/v1741935419/emybx2qs4km8ofeqeg5n.jpg" },
    { title: "Cookout Group", url: "https://res.cloudinary.com/dazxax791/image/upload/f_auto,q_auto/dhinuds7e2r87gsompld" },
  ],
  sponsorTiers: [
    { name: "Par Level", price: 5000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included", category: "Premium Sponsorship" },
    { name: "Birdie Level", price: 10000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included", category: "Premium Sponsorship" },
    { name: "Eagle Level", price: 15000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included", category: "Premium Sponsorship" },
    { name: "Hole in One Level", price: 20000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included, top-tier recognition", category: "Premium Sponsorship" },
    { name: "Hole Sponsor", price: 200, freeGolfers: 0, includesGolf: false, description: "Includes tee box sign" },
    { name: "Cart Sponsor", price: 1000, freeGolfers: 1, includesGolf: true, description: "Includes one golfer, recognition on all carts, hole sponsor sign" },
    { name: "Beverage Sponsor", price: 1000, freeGolfers: 1, includesGolf: true, description: "Includes one golfer, recognition, hole sponsor sign" },
    { name: "Dinner Sponsor", price: 3000, freeGolfers: 4, includesGolf: true, description: "Includes foursome, recognition at dinner, hole sponsor sign" },
    { name: "Title Sponsor", price: 10000, freeGolfers: 4, includesGolf: true, description: "Includes foursome, outing recognition, hole sponsor sign, sponsor gift" },
  ],
  hasFirstYearAlumniFree: true,
  db: { name: "golf_fundraiser_2026", registrations: "registrations", sponsors: "sponsors" },
  stripeProductPrefix: "Football Golf Outing",
};

const wbb: SportConfig = {
  slug: "wbb",
  name: "Women's Basketball",
  title: "Women's Basketball Golf Outing",
  description:
    "A day on the green supporting Laker Women's Basketball. Meet the 2026-2027 team, enjoy golf, and help fund the program's future.",
  date: "Sunday, June 14, 2026",
  schedule: [
    { time: "8:00 a.m.", label: "Registration" },
    { time: "9:00 a.m.", label: "Shotgun Start" },
    { time: "2:00 p.m.", label: "Post-Golf Awards Luncheon" },
  ],
  location: "The Meadows Golf Course and Pavilion",
  address: "4645 W Campus Dr., Allendale, MI 49401",
  cost: 125,
  costIncludes:
    "Golf & cart, range balls, snacks, 2 drink tickets, lunch/awards at the conclusion of the day",
  attire: "Golf Attire/Casual/Laker Gear",
  proceedsBenefit: "Laker Women's Basketball team",
  contactEmail: "parkera1@gvsu.edu",
  contactPhone: "616.331.3592",
  heroImage:
    "https://res.cloudinary.com/dazxax791/image/upload/v1772735788/image_1_1_kqprkb.png",
  galleryImages: [
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732908/wbb_8_me5uzh.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732909/wbb_6_tb2jlr.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732904/wbb_14_vifvhe.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732904/wbb_13_rklfxw.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732906/wbb_9_y6rpjg.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732905/wbb_11_kku6y0.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732905/wbb_12_nm50dr.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732907/wbb_10_dxb75i.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732908/wbb_7_kalvtk.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732910/wbb_2_ligfwz.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732911/wbb_5_oru8lr.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732911/wbb_4_alpx2a.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732912/wbb_3_bcgb9v.jpg" },
    { title: "WBB Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1772732912/wbb_1_c4dwbc.jpg" },
  ],
  sponsorTiers: [
    { name: "Gold Sponsor", price: 800, freeGolfers: 4, includesGolf: true, description: "Foursome, name on tee box/recognition at lunch, 4 GV basketball long sleeve hooded shirts" },
    { name: "Silver Sponsor", price: 600, freeGolfers: 4, includesGolf: true, description: "Foursome, name on tee box/recognition at lunch" },
    { name: "Bronze Sponsor", price: 250, freeGolfers: 0, includesGolf: false, description: "Name on tee box/recognition at lunch (no golf)" },
  ],
  hasFirstYearAlumniFree: false,
  db: { name: "wbb_golf_fundraiser_2026", registrations: "registrations", sponsors: "sponsors" },
  stripeProductPrefix: "WBB Golf Outing",
};

const sports: Record<string, SportConfig> = { football, wbb };

export const allSports = Object.values(sports);

export function getSportConfig(slug: string): SportConfig {
  const config = sports[slug];
  if (!config) throw new Error(`Unknown sport: ${slug}`);
  return config;
}

export function isValidSport(slug: string): boolean {
  return slug in sports;
}
