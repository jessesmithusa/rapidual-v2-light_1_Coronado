export interface Product {
  id: string;
  retailerId: string;
  name: string;
  price: number;
  icon: string;
}

export const CATALOG: Product[] = [
  // Walmart · Groceries
  { id: "wm1", retailerId: "walmart", name: "Whole Milk, 1 gal", price: 3.48, icon: "nutrition" },
  { id: "wm2", retailerId: "walmart", name: "Eggs, dozen", price: 2.94, icon: "egg" },
  { id: "wm3", retailerId: "walmart", name: "Paper Towels, 6-pack", price: 9.97, icon: "documents" },
  { id: "wm4", retailerId: "walmart", name: "Laundry Detergent, 92 oz", price: 11.97, icon: "color-fill" },
  // Target · Essentials
  { id: "tg1", retailerId: "target", name: "Hand Soap Refill", price: 5.49, icon: "water" },
  { id: "tg2", retailerId: "target", name: "Trash Bags, 45 ct", price: 8.99, icon: "trash" },
  { id: "tg3", retailerId: "target", name: "Phone Charger USB-C", price: 14.99, icon: "battery-charging" },
  // Costco · Groceries
  { id: "co1", retailerId: "costco", name: "Rotisserie Chicken", price: 4.99, icon: "fast-food" },
  { id: "co2", retailerId: "costco", name: "Bottled Water, 40-pack", price: 6.49, icon: "water" },
  { id: "co3", retailerId: "costco", name: "Olive Oil, 2 L", price: 17.99, icon: "wine" },
  // The Home Depot · Home
  { id: "hd1", retailerId: "homedepot", name: "LED Bulbs, 4-pack", price: 12.98, icon: "bulb" },
  { id: "hd2", retailerId: "homedepot", name: "Air Filter 20x25", price: 18.97, icon: "grid" },
  { id: "hd3", retailerId: "homedepot", name: "Cordless Drill", price: 79.0, icon: "construct" },
  // Lowe's · Home
  { id: "lw1", retailerId: "lowes", name: "Smart Plug, 2-pack", price: 19.98, icon: "flash" },
  { id: "lw2", retailerId: "lowes", name: "Garden Hose, 50 ft", price: 26.48, icon: "water" },
  { id: "lw3", retailerId: "lowes", name: "Paint Roller Kit", price: 14.98, icon: "color-palette" },
  // Ulta · Beauty
  { id: "ul1", retailerId: "ulta", name: "Daily Moisturizer SPF 30", price: 16.0, icon: "sunny" },
  { id: "ul2", retailerId: "ulta", name: "Shampoo + Conditioner Duo", price: 22.0, icon: "water" },
  { id: "ul3", retailerId: "ulta", name: "Vitamin C Serum", price: 24.5, icon: "flask" },
  // Kohl's · Apparel
  { id: "kh1", retailerId: "kohls", name: "Cotton Crew Socks, 6pk", price: 13.99, icon: "footsteps" },
  { id: "kh2", retailerId: "kohls", name: "Bath Towel Set", price: 24.99, icon: "bed" },
  // Best Buy · Electronics
  { id: "bb1", retailerId: "bestbuy", name: "Wireless Earbuds", price: 49.99, icon: "headset" },
  { id: "bb2", retailerId: "bestbuy", name: "HDMI Cable 6 ft", price: 11.99, icon: "tv" },
  { id: "bb3", retailerId: "bestbuy", name: "65W USB-C Charger", price: 29.99, icon: "flash" },
  // CVS Pharmacy
  { id: "cv1", retailerId: "cvs", name: "Allergy Relief, 30 ct", price: 12.49, icon: "medkit" },
  { id: "cv2", retailerId: "cvs", name: "Vitamin D3", price: 9.49, icon: "fitness" },
  { id: "cv3", retailerId: "cvs", name: "Toothpaste, 2-pack", price: 6.99, icon: "happy" },
];

export const productsFor = (retailerId: string) => CATALOG.filter((p) => p.retailerId === retailerId);
export const productById = (id: string) => CATALOG.find((p) => p.id === id);
