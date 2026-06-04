// Helper script to generate a sample database -> example/db.js
// To run: node generateData.js

const fs = require('fs');
const path = require('path');
const cardCount = 10;

const generateCards = (count) => {
  const statuses = ['todo', 'in-progress', 'done'];
  
  // Pool of basic, popular tasks
  const tasks = [
    "Buy groceries", "Call friends", "Clean the kitchen", "Laundry", 
    "Pay electric bill", "Gym session", "Walk the dog", "Read a chapter of a book", 
    "Schedule dentist appointment", "Water the plants", "Vacuum the living room",
    "Take out the recycling", "Meal prep for the week", "Wash the car",
    "Change bed sheets", "Reply to pending emails", "Mow the lawn",
    "Organize the hall closet", "Buy a birthday gift", "Update computer software",
    "Dust the bookshelves", "Pay internet bill", "Clean out the fridge",
    "Go for a 30-minute run", "Pick up dry cleaning", "Renew car insurance",
    "Take vitamins", "Unload the dishwasher", "Fill up the gas tank",
    "Review monthly budget"
  ];

  const cards = [];

  for (let i = 1; i <= count; i++) {
    // Pick a random task title and status
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    cards.push({
      id: `c${i}`,
      title: `${randomTask} #${i}`,
      description: `Auto-generated description for task ${i}.`,
      status: randomStatus,
      // Generate a random past date
      createdAt: Date.now() - Math.floor(Math.random() * 10000000000) 
    });
  }

  return { cards };
};

const data = generateCards(cardCount);

// Define the path to db.json file
const dbPath = path.join(__dirname, 'example', 'db.json');

// Write the data to the file
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

console.log(`Successfully generated ${cardCount} cards in ${dbPath}`);