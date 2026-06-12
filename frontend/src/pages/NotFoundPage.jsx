import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="screen-center column">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="primary-button" to="/">
        Back to dashboard
      </Link>
    </div>
  );
}
