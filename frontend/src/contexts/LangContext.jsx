'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Nav
    home: 'Home',
    search: 'Search',
    categories: 'Categories',
    cart: 'Cart',
    profile: 'Profile',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    affiliate: 'Affiliate',
    competition: 'Competition',
    admin: 'Admin',

    // Hero
    hero_title: 'Discover Trending Fashion in Tanzania',
    hero_subtitle: 'Shop smarter. Earn commissions. Dress better.',
    start_shopping: 'Start Shopping',
    become_affiliate: 'Become an Affiliate',

    // Products
    trending: 'Trending Now',
    flash_sale: 'Flash Sale',
    new_arrivals: 'New Arrivals',
    all_products: 'All Products',
    add_to_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    wishlist: 'Wishlist',
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    size: 'Size',
    color: 'Color',
    quantity: 'Quantity',
    description: 'Description',
    reviews: 'Reviews',
    related_products: 'Related Products',
    share: 'Share',
    views: 'Views',
    sold: 'Sold',

    // Affiliate
    earn_commission: 'Earn Commission',
    your_commission: 'Your Commission',
    copy_link: 'Copy Affiliate Link',
    share_whatsapp: 'Share on WhatsApp',
    share_tiktok: 'Share on TikTok',
    share_instagram: 'Share on Instagram',
    affiliate_dashboard: 'Affiliate Dashboard',
    total_earnings: 'Total Earnings',
    pending_earnings: 'Pending Earnings',
    withdrawable: 'Withdrawable',
    total_clicks: 'Total Clicks',
    total_orders: 'Total Orders',
    conversion_rate: 'Conversion Rate',
    withdraw: 'Withdraw',
    my_links: 'My Links',
    leaderboard: 'Leaderboard',
    level: 'Level',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    diamond: 'Diamond',
    vip: 'VIP',

    // Cart & Checkout
    your_cart: 'Your Cart',
    checkout: 'Checkout',
    empty_cart: 'Your cart is empty',
    remove: 'Remove',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    coupon: 'Coupon Code',
    apply: 'Apply',
    place_order: 'Place Order',
    full_name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email Address',
    address: 'Delivery Address',
    city: 'City',
    payment_method: 'Payment Method',
    mpesa: 'Voda',
    cash_on_delivery: 'Cash on Delivery',
    order_success: 'Order Placed Successfully!',
    order_number: 'Order Number',
    track_order: 'Track Order',

    // Competition
    monthly_competition: 'Monthly Competition',
    competition_desc: 'Compete with top affiliates and win amazing prizes!',
    current_prize: 'Current Prize',
    your_rank: 'Your Rank',
    ends_in: 'Ends In',
    rules: 'Rules',
    join_now: 'Join Now',

    // Footer
    contact_us: 'Contact Us',
    follow_us: 'Follow Us',
    newsletter: 'Newsletter',
    subscribe: 'Subscribe',
    newsletter_placeholder: 'Enter your email',
    privacy_policy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    all_rights: 'All rights reserved',

    // Auth
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    forgot_password: 'Forgot Password?',
    no_account: "Don't have an account?",
    have_account: 'Already have an account?',
    name: 'Full Name',
    password: 'Password',
    confirm_password: 'Confirm Password',
    referral_code: 'Referral Code (optional)',

    // Categories
    womens: "Women's Clothing",
    mens: "Men's Clothing",
    kids: 'Kids',
    dresses: 'Dresses',
    tshirts: 'T-Shirts',
    jackets: 'Jackets',
    shoes: 'Shoes',
    accessories: 'Accessories',

    // Misc
    loading: 'Loading...',
    no_products: 'No products found',
    see_all: 'See All',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    copied: 'Copied!',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    whatsapp_chat: 'Chat on WhatsApp',
  },
  sw: {
    // Nav
    home: 'Nyumbani',
    search: 'Tafuta',
    categories: 'Makundi',
    cart: 'Kikapu',
    profile: 'Wasifu',
    login: 'Ingia',
    logout: 'Toka',
    register: 'Jiandikishe',
    affiliate: 'Mshirika',
    competition: 'Mashindano',
    admin: 'Msimamizi',

    // Hero
    hero_title: 'Gundua Mitindo ya Kisasa Tanzania',
    hero_subtitle: 'Nunua kwa akili. Pata kamisheni. Vaa vizuri.',
    start_shopping: 'Anza Kununua',
    become_affiliate: 'Kuwa Mshirika',

    // Products
    trending: 'Inayopanda Sasa',
    flash_sale: 'Ofa ya Haraka',
    new_arrivals: 'Mpya Zimefika',
    all_products: 'Bidhaa Zote',
    add_to_cart: 'Weka Kikapuni',
    buy_now: 'Nunua Sasa',
    wishlist: 'Orodha ya Matamanio',
    in_stock: 'Ipo Dukani',
    out_of_stock: 'Imeisha',
    size: 'Saizi',
    color: 'Rangi',
    quantity: 'Idadi',
    description: 'Maelezo',
    reviews: 'Maoni',
    related_products: 'Bidhaa Zinazofanana',
    share: 'Shiriki',
    views: 'Maoni',
    sold: 'Zimeuzwa',

    // Affiliate
    earn_commission: 'Pata Kamisheni',
    your_commission: 'Kamisheni Yako',
    copy_link: 'Nakili Kiungo cha Mshirika',
    share_whatsapp: 'Shiriki WhatsApp',
    share_tiktok: 'Shiriki TikTok',
    share_instagram: 'Shiriki Instagram',
    affiliate_dashboard: 'Dashibodi ya Mshirika',
    total_earnings: 'Mapato Yote',
    pending_earnings: 'Mapato Yanayosubiri',
    withdrawable: 'Yanayoweza Kutolewa',
    total_clicks: 'Mibonyezo Yote',
    total_orders: 'Maagizo Yote',
    conversion_rate: 'Kiwango cha Mabadiliko',
    withdraw: 'Toa Pesa',
    my_links: 'Viungo Vyangu',
    leaderboard: 'Orodha ya Washindi',
    level: 'Kiwango',
    bronze: 'Shaba',
    silver: 'Fedha',
    gold: 'Dhahabu',
    diamond: 'Almasi',
    vip: 'VIP',

    // Cart & Checkout
    your_cart: 'Kikapu Chako',
    checkout: 'Malipo',
    empty_cart: 'Kikapu chako kiko tupu',
    remove: 'Ondoa',
    total: 'Jumla',
    subtotal: 'Jumla Ndogo',
    discount: 'Punguzo',
    coupon: 'Nambari ya Kuponi',
    apply: 'Tumia',
    place_order: 'Weka Agizo',
    full_name: 'Jina Kamili',
    phone: 'Nambari ya Simu',
    email: 'Barua Pepe',
    address: 'Anwani ya Utoaji',
    city: 'Mji',
    payment_method: 'Njia ya Malipo',
    mpesa: 'M-Pesa',
    cash_on_delivery: 'Lipa Unapopokea',
    order_success: 'Agizo Limewekwa!',
    order_number: 'Nambari ya Agizo',
    track_order: 'Fuatilia Agizo',

    // Competition
    monthly_competition: 'Mashindano ya Mwezi',
    competition_desc: 'Shindana na washirika wakuu na ushinde zawadi nzuri!',
    current_prize: 'Zawadi ya Sasa',
    your_rank: 'Nafasi Yako',
    ends_in: 'Inaisha Ndani ya',
    rules: 'Sheria',
    join_now: 'Jiunge Sasa',

    // Footer
    contact_us: 'Wasiliana Nasi',
    follow_us: 'Tufuate',
    newsletter: 'Jarida la Habari',
    subscribe: 'Jiandikishe',
    newsletter_placeholder: 'Ingiza barua pepe yako',
    privacy_policy: 'Sera ya Faragha',
    terms: 'Masharti na Hali',
    all_rights: 'Haki zote zimehifadhiwa',

    // Auth
    sign_in: 'Ingia',
    sign_up: 'Jiandikishe',
    forgot_password: 'Umesahau Nenosiri?',
    no_account: 'Huna akaunti?',
    have_account: 'Una akaunti tayari?',
    name: 'Jina Kamili',
    password: 'Nenosiri',
    confirm_password: 'Thibitisha Nenosiri',
    referral_code: 'Nambari ya Rufaa (hiari)',

    // Categories
    womens: 'Nguo za Wanawake',
    mens: 'Nguo za Wanaume',
    kids: 'Watoto',
    dresses: 'Mavazi',
    tshirts: 'T-Shati',
    jackets: 'Jaketi',
    shoes: 'Viatu',
    accessories: 'Vipande',

    // Misc
    loading: 'Inapakia...',
    no_products: 'Hakuna bidhaa zilizopatikana',
    see_all: 'Ona Zote',
    back: 'Rudi',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    edit: 'Hariri',
    delete: 'Futa',
    confirm: 'Thibitisha',
    success: 'Imefanikiwa',
    error: 'Hitilafu',
    copied: 'Imenakiliwa!',
    days: 'Siku',
    hours: 'Masaa',
    minutes: 'Dakika',
    seconds: 'Sekunde',
    whatsapp_chat: 'Zungumza WhatsApp',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('bib_lang');
    if (saved && (saved === 'en' || saved === 'sw')) setLang(saved);
  }, []);

  const toggleLang = () => {
    const next = lang === 'en' ? 'sw' : 'en';
    setLang(next);
    localStorage.setItem('bib_lang', next);
  };

  const t = (key) => translations[lang][key] || translations['en'][key] || key;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};
