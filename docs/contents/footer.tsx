export default function Footer() {
  return (
    <div className="footer">
      <div>
        © {new Date().getFullYear()}{' '}
        <a href="https://github.com/2wheeh" target="_blank" rel="noopener noreferrer">
          wnhlee
        </a>
        .
      </div>
    </div>
  );
}
