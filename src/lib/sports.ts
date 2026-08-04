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
  eventDate: string;
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
  galleryImages: { year: number; images: { title: string; url: string }[] }[];
  sponsorTiers: SponsorTier[];
  hasTshirtSize: boolean;
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
  eventDate: "2026-07-17",
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
    {
      year: 2026,
      images: [
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809096/55411804715_94994d81e0_k_ntrjhx.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809093/55411809700_b438745b78_k_l7bnnr.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809093/55411804830_86939cfe88_k_qc8pgt.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809093/55411807290_dd1d59dc8f_k_vjhjwc.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809093/55411805580_fa119bd6f9_k_sfj3ki.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809092/55411802395_64ca5dee59_k_ryti5z.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809092/55411789625_fbaaece69d_k_ygd8j0.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809092/55411800190_c03400cb05_k_vc4ier.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809092/55411797745_f11ca7c716_k_kpcdvz.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809092/55411594139_3286853297_k_kzjvvw.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809092/55411598164_f286c2ed7c_k_jleip2.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809091/55411598899_851481753b_k_zztvgn.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809091/55411594934_3ab120beeb_k_v8orhs.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809091/55411540963_a62ad06809_k_p1b9gd.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809091/55411580184_7d404870a7_k_q7xsy2.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809091/55411592129_4fb28066ed_k_nufopu.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411539798_a6f5bdb63c_k_tw1xta.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411579949_d14101afa6_k_chvycz.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411538853_3694a8ab2e_k_ckpulw.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411416136_4fad2cc78b_k_vpthia.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411416236_4e49fa3a9a_k_nxmbam.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411529538_84ceba3e01_k_orsokv.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411421806_785ea6b404_k_o8cyme.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809090/55411535773_42889e2f22_k_nrd9yk.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809089/55411418496_e681ce6bcf_k_pk5x9h.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809089/55411415766_98190003eb_k_jofn4u.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809089/55411415271_f99ebf2ae2_k_caxzce.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809089/55411414991_9258164729_k_gmlohy.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809089/55411415361_cde27d596b_k_gggbeg.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809088/55410441512_c95a34f14a_k_ch8old.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809088/55410436037_b0c707a40a_k_vqxy5i.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809088/55411411096_2bdcd9e188_k_zkqovf.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809088/55411407351_b8fcc4b56b_k_k6vs9h.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809088/55411407676_11976a6431_k_fdkkka.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809088/55410454872_1b1a5341f1_k_adcdt6.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809087/55411407286_ca584fb6bd_k_rlhmey.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809087/55410445997_218085ea8a_k_c8ljl0.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809087/55410444937_d82e505211_k_bja6dt.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809087/55410450617_60406776ff_k_tuzbl1.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809086/55410436707_a39b65f8fa_k_zundad.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809086/55410450192_0f05ca046a_k_ynx0yp.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809086/55410449987_26b942865d_k_if4hyf.jpg" },
        { title: "Group Photo", url: "https://res.cloudinary.com/dazxax791/image/upload/v1785809086/55410435172_e5eb564019_k_bxeagf.jpg" },
      ],
    },
    {
      year: 2025,
      images: [
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
    },
  ],
  sponsorTiers: [
    { name: "Par Level", price: 5000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included", category: "Premium Sponsorship" },
    { name: "Birdie Level", price: 10000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included", category: "Premium Sponsorship" },
    { name: "Eagle Level", price: 15000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included", category: "Premium Sponsorship" },
    { name: "Hole in One Level", price: 20000, freeGolfers: 4, includesGolf: true, description: "Premium sponsorship — foursome included, top-tier recognition", category: "Premium Sponsorship" },
    { name: "Hole Sponsor", price: 300, freeGolfers: 0, includesGolf: false, description: "Includes tee box sign" },
    { name: "Cart Sponsor", price: 1000, freeGolfers: 1, includesGolf: true, description: "Includes one golfer, recognition on all carts, hole sponsor sign" },
    { name: "Beverage Sponsor", price: 1000, freeGolfers: 1, includesGolf: true, description: "Includes one golfer, recognition, hole sponsor sign" },
    { name: "Dinner Sponsor", price: 3000, freeGolfers: 4, includesGolf: true, description: "Includes foursome, recognition at dinner, hole sponsor sign" },
    { name: "Title Sponsor", price: 10000, freeGolfers: 4, includesGolf: true, description: "Includes foursome, outing recognition, hole sponsor sign, sponsor gift" },
  ],
  hasTshirtSize: true,
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
  eventDate: "2026-06-14",
  schedule: [
    { time: "8:00 a.m.", label: "Registration" },
    { time: "9:00 a.m.", label: "Shotgun Start" },
    { time: "2:00 p.m.", label: "Post-Golf Awards Luncheon" },
  ],
  location: "The Meadows Golf Course and Pavilion",
  address: "4645 W Campus Dr., Allendale, MI 49401",
  cost: 135,
  costIncludes:
    "Golf & cart, range balls, coffee & donuts during registration, snacks, 2 drink tickets, lunch/awards at the conclusion of the day",
  attire: "Golf Attire/Casual/Laker Gear",
  proceedsBenefit: "Laker Women's Basketball team",
  contactEmail: "parkera1@gvsu.edu",
  contactPhone: "616.331.3592",
  heroImage:
    "https://res.cloudinary.com/dazxax791/image/upload/v1772735788/image_1_1_kqprkb.png",
  galleryImages: [
    {
      year: 2025,
      images: [
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
    },
  ],
  sponsorTiers: [
    { name: "Gold Sponsor", price: 850, freeGolfers: 4, includesGolf: true, description: "Foursome, name on tee box/recognition at lunch, 4 GV basketball crew sweatshirts" },
    { name: "Silver Sponsor", price: 650, freeGolfers: 4, includesGolf: true, description: "Foursome, name on tee box/recognition at lunch" },
    { name: "Bronze Sponsor", price: 200, freeGolfers: 0, includesGolf: false, description: "Name on tee box/recognition at lunch (no golf)" },
  ],
  hasTshirtSize: true,
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

export function isEventConcluded(config: SportConfig): boolean {
  const eventEnd = new Date(`${config.eventDate}T23:59:59`);
  return Date.now() > eventEnd.getTime();
}
