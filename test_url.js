import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:9780593083321&key=${process.env.GOOGLE_BOOKS_API_KEY}`)
.then(r=>r.json())
.then(d=> {
  console.log(d.items[0].volumeInfo.imageLinks);
});
