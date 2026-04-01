import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.foodLog.deleteMany();
  await prisma.mealPlanEntry.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  // Create household
  const household = await prisma.household.create({
    data: { name: "Our Household" },
  });
  console.log(`Created household: ${household.name} (invite code: ${household.inviteCode})`);

  // Create user 1 (you)
  const user1 = await prisma.user.create({
    data: {
      email: "abhi@example.com",
      passwordHash: await bcrypt.hash("password123", 12),
      name: "Abhi",
      householdId: household.id,
      preferences: {
        create: {
          calorieGoal: 2200,
          proteinGoalG: 150,
          carbsGoalG: 220,
          fatGoalG: 80,
        },
      },
    },
  });

  // Create user 2 (wife)
  const user2 = await prisma.user.create({
    data: {
      email: "wife@example.com",
      passwordHash: await bcrypt.hash("password123", 12),
      name: "Wife",
      householdId: household.id,
      preferences: {
        create: {
          calorieGoal: 1800,
          proteinGoalG: 120,
          carbsGoalG: 180,
          fatGoalG: 65,
        },
      },
    },
  });

  // Default shopping list
  await prisma.shoppingList.create({
    data: { householdId: household.id, name: "Shopping List" },
  });

  console.log(`Created user: ${user1.name} (${user1.email})`);
  console.log(`Created user: ${user2.name} (${user2.email})`);
  console.log("\nSeed credentials:");
  console.log("  abhi@example.com / password123");
  console.log("  wife@example.com / password123");
  console.log(`\nHousehold invite code: ${household.inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
