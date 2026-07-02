import { DB, titleText, text, sel, check, queryAll } from "../../lib/notion";

// GET /api/learn -> { quotes, one: {books, courses}, courses, books }
export default async function handler(req, res) {
  try {
    const [quotePages, coursePages, bookPages] = await Promise.all([
      queryAll(DB.quotes),
      queryAll(DB.courses),
      queryAll(DB.library),
    ]);

    const quotes = quotePages
      .map((p) => ({ quote: titleText(p), author: text(p, "Author") }))
      .filter((q) => q.quote);

    const courses = coursePages.map((p) => ({
      id: p.id,
      url: p.url,
      course: titleText(p),
      instructor: text(p, "Instructor"),
      category: sel(p, "Category"),
      status: sel(p, "Status"),
      focus: check(p, "🎯 Focus"),
    }));

    const books = bookPages.map((p) => ({
      id: p.id,
      url: p.url,
      title: titleText(p),
      author: text(p, "Author"),
      status: sel(p, "Status"),
      focus: check(p, "🎯 Focus"),
    }));

    res.status(200).json({
      quotes,
      one: {
        books: books.filter((b) => b.focus),
        courses: courses.filter((c) => c.focus),
      },
      courses,
      books,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
