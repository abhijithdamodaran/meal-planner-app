// POST /api/admin/seed-foods
// Seeds the database with common Indian household foods.
// Protected by ADMIN_SECRET env var. Run once after deploy.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Nutritional values per 100g (cooked unless stated otherwise)
// Sources: USDA FNDDS, NIN India, ICMR Nutritive Value of Indian Foods
const INDIAN_FOODS = [
  // ── Grains & Breads ──
  { offId: "ind_basmati_rice_cooked", name: "Basmati Rice (cooked)", category: "Grains", per100gCalories: 130, per100gProtein: 2.7, per100gCarbs: 28.2, per100gFat: 0.3 },
  { offId: "ind_white_rice_cooked", name: "White Rice (cooked)", category: "Grains", per100gCalories: 130, per100gProtein: 2.4, per100gCarbs: 28.0, per100gFat: 0.3 },
  { offId: "ind_brown_rice_cooked", name: "Brown Rice (cooked)", category: "Grains", per100gCalories: 123, per100gProtein: 2.7, per100gCarbs: 25.6, per100gFat: 1.0 },
  { offId: "ind_chapati_roti", name: "Chapati / Roti (whole wheat)", category: "Breads", per100gCalories: 240, per100gProtein: 7.9, per100gCarbs: 46.0, per100gFat: 4.0, servingSizeG: 30 },
  { offId: "ind_naan", name: "Naan", category: "Breads", per100gCalories: 281, per100gProtein: 9.0, per100gCarbs: 49.0, per100gFat: 5.5, servingSizeG: 80 },
  { offId: "ind_paratha_plain", name: "Paratha (plain)", category: "Breads", per100gCalories: 267, per100gProtein: 7.0, per100gCarbs: 35.0, per100gFat: 11.0, servingSizeG: 60 },
  { offId: "ind_aloo_paratha", name: "Aloo Paratha", category: "Breads", per100gCalories: 200, per100gProtein: 5.0, per100gCarbs: 31.0, per100gFat: 6.5, servingSizeG: 100 },
  { offId: "ind_puri", name: "Puri", category: "Breads", per100gCalories: 300, per100gProtein: 5.5, per100gCarbs: 37.0, per100gFat: 14.0, servingSizeG: 25 },
  { offId: "ind_bhatura", name: "Bhatura", category: "Breads", per100gCalories: 320, per100gProtein: 7.0, per100gCarbs: 40.0, per100gFat: 14.0, servingSizeG: 80 },
  { offId: "ind_missi_roti", name: "Missi Roti (besan roti)", category: "Breads", per100gCalories: 250, per100gProtein: 10.0, per100gCarbs: 38.0, per100gFat: 7.0, servingSizeG: 40 },

  // ── South Indian ──
  { offId: "ind_idli", name: "Idli (steamed)", category: "South Indian", per100gCalories: 58, per100gProtein: 2.0, per100gCarbs: 12.0, per100gFat: 0.4, servingSizeG: 40 },
  { offId: "ind_dosa_plain", name: "Dosa (plain)", category: "South Indian", per100gCalories: 133, per100gProtein: 3.5, per100gCarbs: 22.0, per100gFat: 3.5, servingSizeG: 80 },
  { offId: "ind_masala_dosa", name: "Masala Dosa", category: "South Indian", per100gCalories: 150, per100gProtein: 3.8, per100gCarbs: 24.0, per100gFat: 5.0, servingSizeG: 150 },
  { offId: "ind_uttapam", name: "Uttapam", category: "South Indian", per100gCalories: 120, per100gProtein: 4.0, per100gCarbs: 20.0, per100gFat: 3.0, servingSizeG: 100 },
  { offId: "ind_sambar", name: "Sambar", category: "South Indian", per100gCalories: 45, per100gProtein: 2.5, per100gCarbs: 6.5, per100gFat: 1.2, servingSizeG: 200 },
  { offId: "ind_rasam", name: "Rasam", category: "South Indian", per100gCalories: 30, per100gProtein: 1.5, per100gCarbs: 4.5, per100gFat: 1.0, servingSizeG: 150 },
  { offId: "ind_coconut_chutney", name: "Coconut Chutney", category: "South Indian", per100gCalories: 180, per100gProtein: 2.5, per100gCarbs: 8.0, per100gFat: 16.0, servingSizeG: 50 },
  { offId: "ind_appam", name: "Appam", category: "South Indian", per100gCalories: 120, per100gProtein: 2.5, per100gCarbs: 23.0, per100gFat: 2.0, servingSizeG: 60 },
  { offId: "ind_pesarattu", name: "Pesarattu (moong dosa)", category: "South Indian", per100gCalories: 130, per100gProtein: 7.0, per100gCarbs: 21.0, per100gFat: 2.0, servingSizeG: 80 },
  { offId: "ind_vada_medu", name: "Medu Vada", category: "South Indian", per100gCalories: 250, per100gProtein: 8.0, per100gCarbs: 26.0, per100gFat: 13.0, servingSizeG: 40 },
  { offId: "ind_upma", name: "Upma", category: "South Indian", per100gCalories: 135, per100gProtein: 3.5, per100gCarbs: 22.0, per100gFat: 4.0, servingSizeG: 150 },
  { offId: "ind_rava_idli", name: "Rava Idli", category: "South Indian", per100gCalories: 110, per100gProtein: 3.5, per100gCarbs: 18.0, per100gFat: 3.0, servingSizeG: 50 },
  { offId: "ind_bisi_bele_bath", name: "Bisi Bele Bath", category: "South Indian", per100gCalories: 140, per100gProtein: 5.0, per100gCarbs: 22.0, per100gFat: 4.5 },

  // ── Dals & Legumes ──
  { offId: "ind_dal_makhani", name: "Dal Makhani", category: "Dal", per100gCalories: 140, per100gProtein: 6.0, per100gCarbs: 12.0, per100gFat: 8.0 },
  { offId: "ind_toor_dal", name: "Toor Dal (arhar dal, cooked)", category: "Dal", per100gCalories: 116, per100gProtein: 7.0, per100gCarbs: 20.0, per100gFat: 0.4 },
  { offId: "ind_moong_dal_cooked", name: "Moong Dal (cooked)", category: "Dal", per100gCalories: 105, per100gProtein: 7.0, per100gCarbs: 18.5, per100gFat: 0.4 },
  { offId: "ind_chana_dal_cooked", name: "Chana Dal (cooked)", category: "Dal", per100gCalories: 164, per100gProtein: 8.9, per100gCarbs: 27.0, per100gFat: 2.7 },
  { offId: "ind_masoor_dal_cooked", name: "Masoor Dal (red lentils, cooked)", category: "Dal", per100gCalories: 116, per100gProtein: 9.0, per100gCarbs: 20.0, per100gFat: 0.4 },
  { offId: "ind_urad_dal_cooked", name: "Urad Dal (cooked)", category: "Dal", per100gCalories: 105, per100gProtein: 7.0, per100gCarbs: 18.0, per100gFat: 0.5 },
  { offId: "ind_rajma_cooked", name: "Rajma (kidney beans, cooked)", category: "Dal", per100gCalories: 127, per100gProtein: 8.7, per100gCarbs: 22.0, per100gFat: 0.5 },
  { offId: "ind_chole_chana_masala", name: "Chole / Chana Masala", category: "Dal", per100gCalories: 120, per100gProtein: 7.0, per100gCarbs: 15.0, per100gFat: 4.0 },
  { offId: "ind_dal_tadka", name: "Dal Tadka", category: "Dal", per100gCalories: 100, per100gProtein: 5.5, per100gCarbs: 15.0, per100gFat: 2.5 },
  { offId: "ind_dal_fry", name: "Dal Fry", category: "Dal", per100gCalories: 110, per100gProtein: 5.5, per100gCarbs: 14.0, per100gFat: 4.0 },
  { offId: "ind_sambhar_dal", name: "Sambar Dal (toor dal for sambar)", category: "Dal", per100gCalories: 45, per100gProtein: 2.5, per100gCarbs: 6.5, per100gFat: 1.2 },

  // ── Vegetable Dishes ──
  { offId: "ind_aloo_gobi", name: "Aloo Gobi", category: "Sabzi", per100gCalories: 80, per100gProtein: 2.5, per100gCarbs: 11.0, per100gFat: 3.0 },
  { offId: "ind_palak_paneer", name: "Palak Paneer", category: "Sabzi", per100gCalories: 150, per100gProtein: 7.0, per100gCarbs: 5.0, per100gFat: 11.0 },
  { offId: "ind_matar_paneer", name: "Matar Paneer", category: "Sabzi", per100gCalories: 160, per100gProtein: 7.5, per100gCarbs: 9.0, per100gFat: 11.0 },
  { offId: "ind_bhindi_masala", name: "Bhindi Masala (okra)", category: "Sabzi", per100gCalories: 75, per100gProtein: 2.0, per100gCarbs: 9.0, per100gFat: 3.5 },
  { offId: "ind_baingan_bharta", name: "Baingan Bharta (roasted eggplant)", category: "Sabzi", per100gCalories: 70, per100gProtein: 2.0, per100gCarbs: 8.0, per100gFat: 3.5 },
  { offId: "ind_aloo_sabzi", name: "Aloo Sabzi (potato curry)", category: "Sabzi", per100gCalories: 90, per100gProtein: 2.0, per100gCarbs: 14.0, per100gFat: 3.0 },
  { offId: "ind_mix_veg_curry", name: "Mixed Vegetable Curry", category: "Sabzi", per100gCalories: 75, per100gProtein: 2.5, per100gCarbs: 9.0, per100gFat: 3.5 },
  { offId: "ind_shahi_paneer", name: "Shahi Paneer", category: "Sabzi", per100gCalories: 195, per100gProtein: 8.0, per100gCarbs: 8.0, per100gFat: 15.0 },
  { offId: "ind_paneer_butter_masala", name: "Paneer Butter Masala", category: "Sabzi", per100gCalories: 200, per100gProtein: 8.0, per100gCarbs: 9.0, per100gFat: 15.0 },
  { offId: "ind_kadai_paneer", name: "Kadai Paneer", category: "Sabzi", per100gCalories: 175, per100gProtein: 8.0, per100gCarbs: 7.0, per100gFat: 13.0 },
  { offId: "ind_gobi_manchurian", name: "Gobi Manchurian", category: "Sabzi", per100gCalories: 180, per100gProtein: 4.0, per100gCarbs: 22.0, per100gFat: 9.0 },

  // ── Chicken Dishes ──
  { offId: "ind_butter_chicken", name: "Butter Chicken (murgh makhani)", category: "Chicken", per100gCalories: 160, per100gProtein: 15.0, per100gCarbs: 8.0, per100gFat: 8.0 },
  { offId: "ind_chicken_curry", name: "Chicken Curry", category: "Chicken", per100gCalories: 140, per100gProtein: 16.0, per100gCarbs: 4.0, per100gFat: 7.0 },
  { offId: "ind_chicken_biryani", name: "Chicken Biryani", category: "Rice", per100gCalories: 160, per100gProtein: 9.0, per100gCarbs: 23.0, per100gFat: 4.0 },
  { offId: "ind_tandoori_chicken", name: "Tandoori Chicken", category: "Chicken", per100gCalories: 170, per100gProtein: 24.0, per100gCarbs: 4.0, per100gFat: 7.0 },
  { offId: "ind_chicken_tikka_masala", name: "Chicken Tikka Masala", category: "Chicken", per100gCalories: 155, per100gProtein: 15.5, per100gCarbs: 7.0, per100gFat: 8.0 },
  { offId: "ind_chicken_tikka", name: "Chicken Tikka", category: "Chicken", per100gCalories: 180, per100gProtein: 25.0, per100gCarbs: 5.0, per100gFat: 7.0 },
  { offId: "ind_kadai_chicken", name: "Kadai Chicken", category: "Chicken", per100gCalories: 145, per100gProtein: 17.0, per100gCarbs: 5.0, per100gFat: 7.0 },
  { offId: "ind_chicken_keema", name: "Chicken Keema", category: "Chicken", per100gCalories: 165, per100gProtein: 20.0, per100gCarbs: 4.0, per100gFat: 8.0 },
  { offId: "ind_chicken_65", name: "Chicken 65", category: "Chicken", per100gCalories: 220, per100gProtein: 22.0, per100gCarbs: 9.0, per100gFat: 11.0 },

  // ── Mutton / Lamb ──
  { offId: "ind_mutton_curry", name: "Mutton Curry", category: "Mutton", per100gCalories: 200, per100gProtein: 18.0, per100gCarbs: 4.0, per100gFat: 12.5 },
  { offId: "ind_mutton_biryani", name: "Mutton Biryani", category: "Rice", per100gCalories: 175, per100gProtein: 10.0, per100gCarbs: 22.0, per100gFat: 5.5 },
  { offId: "ind_mutton_rogan_josh", name: "Mutton Rogan Josh", category: "Mutton", per100gCalories: 210, per100gProtein: 19.0, per100gCarbs: 5.0, per100gFat: 13.0 },
  { offId: "ind_keema_matar", name: "Keema Matar (minced mutton)", category: "Mutton", per100gCalories: 185, per100gProtein: 17.0, per100gCarbs: 7.0, per100gFat: 11.0 },

  // ── Fish & Seafood ──
  { offId: "ind_fish_curry", name: "Fish Curry", category: "Seafood", per100gCalories: 120, per100gProtein: 14.0, per100gCarbs: 4.0, per100gFat: 5.5 },
  { offId: "ind_prawn_curry", name: "Prawn Curry", category: "Seafood", per100gCalories: 115, per100gProtein: 15.0, per100gCarbs: 4.0, per100gFat: 5.0 },
  { offId: "ind_fish_fry", name: "Fish Fry (fried fish)", category: "Seafood", per100gCalories: 200, per100gProtein: 20.0, per100gCarbs: 6.0, per100gFat: 11.0 },

  // ── Egg Dishes ──
  { offId: "ind_egg_curry", name: "Egg Curry", category: "Eggs", per100gCalories: 140, per100gProtein: 11.0, per100gCarbs: 5.0, per100gFat: 9.0 },
  { offId: "ind_egg_bhurji", name: "Egg Bhurji (scrambled eggs masala)", category: "Eggs", per100gCalories: 160, per100gProtein: 12.0, per100gCarbs: 4.0, per100gFat: 11.0 },
  { offId: "ind_omelette_masala", name: "Masala Omelette", category: "Eggs", per100gCalories: 175, per100gProtein: 12.0, per100gCarbs: 3.0, per100gFat: 13.0 },
  { offId: "ind_boiled_egg", name: "Boiled Egg", category: "Eggs", per100gCalories: 155, per100gProtein: 13.0, per100gCarbs: 1.1, per100gFat: 11.0, servingSizeG: 50 },

  // ── Dairy ──
  { offId: "ind_paneer_raw", name: "Paneer (raw)", category: "Dairy", per100gCalories: 265, per100gProtein: 18.3, per100gCarbs: 3.4, per100gFat: 20.8 },
  { offId: "ind_curd_full_fat", name: "Curd / Dahi (full fat)", category: "Dairy", per100gCalories: 98, per100gProtein: 3.1, per100gCarbs: 4.7, per100gFat: 4.3 },
  { offId: "ind_curd_low_fat", name: "Curd / Dahi (low fat)", category: "Dairy", per100gCalories: 52, per100gProtein: 3.8, per100gCarbs: 5.5, per100gFat: 1.5 },
  { offId: "ind_ghee", name: "Ghee (clarified butter)", category: "Fats", per100gCalories: 900, per100gProtein: 0.0, per100gCarbs: 0.0, per100gFat: 99.0, servingSizeG: 10 },
  { offId: "ind_whole_milk", name: "Whole Milk (cow, Indian)", category: "Dairy", per100gCalories: 61, per100gProtein: 3.2, per100gCarbs: 4.4, per100gFat: 3.5 },
  { offId: "ind_toned_milk", name: "Toned Milk", category: "Dairy", per100gCalories: 44, per100gProtein: 3.0, per100gCarbs: 4.6, per100gFat: 1.5 },
  { offId: "ind_buttermilk_chaas", name: "Chaas / Buttermilk", category: "Dairy", per100gCalories: 35, per100gProtein: 1.5, per100gCarbs: 4.0, per100gFat: 1.0 },
  { offId: "ind_lassi_sweet", name: "Lassi (sweet)", category: "Dairy", per100gCalories: 70, per100gProtein: 3.0, per100gCarbs: 10.0, per100gFat: 2.0, servingSizeG: 250 },
  { offId: "ind_lassi_plain", name: "Lassi (plain salted)", category: "Dairy", per100gCalories: 55, per100gProtein: 3.0, per100gCarbs: 4.5, per100gFat: 2.5, servingSizeG: 250 },
  { offId: "ind_kheer", name: "Kheer (rice pudding)", category: "Desserts", per100gCalories: 125, per100gProtein: 3.5, per100gCarbs: 20.0, per100gFat: 3.5 },

  // ── Breakfast / Snacks ──
  { offId: "ind_poha", name: "Poha (flattened rice)", category: "Breakfast", per100gCalories: 130, per100gProtein: 3.0, per100gCarbs: 25.0, per100gFat: 2.5 },
  { offId: "ind_upma_rava", name: "Upma (rava/semolina)", category: "Breakfast", per100gCalories: 135, per100gProtein: 3.5, per100gCarbs: 22.0, per100gFat: 4.0 },
  { offId: "ind_pongal_ven", name: "Ven Pongal", category: "South Indian", per100gCalories: 130, per100gProtein: 4.0, per100gCarbs: 20.0, per100gFat: 4.5 },
  { offId: "ind_sheera_sooji_halwa", name: "Sooji Halwa / Sheera", category: "Desserts", per100gCalories: 200, per100gProtein: 3.5, per100gCarbs: 32.0, per100gFat: 7.0 },
  { offId: "ind_samosa", name: "Samosa (potato)", category: "Snacks", per100gCalories: 262, per100gProtein: 5.5, per100gCarbs: 31.0, per100gFat: 13.0, servingSizeG: 60 },
  { offId: "ind_pakora_onion", name: "Onion Pakora (bhaji)", category: "Snacks", per100gCalories: 275, per100gProtein: 5.0, per100gCarbs: 28.0, per100gFat: 16.0, servingSizeG: 50 },
  { offId: "ind_pakora_veg", name: "Vegetable Pakora", category: "Snacks", per100gCalories: 255, per100gProtein: 5.5, per100gCarbs: 26.0, per100gFat: 15.0, servingSizeG: 50 },
  { offId: "ind_pav_bhaji", name: "Pav Bhaji", category: "Snacks", per100gCalories: 130, per100gProtein: 3.5, per100gCarbs: 18.0, per100gFat: 5.0 },
  { offId: "ind_dhokla", name: "Dhokla", category: "Snacks", per100gCalories: 160, per100gProtein: 5.0, per100gCarbs: 27.0, per100gFat: 4.0, servingSizeG: 60 },
  { offId: "ind_kanda_poha", name: "Kanda Poha (with onion)", category: "Breakfast", per100gCalories: 140, per100gProtein: 3.5, per100gCarbs: 26.0, per100gFat: 3.5 },
  { offId: "ind_aloo_chaat", name: "Aloo Chaat", category: "Snacks", per100gCalories: 150, per100gProtein: 3.0, per100gCarbs: 25.0, per100gFat: 4.5 },

  // ── Rice Dishes ──
  { offId: "ind_veg_biryani", name: "Vegetable Biryani", category: "Rice", per100gCalories: 140, per100gProtein: 4.0, per100gCarbs: 25.0, per100gFat: 3.5 },
  { offId: "ind_pulao_veg", name: "Vegetable Pulao", category: "Rice", per100gCalories: 135, per100gProtein: 3.0, per100gCarbs: 26.0, per100gFat: 3.0 },
  { offId: "ind_khichdi", name: "Khichdi (dal rice)", category: "Rice", per100gCalories: 120, per100gProtein: 5.0, per100gCarbs: 20.0, per100gFat: 2.5 },
  { offId: "ind_curd_rice", name: "Curd Rice (thayir sadam)", category: "South Indian", per100gCalories: 110, per100gProtein: 3.5, per100gCarbs: 19.0, per100gFat: 2.5 },
  { offId: "ind_lemon_rice", name: "Lemon Rice", category: "South Indian", per100gCalories: 135, per100gProtein: 2.5, per100gCarbs: 27.0, per100gFat: 3.0 },
  { offId: "ind_tomato_rice", name: "Tomato Rice", category: "South Indian", per100gCalories: 128, per100gProtein: 2.5, per100gCarbs: 25.0, per100gFat: 3.0 },
  { offId: "ind_fried_rice", name: "Fried Rice (Indian style)", category: "Rice", per100gCalories: 155, per100gProtein: 4.0, per100gCarbs: 27.0, per100gFat: 4.0 },

  // ── Common Ingredients / Staples ──
  { offId: "ind_besan_flour", name: "Besan (chickpea flour)", category: "Ingredients", per100gCalories: 387, per100gProtein: 22.0, per100gCarbs: 58.0, per100gFat: 6.7 },
  { offId: "ind_atta_whole_wheat", name: "Whole Wheat Atta (flour)", category: "Ingredients", per100gCalories: 340, per100gProtein: 12.0, per100gCarbs: 70.0, per100gFat: 1.7 },
  { offId: "ind_maida_flour", name: "Maida (refined flour)", category: "Ingredients", per100gCalories: 348, per100gProtein: 10.0, per100gCarbs: 74.0, per100gFat: 1.0 },
  { offId: "ind_coconut_fresh", name: "Coconut (fresh grated)", category: "Ingredients", per100gCalories: 354, per100gProtein: 3.3, per100gCarbs: 15.0, per100gFat: 33.0 },
  { offId: "ind_coconut_milk", name: "Coconut Milk", category: "Ingredients", per100gCalories: 197, per100gProtein: 2.3, per100gCarbs: 2.8, per100gFat: 21.0 },
  { offId: "ind_mustard_oil", name: "Mustard Oil", category: "Fats", per100gCalories: 884, per100gProtein: 0.0, per100gCarbs: 0.0, per100gFat: 100.0, servingSizeG: 10 },
  { offId: "ind_cooking_oil", name: "Cooking Oil (sunflower/groundnut)", category: "Fats", per100gCalories: 884, per100gProtein: 0.0, per100gCarbs: 0.0, per100gFat: 100.0, servingSizeG: 10 },

  // ── Drinks ──
  { offId: "ind_masala_chai", name: "Masala Chai (with milk & sugar)", category: "Drinks", per100gCalories: 45, per100gProtein: 1.5, per100gCarbs: 6.0, per100gFat: 1.5, servingSizeG: 150 },
  { offId: "ind_black_tea", name: "Black Tea (no milk)", category: "Drinks", per100gCalories: 2, per100gProtein: 0.0, per100gCarbs: 0.5, per100gFat: 0.0, servingSizeG: 200 },
  { offId: "ind_filter_coffee", name: "Filter Coffee (with milk & sugar)", category: "Drinks", per100gCalories: 40, per100gProtein: 1.5, per100gCarbs: 5.5, per100gFat: 1.5, servingSizeG: 150 },

  // ── Desserts ──
  { offId: "ind_gulab_jamun", name: "Gulab Jamun", category: "Desserts", per100gCalories: 300, per100gProtein: 4.5, per100gCarbs: 50.0, per100gFat: 10.0, servingSizeG: 50 },
  { offId: "ind_rasgulla", name: "Rasgulla", category: "Desserts", per100gCalories: 186, per100gProtein: 4.0, per100gCarbs: 39.0, per100gFat: 1.5, servingSizeG: 50 },
  { offId: "ind_halwa_gajar", name: "Gajar Halwa (carrot halwa)", category: "Desserts", per100gCalories: 175, per100gProtein: 3.0, per100gCarbs: 27.0, per100gFat: 6.5 },
  { offId: "ind_payasam", name: "Payasam / Kheer", category: "Desserts", per100gCalories: 125, per100gProtein: 3.5, per100gCarbs: 20.0, per100gFat: 3.5 },
  { offId: "ind_ladoo_besan", name: "Besan Ladoo", category: "Desserts", per100gCalories: 430, per100gProtein: 8.0, per100gCarbs: 55.0, per100gFat: 20.0, servingSizeG: 40 },
];

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let inserted = 0;
  let skipped = 0;

  for (const food of INDIAN_FOODS) {
    try {
      await prisma.foodItem.upsert({
        where: { offId: food.offId },
        update: {
          name: food.name,
          per100gCalories: food.per100gCalories,
          per100gProtein: food.per100gProtein,
          per100gCarbs: food.per100gCarbs,
          per100gFat: food.per100gFat,
          servingSizeG: food.servingSizeG ?? null,
        },
        create: {
          offId: food.offId,
          name: food.name,
          per100gCalories: food.per100gCalories,
          per100gProtein: food.per100gProtein,
          per100gCarbs: food.per100gCarbs,
          per100gFat: food.per100gFat,
          servingSizeG: food.servingSizeG ?? null,
        },
      });
      inserted++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    message: `Seeded ${inserted} Indian foods. ${skipped} skipped.`,
    total: INDIAN_FOODS.length,
  });
}
