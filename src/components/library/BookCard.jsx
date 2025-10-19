export default function BookCard({ book, onBookClick }) {
  const handleClick = () => {
    onBookClick?.(book.id)
  }

  return (
    <button
      type="button"
      className="book-card-simple"
      onClick={handleClick}
      aria-label={`View ${book.title}`}
    >
      <div className="book-card-image">
        <img src={book.cover} alt={book.title} />
      </div>
      <h3 className="book-card-title">{book.title}</h3>
    </button>
  )
}
