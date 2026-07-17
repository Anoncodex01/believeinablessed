export default function ProductsGrid({ children, className = '' }) {
  return (
    <div
      className={`products-grid ${className}`.trim()}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        columnGap: '0.75rem',
        rowGap: '1.75rem',
      }}
    >
      {children}
    </div>
  );
}
