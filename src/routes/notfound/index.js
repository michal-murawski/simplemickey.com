import style from './style.css';
import { Link } from 'preact-router/match';

const Notfound = () => (
  <div class={style.notfound}>
    <h1>Error 404</h1>
    <p>That page doesn't exist.</p>
    <Link href="/">
      <h4>Back to Home</h4>
    </Link>
  </div>
);

export default Notfound;
