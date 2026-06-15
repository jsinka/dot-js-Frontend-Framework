import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Grab the arguments and parse the first one as an integer.
// Default to 1000 if no argument is passed or if it's not a valid number.
const args = process.argv.slice(2);
const input = parseInt(args[0], 10);
const cardCount = isNaN(input) ? 10 : input;

const tasks = [
  'Buy groceries', 'Call friends', 'Clean the kitchen', 'Laundry',
  'Pay electric bill', 'Gym session', 'Walk the dog', 'Read a chapter of a book',
  'Schedule dentist appointment', 'Water the plants', 'Vacuum the living room',
  'Take out the recycling', 'Meal prep for the week', 'Wash the car',
  'Change bed sheets', 'Reply to pending emails', 'Mow the lawn',
  'Organize the hall closet', 'Buy a birthday gift', 'Update computer software',
  'Dust the bookshelves', 'Pay internet bill', 'Clean out the fridge',
  'Go for a 30-minute run', 'Pick up dry cleaning', 'Renew car insurance',
  'Take vitamins', 'Unload the dishwasher', 'Fill up the gas tank',
  'Review monthly budget',
];

const statuses = ['todo', 'in-progress', 'done'];

const cards = Array.from({ length: cardCount }, (_, i) => ({
  id: `c${i + 1}`,
  title: `${tasks[Math.floor(Math.random() * tasks.length)]} #${i + 1}`,
  description: `Auto-generated description for task ${i + 1}.`,
  status: statuses[Math.floor(Math.random() * statuses.length)],
  createdAt: Date.now() - Math.floor(Math.random() * 10_000_000_000),
}));

const dbPath = resolve(__dirname, 'example', 'db.json');
writeFileSync(dbPath, JSON.stringify({ cards }, null, 2));
console.log(`Generated ${cardCount} cards → ${dbPath}`);